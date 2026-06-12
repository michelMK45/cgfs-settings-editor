import { defineConfig } from 'vite'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  // Use relative asset URLs so packaged Electron file:// builds can load CSS/JS.
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
