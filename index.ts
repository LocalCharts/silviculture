import { Server, onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server'
import { readFile, readdir, writeFile } from 'fs/promises'
import * as fastifyStatic from '@fastify/static'
import { spawn } from 'child_process'
import * as Y from 'yjs'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import * as path from 'path'

const app = Fastify()

app.register(fastifyStatic, {
  root: '/tmp/forest/output',
  prefix: '/built'
})

await app.register(websocket)

const root = '/tmp/forest/trees'

export const schema = `CREATE TABLE IF NOT EXISTS "documents" (
  "name" varchar(255) NOT NULL,
  "path" varchar(255) NOT NULL,
  "data" blob NOT NULL,
  UNIQUE(name)
)`

const hocuspocus = Server.configure({
  async onConnect() {
    console.log('🔮')
  },

  async onLoadDocument(data: onLoadDocumentPayload) {
    const name = data.documentName
    const contents = await readFile(path.join(root, name), { encoding: 'utf8' })
    const doc = new Y.Doc()
    const ycontents = doc.getText('content')
    ycontents.insert(0, contents)
    return doc
  },

  async onStoreDocument(data: onStoreDocumentPayload) {
    const name = data.documentName
    await writeFile(root + "/" + name, data.document.getText('content').toString(), {})
  },

  extensions: [],
})

app.get('/collaboration', { websocket: true }, (socket, req) => {
  hocuspocus.handleConnection(socket, req as any, {});
})

app.post('/api/build', (_req) => {
  console.log("building...")
  const builder = spawn('build', { cwd: '/tmp/forest', stdio: 'inherit' })
  builder.on('close', _ => console.log('build finished'))
})

app.get('/api/trees', async (_req) => {
  return (await readdir(root))
})

app.listen({ port: 1234 })
