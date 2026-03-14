import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Use relative asset URLs so static deploys under subpaths keep working.
  base: './',
  plugins: [react(), tailwindcss()],
})
