import { defineConfig } from 'vite'

export default defineConfig({
  // Use relative asset URLs so packaged Electron file:// builds can load CSS/JS.
  base: './',
})
