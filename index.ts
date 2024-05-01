import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'

const app = Fastify()
await app.register(websocket)

const hocuspocus = Server.configure({
  async onConnect() {
    console.log('🔮')
  },

  extensions: [
    new SQLite({
      database: 'db.sqlite',
    }),
  ],
})

app.get('/collaboration', { websocket: true }, function wsHandler (socket, req) {
  hocuspocus.handleConnection(socket, req, {});
})

app.listen({ port: 1234 })
