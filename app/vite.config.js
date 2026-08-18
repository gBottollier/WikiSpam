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
  '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
}

// In dev, the shared assets (img/, sound/, font.otf) live at the repo root and
// are deployed at /WikiSpam/ in prod. Serve them locally so `npm run dev` shows
// them (the Vue app itself is now served at the site root, /WikiSpam/).
function serveRootAssets() {
  return {
    name: 'serve-root-assets-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          const url = decodeURIComponent((req.url || '').split('?')[0])
          // font.otf (la police Oniyx) vit a la racine du site, pas dans un
          // dossier : on la sert explicitement en plus des dossiers partages.
          const m = url.match(/^\/WikiSpam\/((?:img|sound)\/.*|font\.otf)$/)
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

// Servi directement depuis https://gbottollier.github.io/WikiSpam/ (l'app Vue
// est desormais a la racine du site ; il n'y a plus de site statique).
export default defineConfig({
  base: '/WikiSpam/',
  plugins: [vue(), serveRootAssets()],
})
