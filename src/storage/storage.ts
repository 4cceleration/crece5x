import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { get, put } from '@vercel/blob'

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>
  read(key: string): Promise<Buffer>
}

export function diskStorage(dir: string): Storage {
  return {
    async put(key, data) {
      const path = join(dir, key)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, data)
    },
    async read(key) {
      return readFile(join(dir, key))
    },
  }
}

export function blobStorage(): Storage {
  return {
    async put(key, data, contentType) {
      await put(key, data, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true })
    },
    async read(key) {
      const r = await get(key, { access: 'private' })
      if (!r || r.statusCode !== 200) throw new Error(`Archivo no encontrado: ${key}`)
      return Buffer.from(await new Response(r.stream).arrayBuffer())
    },
  }
}

export function getStorage(): Storage {
  return process.env.BLOB_READ_WRITE_TOKEN ? blobStorage() : diskStorage(process.env.UPLOAD_DIR ?? '.data/uploads')
}
