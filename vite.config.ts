import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import UnoCSS from 'unocss/vite'
import solid from 'vite-plugin-solid'

const path = fileURLToPath(import.meta.url)
const root = resolve(dirname(path))

export default defineConfig({
  root,
  plugins: [
    UnoCSS(),
    solid()
  ],
  server: {
    proxy: {
      '/collaboration': {
        target: 'ws://localhost:1234',
        ws: true
      },
      '/api': {
        target: 'http://localhost:1234',
        changeOrigin: true
      },
      '/built': {
        target: 'http://localhost:1234',
        changeOrigin: true
      },
      '/resources': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        rewrite: (path) => '/built' + path
      }
    }
  }
})
