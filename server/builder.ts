import { spawn } from 'child_process'
import { Hocuspocus } from '@hocuspocus/server'
import { RedisClientType } from 'redis'
import { BuildResult } from '../common/api'
import * as path from 'path'
import sqlite3 from 'sqlite3'
import { writeFile } from 'fs/promises'

async function buildForest(
  forestDir: string,
  output: string[],
  errors: string[]
): Promise<void> {
  const builder = spawn(
    'forester',
    ['build', '--dev', '--root', 'lc-0001', 'trees/'],
    { cwd: forestDir }
  ) //shouldn't just inherit to stdio, need to pipe to client
  builder.stdout.on('data', data => {
    output.push(data)
    console.log(data.toString())
  })
  builder.stderr.on('data', data => {
    errors.push(data)
    console.error(data.toString())
  })
  await new Promise((resolve, reject) => {
    builder.on('close', errno => {
      if (errno !== 0) {
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
}

async function saveDirty(
  hocuspocus: Hocuspocus,
  contentRoot: string,
) {
  await Promise.all([...hocuspocus.documents].map((nd) => {
    const [name, doc] = nd
    console.log(name)
    return writeFile(
      path.join(contentRoot, name), doc.getText('content')?.toString()
    )
  }))
}

export async function startBuilder(
  hocuspocus: Hocuspocus,
  _db: sqlite3.Database,
  subscriber: RedisClientType,
  writer: RedisClientType,
  forestDir: string,
  contentRoot: string
) {
  await writer.set('state', 'unbuilt')
  subscriber.subscribe('build_requests', async (_message, _channel) => {
    const state = await writer.get('state')
    if (state != 'building') {
      await writer.set('state', 'building')
      await writer.publish('build_notifications', 'building')
      await saveDirty(hocuspocus, contentRoot)
      const errors: string[] = []
      const output: string[] = []
      let res: BuildResult
      try {
        await buildForest(forestDir, errors, output)
        res = { success: true, content: '' }
      } catch (err) {
        res = {
          success: false,
          stdout: errors.join('\n'),
          stderr: output.join('\n')
        }
      }
      await writer.set('state', 'built')
      await writer.set('last_build_result', JSON.stringify(res))
      await writer.publish('build_notifications', 'finished')
    }
  })
  writer.publish('build_requests', '')
}
