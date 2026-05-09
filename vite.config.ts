import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackStart(),
    tsconfigPaths(),
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
})
