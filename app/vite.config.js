import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Le site est servi depuis https://gbottollier.github.io/WikiSpam/
// et l'app Vue vit dans le sous-dossier /app/ -> base = '/WikiSpam/app/'.
// Si un jour tu passes sur un domaine perso à la racine, mets base: '/app/'.
export default defineConfig({
  base: '/WikiSpam/app/',
  plugins: [vue()],
})
