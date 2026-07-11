import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:5000'
const apiProxy = {
  target: apiProxyTarget,
  changeOrigin: true,
}

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['app-dev.incretlabs.my.id'],
    proxy: {
      '/api': apiProxy,
      '/auth': apiProxy,
      '/users': apiProxy,
      '/platforms': apiProxy,
      '/agents': apiProxy,
      '/chats': apiProxy,
      '/analytics': apiProxy,
      '/billing': apiProxy,
      '/profile': apiProxy,
      '/contacts': apiProxy,
      '/integrations': apiProxy,
      '/complaints': apiProxy,
      '/orders': apiProxy,
      '/outlets': apiProxy,
      '/products': apiProxy,
      '/carts': apiProxy,
      '/payments': apiProxy,
      '/files': apiProxy,
      '/public-files': apiProxy,
      '/me': apiProxy,
    },
  },
})
