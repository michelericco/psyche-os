import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// When deploying to GitHub Pages the app lives at /<repo-name>/.
// VITE_BASE_PATH lets CI override this; defaults to the psyche-os subpath.
const base = process.env['VITE_BASE_PATH'] ?? '/psyche-os/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          d3: ['d3-force'],
        },
      },
    },
  },
})
