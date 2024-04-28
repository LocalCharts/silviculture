use axum::Json;
use axum::{routing::post, Router};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Debug)]
#[ts(export)]
struct GreetRequest {
    name: String,
}

#[derive(TS, Serialize, Debug)]
#[ts(export)]
struct GreetResponse {
    message: String,
}

async fn greet(Json(req): Json<GreetRequest>) -> Json<GreetResponse> {
    Json(GreetResponse {
        message: format!("hello {}", req.name),
    })
}

#[tokio::main]
async fn main() {
    // build our application with a single route
    let app = Router::new().route("/", post(greet));

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}
