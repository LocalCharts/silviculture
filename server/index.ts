#!/usr/bin/env node

import { Server, onLoadDocumentPayload, onStoreDocumentPayload } from '@hocuspocus/server'
import { readFile, readdir, writeFile } from 'fs/promises'
import * as fastifyStatic from '@fastify/static'
import { spawn } from 'child_process'
import * as Y from 'yjs'
import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import * as path from 'path'
import { SQLiteWithFS } from './persistence.js'

const app = Fastify({ logger: true })

const forestDir = process.env.FOREST_DIR || '/tmp/forest'
const builtRoot = path.join(forestDir, 'output')
const contentRoot = path.join(forestDir, 'trees')
const dbPath = 'state.db'

app.register(fastifyStatic, {
  root: builtRoot,
  prefix: '/built'
})

await app.register(websocket) //vscode is being stupid

const persistence = new SQLiteWithFS(dbPath, contentRoot)

const hocuspocus = Server.configure({
  async onConnect() {
    console.log('🔮')
  },

  extensions: [persistence],
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
