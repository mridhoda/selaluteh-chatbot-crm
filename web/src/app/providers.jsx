import { ToastProvider } from '../shared/components/feedback/Toast'

export default function Providers({ children }) {
  return <ToastProvider>{children}</ToastProvider>
}
