import { Server, onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server'
import { readFile, readdir, writeFile } from 'fs/promises'
import * as fastifyStatic from '@fastify/static'
import { spawn } from 'child_process'
import * as Y from 'yjs'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import * as path from 'path'

const app = Fastify({ logger: true })

const builtRoot = '/tmp/forest/output'
const contentRoot = '/tmp/forest/trees'

app.register(fastifyStatic, {
  root: builtRoot,
  prefix: '/built'
})

await app.register(websocket) //vscode is being stupid


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
//this is wrong, will cause duplicated text when backend is restarted while frontend stays on
  async onLoadDocument(data: onLoadDocumentPayload) {
    const name = data.documentName
    const contents = await readFile(path.join(contentRoot, name), { encoding: 'utf8' })
    const doc = new Y.Doc()
    const ycontents = doc.getText('content')
    ycontents.insert(0, contents)
    return doc
  },

  async onStoreDocument(data: onStoreDocumentPayload) {
    const name = data.documentName
    await writeFile(contentRoot + "/" + name, data.document.getText('content').toString(), {})
  },

  extensions: [],
})

app.get('/collaboration', { websocket: true }, (socket, req) => {
  hocuspocus.handleConnection(socket, req as any, {});
})

app.post('/api/build', async (req) => {
  const tree = (req.body as any).tree
  console.log("building...")
  const treeContent = hocuspocus.documents.get(tree + ".tree")?.getText('content').toString() as string
  await writeFile(path.join(contentRoot, tree + ".tree"), treeContent)
  const builder = spawn('forester', ['build', '--dev', '--root', 'lc-0001', 'trees/'], { cwd: '/tmp/forest' }) //shouldn't just inherit to stdio, need to pipe to client
  const output: string[] = []
  builder.stdout.on('data', data => {
    output.push(data)
    console.log(data.toString())
  })
  const errors: string[] = []
  builder.stderr.on('data', data => {
    errors.push(data)
    console.error(data.toString())
  })
  const finishedPromise = new Promise((resolve, reject) => { //reject not yet handled!
    builder.on('close', errno => {
      if (errno !== 0) {
        console.log('build failed')
        reject(new Error(`build failed with code ${errno}`))
      } else {
        console.log('build succeeded')
        resolve({})
      }
    })
    builder.on('error', (err) => {
      reject(err)
    })
  })
  try {
    await finishedPromise
    const content = await readFile(path.join(builtRoot, tree + ".xml"), {encoding: 'utf8'})
    return { success: true, content }
  } catch (err) {
    console.log(err)
    return { success: false, stdout: errors.join('\n'), stderr: output.join('\n') }
  }
})

app.get('/api/trees', async (_req) => {
  return (await readdir(contentRoot))
})

app.listen({ port: 1234 })
