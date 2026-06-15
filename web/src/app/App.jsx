import { BrowserRouter } from 'react-router-dom'
import AppRoutes from '../routes/privateRoutes'
import Providers from './providers'

import '../shared/styles/globals.css'
import '../modules/chats/styles/inbox-modern.css'
import '../shared/styles/modal.css'
import '../modules/agents/styles/agents.css'
import '../modules/platforms/styles/platforms.css'
import '../modules/analytics/styles/analytics.css'
import '../modules/contacts/styles/contacts.css'
import '../modules/products/styles/products.css'

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  )
}
