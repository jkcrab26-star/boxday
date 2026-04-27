import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // VITE_BASE_PATH lets us deploy to GitHub Pages subpath (/boxday/) or root (/)
  base: process.env.VITE_BASE_PATH ?? '/',
})
