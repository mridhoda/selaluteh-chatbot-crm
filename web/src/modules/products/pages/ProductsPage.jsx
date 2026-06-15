import { useMemo, useState } from 'react'

const summaryCards = [
  { label: 'Total Products', value: 128, change: '18%', direction: 'up', comparison: 'vs last month', icon: 'cube', tone: 'purple' },
  { label: 'Active Products', value: 98, change: '12%', direction: 'up', comparison: 'vs last month', icon: 'check', tone: 'green' },
  { label: 'Draft Products', value: 18, change: '5%', direction: 'down', comparison: 'vs last month', icon: 'archive', tone: 'yellow' },
  { label: 'Archived Products', value: 12, change: '8%', direction: 'down', comparison: 'vs last month', icon: 'box', tone: 'gray' },
  { label: 'Out of Stock', value: 5, change: '15%', direction: 'down', comparison: 'vs last month', icon: 'tag', tone: 'blue' },
]

const products = [
  { id: 'product-001', name: 'Selalu Teh Original', description: 'Teh Susu Original', sku: 'ST-ORI-250', category: 'Minuman', basePrice: 18000, outlets: 5, stock: 120, stockLabel: '120+', status: 'active', updatedDate: '16 May 2025', updatedTime: '08:30', image: '/assets/products/selalu-teh-original.png', fallback: '🧋' },
  { id: 'product-002', name: 'Selalu Teh Matcha', description: 'Teh Susu Matcha', sku: 'ST-MAT-250', category: 'Minuman', basePrice: 22000, outlets: 4, stock: 45, stockLabel: '45', status: 'active', updatedDate: '15 May 2025', updatedTime: '14:20', image: '/assets/products/selalu-teh-matcha.png', fallback: '🍵' },
  { id: 'product-003', name: 'Selalu Teh Lemon', description: 'Teh Lemon Segar', sku: 'ST-LEM-250', category: 'Minuman', basePrice: 17000, outlets: 5, stock: 80, stockLabel: '80', status: 'active', updatedDate: '15 May 2025', updatedTime: '11:05', image: '/assets/products/selalu-teh-lemon.png', fallback: '🍋' },
  { id: 'product-004', name: 'Cookies Choco Chip', description: 'Cookies Cokelat', sku: 'CK-CC-100', category: 'Makanan', basePrice: 15000, outlets: 3, stock: 12, stockLabel: '12', status: 'low_stock', updatedDate: '14 May 2025', updatedTime: '19:10', image: '/assets/products/cookies-choco-chip.png', fallback: '🍪' },
  { id: 'product-005', name: 'Pudding Regal', description: 'Pudding dengan regal', sku: 'PD-RGL-120', category: 'Makanan', basePrice: 16000, outlets: 3, stock: 0, stockLabel: '0', status: 'out_of_stock', updatedDate: '14 May 2025', updatedTime: '16:45', image: '/assets/products/pudding-regal.png', fallback: '🍮' },
  { id: 'product-006', name: 'Brownies Classic', description: 'Brownies cokelat klasik', sku: 'BR-CLS-120', category: 'Makanan', basePrice: 20000, outlets: 2, stock: 25, stockLabel: '25', status: 'draft', updatedDate: '12 May 2025', updatedTime: '10:20', image: '/assets/products/brownies-classic.png', fallback: '🍫' },
]

const statusConfig = {
  active: { label: 'Active', className: 'product-status product-status--active' },
  low_stock: { label: 'Low Stock', className: 'product-status product-status--low-stock' },
  out_of_stock: { label: 'Out of Stock', className: 'product-status product-status--out-of-stock' },
  draft: { label: 'Draft', className: 'product-status product-status--draft' },
  archived: { label: 'Archived', className: 'product-status product-status--archived' },
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function SummaryIcon({ type }) {
  const icons = { cube: '⬡', check: '✓', archive: '▣', box: '■', tag: '◆' }
  return <span aria-hidden="true">{icons[type] ?? '•'}</span>
}

function ProductThumbnail({ src, name, fallback }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <div className="product-thumbnail">
      {!imageFailed && src ? <img src={src} alt={name} onError={() => setImageFailed(true)} /> : <span aria-hidden="true">{fallback}</span>}
    </div>
  )
}

