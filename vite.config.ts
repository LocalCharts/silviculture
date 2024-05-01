import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import UnoCSS from 'unocss/vite'
import solid from 'vite-plugin-solid'

const path = fileURLToPath(import.meta.url)
const root = resolve(dirname(path), 'src')

export default defineConfig({
  root,
  plugins: [
    UnoCSS(),
    solid()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
