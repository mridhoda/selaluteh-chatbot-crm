import React from 'react'
import { createRoot } from 'react-dom/client'

const isPublicStore = /^(\/store\/|\/qr\/|\/order\/)/.test(window.location.pathname)
const { default: App } = await (isPublicStore ? import('./app/PublicStoreApp') : import('./app/App'))

createRoot(document.getElementById('root')).render(<App />)
