import { useState } from 'react'

export default function CategoryTabs({ categories, selectedCategoryId, onSelect, searchQuery, onSearchChange }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <nav className="mt-4 overflow-x-auto px-4" aria-label="Kategori menu">
      <div className="flex min-w-max gap-2 pb-1">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
          aria-label="Cari menu"
          onClick={() => setSearchOpen((open) => !open)}
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
        {searchOpen && (
          <label className="block shrink-0">
            <span className="sr-only">Cari menu Selkop</span>
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-11 w-44 rounded-full border border-gray-100 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)]"
              placeholder="Cari menu"
            />
          </label>
        )}
        {categories.map((category) => {
          const active = category.id === selectedCategoryId
          return (
            <button
              key={category.id}
              type="button"
              className={`h-11 rounded-full px-4 text-sm font-bold transition ${
                active
                  ? 'bg-[var(--brand-500)] text-white shadow-sm'
                  : 'border border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => onSelect(category.id)}
            >
              {category.name}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
