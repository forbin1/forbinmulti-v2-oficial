import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackStart(),
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
})
