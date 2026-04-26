import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // VITE_BASE_PATH env var lets us deploy to GitHub Pages subpath (/boxday/) or root (/)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  base: (globalThis as any).process?.env?.VITE_BASE_PATH ?? '/',
})
