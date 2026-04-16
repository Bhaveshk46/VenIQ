import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY),
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(process.env.VITE_FIREBASE_DATABASE_URL),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY),
    'import.meta.env.VITE_GOOGLE_DIRECTIONS_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_DIRECTIONS_API_KEY),
    'import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_GEOCODING_API_KEY),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
