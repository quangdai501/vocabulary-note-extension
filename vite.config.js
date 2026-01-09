import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        options: 'src/options/main.jsx'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'options' ? 'options.js' : '[name].js'
        },
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'options.css'
          }
          return '[name]-[hash].[ext]'
        }
      }
    }
  }
})