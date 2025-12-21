import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { dialogSavePlugin } from './vite-plugin-dialog-save'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), dialogSavePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
