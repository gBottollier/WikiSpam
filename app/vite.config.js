import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')

const MIME = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webm': 'video/webm', '.mp4': 'video/mp4',
}

// In dev, the shared static assets (img/, etc.) live at the repo root and are
// deployed at /WikiSpam/ in prod. Serve them locally so `npm run dev` shows them.
function serveRootAssets() {
  return {
    name: 'serve-root-assets-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          const url = decodeURIComponent((req.url || '').split('?')[0])
          const m = url.match(/^\/WikiSpam\/((?:img|css|js|fonts)\/.*)$/)
          if (m) {
            const filePath = path.join(repoRoot, m[1])
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
              fs.createReadStream(filePath).pipe(res)
              return
            }
          }
        } catch { /* fall through */ }
        next()
      })
    },
  }
}

// Servi depuis https://gbottollier.github.io/WikiSpam/  (app dans /app/).
export default defineConfig({
  base: '/WikiSpam/app/',
  plugins: [vue(), serveRootAssets()],
})
