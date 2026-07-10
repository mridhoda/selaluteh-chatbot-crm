import { useNavigate, useParams } from 'react-router-dom'

export default function StoreHeader({ brandName, subtitle = 'Online Store', logoUrl, cartCount, onOpenCart, storefrontSlug: storefrontSlugProp }) {
  const navigate = useNavigate()
  const { storefrontSlug } = useParams()
  const profileSlug = storefrontSlugProp || storefrontSlug
  const displayName = String(brandName || '').replace(/\s+Online\s+Store\s*$/i, '').trim()
  return (
    <header className="border-b border-gray-100 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 text-left">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-white">
            {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full rounded-2xl object-contain p-1" /> : displayName?.slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-gray-900">{displayName}</span>
            <span className="block truncate text-xs font-medium text-gray-500">{subtitle || 'Online Store'}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Akun saya"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm"
            onClick={() => profileSlug && navigate(`/store/${profileSlug}/profile`)}
          >
            <svg aria-hidden="true" className="h-5 w-5 text-[var(--store-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Buka keranjang"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm"
            onClick={onOpenCart}
          >
            <svg aria-hidden="true" className="h-5 w-5 text-[var(--store-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--store-primary)] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