function SelectChevron() {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function SearchIcon() {
  return <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M13.2 13.2L17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
}
function DownloadIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 3v9m0 0 3-3m-3 3L7 9M4 14v2h12v-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function UploadIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 13V4m0 0L7 7m3-3 3 3M4 14v2h12v-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function FilterIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 5h14l-5.5 6v4l-3 1v-5L3 5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
}
function EditIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M4 14.8V17h2.2L15 8.2 11.8 5 3 13.8l1 1zM10.8 6l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [outlet, setOutlet] = useState('all')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [page, setPage] = useState(1)

  const filteredProducts = useMemo(() => products.filter((product) => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch = !normalizedSearch || product.name.toLowerCase().includes(normalizedSearch) || product.description.toLowerCase().includes(normalizedSearch) || product.sku.toLowerCase().includes(normalizedSearch)
    const matchesCategory = category === 'all' || product.category.toLowerCase() === category.toLowerCase()
    const matchesStatus = status === 'all' || product.status === status
    const matchesAvailability = availability === 'all' || (availability === 'available' && product.stock > 0) || (availability === 'unavailable' && product.stock === 0)
    const matchesOutlet = outlet === 'all' || product.outlets > 0
    return matchesSearch && matchesCategory && matchesStatus && matchesAvailability && matchesOutlet
  }), [search, category, status, availability, outlet])

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedProducts.includes(product.id))

  function toggleProduct(productId) {
    setSelectedProducts((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredProducts.map((product) => product.id))
      setSelectedProducts((current) => current.filter((id) => !visibleIds.has(id)))
      return
    }
    setSelectedProducts((current) => [...new Set([...current, ...filteredProducts.map((product) => product.id)])])
  }

  return (
    <main className="products-page">
      <section className="products-page__header">
        <div><h1>Products</h1><p>Manage your product catalog, pricing, and availability across all outlets.</p></div>
        <div className="products-page__header-actions">
          <button className="product-button product-button--secondary"><DownloadIcon />Import</button>
          <button className="product-button product-button--secondary"><UploadIcon />Export</button>
          <button className="product-button product-button--primary" onClick={() => console.log('Open add product form')}><span aria-hidden="true">＋</span>Add Product</button>
        </div>
      </section>

      <section className="products-summary" aria-label="Product summary">
        {summaryCards.map((card) => <article key={card.label} className="product-summary-card"><div className={`product-summary-card__icon product-summary-card__icon--${card.tone}`}><SummaryIcon type={card.icon} /></div><div className="product-summary-card__content"><span className="product-summary-card__label">{card.label}</span><strong className="product-summary-card__value">{card.value}</strong><div className="product-summary-card__change"><span className={card.direction === 'up' ? 'summary-change summary-change--positive' : 'summary-change summary-change--negative'}>{card.direction === 'up' ? '▲' : '▼'} {card.change}</span><span>{card.comparison}</span></div></div></article>)}
      </section>

      <section className="products-panel">
        <div className="products-filters">
          <label className="products-search"><SearchIcon /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" /></label>
          <label className="product-select"><span className="product-select__label">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All Categories</option><option value="minuman">Minuman</option><option value="makanan">Makanan</option></select><SelectChevron /></label>
          <label className="product-select"><span className="product-select__label">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All Status</option><option value="active">Active</option><option value="draft">Draft</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option><option value="archived">Archived</option></select><SelectChevron /></label>
          <label className="product-select"><span className="product-select__label">Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">All</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select><SelectChevron /></label>
          <label className="product-select"><span className="product-select__label">Outlet</span><select value={outlet} onChange={(event) => setOutlet(event.target.value)}><option value="all">All Outlets</option><option value="samarinda">Selalu Teh Samarinda</option><option value="tenggarong">Selalu Teh Tenggarong</option><option value="bontang">Selalu Teh Bontang</option></select><SelectChevron /></label>
          <button className="product-button product-button--filter"><FilterIcon />More Filters</button>
          <button className="product-icon-button" title="Refresh products" aria-label="Refresh products">↻</button>
        </div>

        <div className="products-table-wrapper"><table className="products-table"><thead><tr><th className="products-table__checkbox"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all visible products" /></th><th>Product</th><th>SKU</th><th>Category</th><th>Price (Base)</th><th>Outlets</th><th>Stock</th><th>Status</th><th>Updated</th><th className="products-table__actions-heading">Actions</th></tr></thead><tbody>
          {filteredProducts.length > 0 ? filteredProducts.map((product) => {
            const productStatus = statusConfig[product.status]
            return <tr key={product.id}><td className="products-table__checkbox"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleProduct(product.id)} aria-label={`Select ${product.name}`} /></td><td><div className="product-identity"><ProductThumbnail src={product.image} name={product.name} fallback={product.fallback} /><div><strong>{product.name}</strong><span>{product.description}</span></div></div></td><td><span className="product-sku">{product.sku}</span></td><td><span className={`product-category product-category--${product.category.toLowerCase()}`}>{product.category}</span></td><td>{formatCurrency(product.basePrice)}</td><td>{product.outlets} outlets</td><td><span className={product.stock <= 12 ? 'product-stock product-stock--critical' : 'product-stock'}>{product.stockLabel}</span></td><td><span className={productStatus.className}>{productStatus.label}</span></td><td><div className="product-updated"><strong>{product.updatedDate}</strong><span>{product.updatedTime}</span></div></td><td><div className="products-table__actions"><button className="product-table-action" aria-label={`Edit ${product.name}`} onClick={() => console.log('Edit product:', product)}><EditIcon /></button><button className="product-table-action" aria-label={`More actions for ${product.name}`} onClick={() => console.log('Open product menu:', product)}>⋮</button></div></td></tr>
          }) : <tr><td colSpan="10" className="products-table__empty"><strong>No products found</strong><span>Try changing your filters or search query.</span></td></tr>}
        </tbody></table></div>
      </section>

      <footer className="products-pagination">
        <p>Showing 1 to {filteredProducts.length} of 128 products</p>
        <nav className="products-pagination__pages" aria-label="Products pagination"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>‹</button>{[1, 2, 3].map((pageNumber) => <button key={pageNumber} className={page === pageNumber ? 'products-pagination__page--active' : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}<span>…</span><button onClick={() => setPage(13)}>13</button><button disabled={page === 13} onClick={() => setPage((current) => current + 1)}>›</button></nav>
        <label className="products-page-size"><select defaultValue="10"><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select><SelectChevron /></label>
      </footer>
    </main>
  )
}
