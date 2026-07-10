import { getStorefrontThemeVars } from '../utils/storefrontTheme'

export default function PublicStoreLayout({ theme, children }) {
  const selkopThemeVars = {
    // Primary Colors
    '--brand-50': '#FFE1DE',        // Soft Red (card background/soft)
    '--brand-100': '#FFE1DE',       // Soft Border Red
    '--brand-200': '#FFA59E',
    '--brand-400': '#FF6C63',
    '--brand-500': '#FF2020',        // Selkop Red (Primary brand color, CTA, promo, active state)
    '--brand-600': '#FF4B4B',        // Muted Red (Hover states, softer highlight)
    '--brand-700': '#B31616',        // Darker red

    // Secondary/Blue (Selkop Blue)
    '--brand-blue-50': '#DCE8FF',   // Soft Blue
    '--brand-blue-500': '#3F6DCC',  // Selkop Blue

    // Supporting colors
    '--coffee-brown': '#4B2418',
    '--caramel': '#C46A2D',
    '--soft-border': '#E8DFD1',

    // Text overrides
    '--text-primary': '#080808',    // Ink Black
    '--text-secondary': '#4B2418',  // Coffee Brown
  }

  const combinedStyle = {
    ...getStorefrontThemeVars(theme),
    ...selkopThemeVars,
    overflowX: 'hidden',
    backgroundColor: '#FEF9F0', // Cream Base
  }

  return (
    <main className="min-h-screen w-full public-store-wrapper" style={combinedStyle}>
      <style>{`
        /* public store rebrand css overrides scoped to layout wrapper */
        .public-store-wrapper {
          background-color: #FEF9F0 !important;
          color: #080808 !important;
        }
        
        .public-store-wrapper .bg-gray-50,
        .public-store-wrapper .bg-slate-50,
        .public-store-wrapper main.bg-gray-50,
        .public-store-wrapper section.bg-gray-50,
        .public-store-wrapper div.bg-gray-50 {
          background-color: #FEF9F0 !important;
        }

        .public-store-wrapper .bg-white {
          background-color: #ffffff !important;
        }

        /* Borders override */
        .public-store-wrapper .border-gray-100,
        .public-store-wrapper .border-gray-200,
        .public-store-wrapper .border-slate-100,
        .public-store-wrapper .border-slate-200,
        .public-store-wrapper border {
          border-color: #E8DFD1 !important;
        }
        .public-store-wrapper .border-b,
        .public-store-wrapper .border-t,
        .public-store-wrapper .border-y {
          border-color: #E8DFD1 !important;
        }

        /* Text colors override */
        .public-store-wrapper .text-gray-900,
        .public-store-wrapper .text-slate-900,
        .public-store-wrapper h1,
        .public-store-wrapper h2,
        .public-store-wrapper h3,
        .public-store-wrapper h4 {
          color: #080808 !important;
        }

        .public-store-wrapper .text-gray-500,
        .public-store-wrapper .text-gray-600,
        .public-store-wrapper .text-slate-500,
        .public-store-wrapper .text-slate-600 {
          color: #4B2418 !important;
        }

        .public-store-wrapper .text-gray-400,
        .public-store-wrapper .text-slate-400 {
          color: #8B7D6B !important;
        }

        /* Secondary Outlined Buttons override to use Selkop Blue */
        .public-store-wrapper button[class*="border-[var(--brand-500)]"] {
          border-color: #3F6DCC !important;
          color: #3F6DCC !important;
        }
        .public-store-wrapper button[class*="border-[var(--brand-500)]"]:hover {
          background-color: #DCE8FF !important;
          color: #3F6DCC !important;
        }

        .public-store-wrapper a.text-gray-500:hover {
          color: #3F6DCC !important;
        }

        /* Focus state overrides */
        .public-store-wrapper input:focus,
        .public-store-wrapper textarea:focus {
          border-color: #3F6DCC !important;
          box-shadow: 0 0 0 4px rgba(63, 109, 204, 0.15) !important;
        }
      `}</style>
      
      <div
        className="mx-auto min-h-screen w-full max-w-md min-w-0 overflow-x-hidden bg-[#FEF9F0]"
        style={{ boxShadow: '0 0 0 1px rgba(15,23,42,0.04)' }}
      >
        {children}
      </div>
    </main>
  )
}
