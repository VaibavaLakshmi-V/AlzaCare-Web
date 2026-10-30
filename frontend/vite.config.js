import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host: true listens on all addresses so a phone on the same Wi-Fi can open the app
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 5173, strictPort: true },
})
