import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      // @whiskeysockets/baileys is ESM-only ("type": "module"); it must be bundled
      // (not externalized) so Rollup performs the ESM->CJS default-export interop.
      // Otherwise Node's require() of it returns a non-callable namespace object.
      externalizeDeps: { exclude: ['@whiskeysockets/baileys'] },
      rollupOptions: {
        // Bundling baileys pulls in its transitive dep "ws", which isn't a direct
        // dependency and so isn't auto-externalized. Keep ws (and its optional
        // native addons, which aren't installed) external so ws's own guarded
        // require() calls run at runtime instead of failing during bundling.
        external: ['ws', 'bufferutil', 'utf-8-validate']
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
