import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// pixboard vite yapılandırması
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const PORT = env.PORT || 5173
  const BACKEND_URL = env.VITE_API_URL || 'http://localhost:3001'

  return {
    plugins: [react()],
    server: {
      port: parseInt(PORT),
      proxy: {
        '/api': BACKEND_URL,
        '/socket.io': {
          target: BACKEND_URL,
          ws: true
        }
      }
    }
  }
})
