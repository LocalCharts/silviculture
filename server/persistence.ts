import sqlite3 from 'sqlite3'
import * as path from 'path'
import * as Y from 'yjs'
import { readFile, writeFile } from 'fs/promises'
import { Extension, onLoadDocumentPayload, onChangePayload } from '@hocuspocus/server'

export const schema = `CREATE TABLE IF NOT EXISTS "documents" (
  "name" varchar(255) NOT NULL,
  "data" blob NOT NULL,
  UNIQUE(name)
)`

export const selectQuery = `
  SELECT data FROM "documents" where name = $name ORDER BY rowid DESC
`

export const upsertQuery = `
  INSERT INTO "documents" ("name", "data") VALUES ($name, $data)
    ON CONFLICT(name) DO UPDATE SET data = $data
`

export interface SQLiteWithFSConfiguration {
  databasePath: string,
  contentRoot: string,
  schema: string,
}

export class SQLiteWithFS implements Extension {
  db: sqlite3.Database
  contentRoot: string

  constructor(dbpath: string, contentRoot: string) {
    this.db = new sqlite3.Database(dbpath)
    this.db.run(schema)
    this.contentRoot = contentRoot
  }

  async onLoadDocument(data: onLoadDocumentPayload): Promise<Y.Doc> {
    return new Promise((resolve, reject) => {
      this.db?.get(selectQuery, {
        $name: data.documentName,
      }, async (error, row) => {
        if (error) {
          reject(error)
        } else if (typeof row == 'undefined') {
          try {
            const contents = await readFile(
              this.getPath(data.documentName),
              { encoding: 'utf8' }
            )
            const doc = data.document
            const ycontents = doc.getText('content')
            ycontents.insert(0, contents)
            resolve(data.document)
          } catch (err) {
            reject(err)
          }
        } else {
          Y.applyUpdate(data.document, (row as any)?.data)
          resolve(data.document)
        }
      })
    })
  }

  getPath(name: string) {
    return path.join(this.contentRoot, name)
  }

  async onStoreDocument(data: onChangePayload) {
    const name = data.documentName
    const doc = data.document
    this.db.run(upsertQuery, {
      $name: name,
      $data: Y.encodeStateAsUpdate(doc)
    })
    await writeFile(this.getPath(name), doc.getText('content').toString(), {})
  }
}
