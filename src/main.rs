use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use axum::{routing::post, Router};
use rand::prelude::*;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::select;
use tokio::sync::mpsc;
use yrs::sync::SyncMessage;
use yrs::updates::decoder::Decode;
use yrs::updates::encoder::Encode;
use yrs::*;

#[derive(Clone)]
struct AppState {
    outboxes: Arc<Mutex<HashMap<ConnId, mpsc::Sender<SyncMessage>>>>,
    inbox: mpsc::Sender<(ConnId, SyncMessage)>,
}

struct DocState {
    doc: Doc,
    outboxes: Arc<Mutex<HashMap<ConnId, mpsc::Sender<SyncMessage>>>>,
    inbox: mpsc::Receiver<(ConnId, SyncMessage)>,
}

async fn handle_update(bytes: Vec<u8>, state: &DocState, from: ConnId) {
    let update = Update::decode_v1(&bytes).unwrap();
    let mut txn = state.doc.transact_mut();
    txn.apply_update(update);
    let outboxes = state.outboxes.lock().unwrap();
    for (id, outbox) in outboxes.iter() {
        if *id != from {
            outbox
                .send(SyncMessage::Update(bytes.clone()))
                .await
                .unwrap();
        }
    }
}

async fn handle_message(message: SyncMessage, state: &DocState, from: ConnId) {
    match message {
        SyncMessage::SyncStep1(state_vector) => {
            let txn = state.doc.transact_mut();
            let bytes = txn.encode_diff_v1(&state_vector);
            let outboxes = state.outboxes.lock().unwrap();
            let outbox = outboxes.get(&from).unwrap();
            outbox.send(SyncMessage::SyncStep2(bytes)).await;
            let server_vector = txn.state_vector();
            outbox.send(SyncMessage::SyncStep1(server_vector)).await;
        }
        SyncMessage::SyncStep2(bytes) => handle_update(bytes, state, from).await,
        SyncMessage::Update(bytes) => handle_update(bytes, state, from).await,
    }
}

async fn manage_doc(mut state: DocState) {
    while let Some((from, msg)) = state.inbox.recv().await {
        handle_message(msg, &state, from).await;
    }
}

async fn serve_doc(ws: WebSocketUpgrade, state: AppState) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    let me = ConnId::new();
    let (tx, mut rx) = mpsc::channel::<SyncMessage>(9000);
    {
        let mut outboxes = state.outboxes.lock().unwrap();
        outboxes.insert(me, tx);
    }
    loop {
        select! {
            msg = socket.recv() => {
                if let Some(Ok(msg)) = msg {
                    match msg {
                        Message::Binary(bytes) => {
                            let msg = SyncMessage::decode_v1(&bytes).unwrap();
                            state.inbox.send((me, msg));
                        }
                        _ => {}
                    }
                } else {
                    println!("client abruptly disconnected");
                    return;
                }
            }
            response = rx.recv() => {
                if let Some(response) = response {
                    let msg = response.encode_v1();
                    socket.send(Message::Binary(msg));
                }
            }
        }
    }
}

#[derive(Copy, Clone, PartialEq, Eq, Hash)]
struct ConnId {
    id: u32,
}

impl ConnId {
    fn new() -> Self {
        ConnId { id: random() }
    }
}

#[tokio::main]
async fn main() {
    let state = AppState { doc: Doc::new() };

    let app = Router::new().route("/ws", post(move |ws| serve_doc(ws, state.clone())));

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}
