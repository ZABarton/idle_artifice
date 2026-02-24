import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { dialogSavePlugin } from './vite-plugin-dialog-save'
import { objectivesSavePlugin } from './vite-plugin-objectives-save'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), dialogSavePlugin(), objectivesSavePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
