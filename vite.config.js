import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PENTING: Ganti 'wedding-planner' dengan nama repository GitHub Anda
// Contoh: jika repo Anda bernama "rinaldi-naura-wedding", ubah menjadi '/rinaldi-naura-wedding/'
export default defineConfig({
  plugins: [react()],
  base: '/wedding-planner/',
})
