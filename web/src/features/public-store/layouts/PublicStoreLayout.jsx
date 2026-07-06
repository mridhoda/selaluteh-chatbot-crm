import { getStorefrontThemeVars } from '../utils/storefrontTheme'

export default function PublicStoreLayout({ theme, children }) {
  return (
    <main className="min-h-screen w-full bg-gray-50" style={getStorefrontThemeVars(theme)}>
      <div className="mx-auto min-h-screen w-full max-w-md bg-gray-50 shadow-[0_0_0_1px_rgba(15,23,42,0.04)]">
        {children}
      </div>
    </main>
  )
}
