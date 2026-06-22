import { useMemo, useState, useEffect } from 'react'
import api from '../../../shared/api/httpClient'
import { isDemoMode } from '../../../mocks/demoState'
import {
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  Filter,
  MoreVertical,
  Package2,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Warehouse,
  X,
  Trash2,
  UploadCloud,
  Calendar,
  Check,
  Bookmark,
} from 'lucide-react'

const dummyProducts = [
  {
    id: 1,
    name: 'Salty Caramel',
    sku: 'SKU-SEL-001',
    image: '/images/products/salty-caramel.png',
    category: 'Signature',
    outlets: 8,
    price: 24000,
    cost: 8500,
    stock: 32,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 4560000,
    salesChange: 18,
    totalSold: 190,
    description:
      'Perpaduan espresso, susu segar, caramel, dan sedikit sentuhan garam laut untuk rasa manis gurih yang seimbang.',
    tags: ['Best Seller', 'Premium'],
    tax: 'PPN 11%',
    trend: [
      420000, 430000, 760000, 840000, 690000, 790000, 950000, 820000, 910000,
      1200000, 1080000, 1140000,
    ],
    inventorySummary: { total: 236, lowStock: 15, outOfStock: 2 },
  },
  {
    id: 2,
    name: 'Kopi Susu Gula Aren',
    sku: 'SKU-SEL-002',
    image: '/images/products/gula-aren.png',
    category: 'Coffee',
    outlets: 8,
    price: 18000,
    cost: 7000,
    stock: 15,
    stockState: 'Low Stock',
    status: 'Active',
    salesMonth: 3240000,
    salesChange: 12,
    totalSold: 180,
    description:
      'Espresso creamy dengan gula aren yang ringan dan mudah disukai.',
    tags: ['Best Seller'],
    tax: 'PPN 11%',
    trend: [
      380000, 430000, 520000, 460000, 650000, 700000, 610000, 720000, 680000,
      790000, 760000, 820000,
    ],
    inventorySummary: { total: 188, lowStock: 12, outOfStock: 0 },
  },
  {
    id: 3,
    name: 'Matcha Latte',
    sku: 'SKU-SEL-003',
    image: '/images/products/matcha-latte.png',
    category: 'Non Coffee',
    outlets: 7,
    price: 22000,
    cost: 9000,
    stock: 28,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 2860000,
    salesChange: 15,
    totalSold: 130,
    description:
      'Matcha creamy dengan susu segar untuk pecinta rasa teh hijau yang lembut.',
    tags: ['Premium'],
    tax: 'PPN 11%',
    trend: [
      220000, 290000, 360000, 410000, 520000, 480000, 530000, 610000, 590000,
      660000, 710000, 760000,
    ],
    inventorySummary: { total: 204, lowStock: 7, outOfStock: 0 },
  },
  {
    id: 4,
    name: 'Lemon Tea',
    sku: 'SKU-SEL-004',
    image: '/images/products/lemon-tea.png',
    category: 'Tea',
    outlets: 8,
    price: 16000,
    cost: 5200,
    stock: 0,
    stockState: 'Out of Stock',
    status: 'Active',
    salesMonth: 1280000,
    salesChange: -5,
    totalSold: 80,
    description: 'Teh lemon segar untuk menu ringan yang menyegarkan.',
    tags: ['Fresh'],
    tax: 'PPN 11%',
    trend: [
      210000, 180000, 240000, 190000, 220000, 230000, 160000, 140000, 120000,
      110000, 100000, 90000,
    ],
    inventorySummary: { total: 50, lowStock: 8, outOfStock: 8 },
  },
  {
    id: 5,
    name: 'Choco Hazelnut',
    sku: 'SKU-SEL-005',
    image: '/images/products/choco-hazelnut.png',
    category: 'Chocolate',
    outlets: 6,
    price: 22000,
    cost: 8400,
    stock: 9,
    stockState: 'Low Stock',
    status: 'Active',
    salesMonth: 1150000,
    salesChange: 8,
    totalSold: 60,
    description:
      'Minuman cokelat creamy dengan aksen hazelnut yang nutty dan manis.',
    tags: ['Kids Favorite'],
    tax: 'PPN 11%',
    trend: [
      80000, 120000, 130000, 160000, 170000, 145000, 150000, 155000, 175000,
      180000, 210000, 220000,
    ],
    inventorySummary: { total: 68, lowStock: 10, outOfStock: 1 },
  },
  {
    id: 6,
    name: 'Thai Tea',
    sku: 'SKU-SEL-006',
    image: '/images/products/thai-tea.png',
    category: 'Tea',
    outlets: 7,
    price: 18000,
    cost: 6800,
    stock: 42,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 980000,
    salesChange: 10,
    totalSold: 90,
    description: 'Thai tea klasik dengan warna kuat dan rasa manis creamy.',
    tags: ['Popular'],
    tax: 'PPN 11%',
    trend: [
      60000, 70000, 85000, 90000, 100000, 92000, 95000, 98000, 101000, 112000,
      120000, 124000,
    ],
    inventorySummary: { total: 250, lowStock: 4, outOfStock: 0 },
  },
  {
    id: 7,
    name: 'Americano',
    sku: 'SKU-SEL-007',
    image: '/images/products/americano.png',
    category: 'Coffee',
    outlets: 8,
    price: 15000,
    cost: 5000,
    stock: 35,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 960000,
    salesChange: 6,
    totalSold: 95,
    description: 'Espresso dan air panas untuk pecinta kopi hitam yang clean.',
    tags: ['Classic'],
    tax: 'PPN 11%',
    trend: [
      50000, 60000, 70000, 76000, 80000, 82000, 85000, 88000, 91000, 95000,
      99000, 102000,
    ],
    inventorySummary: { total: 212, lowStock: 2, outOfStock: 0 },
  },
  {
    id: 8,
    name: 'Red Velvet Latte',
    sku: 'SKU-SEL-008',
    image: '/images/products/red-velvet.png',
    category: 'Non Coffee',
    outlets: 5,
    price: 24000,
    cost: 9500,
    stock: 6,
    stockState: 'Low Stock',
    status: 'Active',
    salesMonth: 720000,
    salesChange: 9,
    totalSold: 42,
    description:
      'Minuman red velvet creamy dengan rasa manis lembut dan warna menarik.',
    tags: ['Seasonal'],
    tax: 'PPN 11%',
    trend: [
      30000, 45000, 52000, 61000, 64000, 70000, 68000, 72000, 69000, 76000,
      81000, 88000,
    ],
    inventorySummary: { total: 35, lowStock: 6, outOfStock: 0 },
  },
  {
    id: 9,
    name: 'Vanilla Latte',
    sku: 'SKU-SEL-009',
    image: '/images/products/vanilla-latte.png',
    category: 'Coffee',
    outlets: 8,
    price: 21000,
    cost: 7800,
    stock: 19,
    stockState: 'In Stock',
    status: 'Inactive',
    salesMonth: 620000,
    salesChange: -3,
    totalSold: 34,
    description: 'Kopi susu vanilla lembut dengan aroma manis yang familiar.',
    tags: ['Classic'],
    tax: 'PPN 11%',
    trend: [
      52000, 60000, 71000, 74000, 68000, 62000, 58000, 54000, 50000, 48000,
      45000, 42000,
    ],
    inventorySummary: { total: 120, lowStock: 5, outOfStock: 0 },
  },
  {
    id: 10,
    name: 'Aren Creamy',
    sku: 'SKU-SEL-010',
    image: '/images/products/aren-creamy.png',
    category: 'Signature',
    outlets: 8,
    price: 23000,
    cost: 8300,
    stock: 27,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 1880000,
    salesChange: 14,
    totalSold: 102,
    description:
      'Menu creamy khas dengan manis gula aren yang lembut dan mudah dinikmati.',
    tags: ['Signature', 'Popular'],
    tax: 'PPN 11%',
    trend: [
      150000, 180000, 210000, 240000, 230000, 260000, 280000, 300000, 320000,
      340000, 360000, 390000,
    ],
    inventorySummary: { total: 210, lowStock: 4, outOfStock: 0 },
  },
]

const categoryTone = {
  Signature: 'bg-rose-50 text-[#F43F70] border border-rose-100',
  Coffee: 'bg-violet-50 text-[#6956E8] border border-violet-100',
  'Non Coffee': 'bg-indigo-50 text-[#5B52D6] border border-indigo-100',
  Tea: 'bg-emerald-50 text-[#16A34A] border border-emerald-100',
  Chocolate: 'bg-orange-50 text-[#EA7200] border border-orange-100',
}

const statusTone = {
  Active: 'bg-emerald-50 text-[#16A34A] border border-emerald-100',
  Inactive: 'bg-slate-100 text-[#667085] border border-slate-200',
}

const stockTone = {
  'In Stock': 'text-[#16A34A]',
  'Low Stock': 'text-[#EA7200]',
  'Out of Stock': 'text-[#DC3545]',
}

const tagTone = {
  'Best Seller': 'bg-rose-50 text-[#F43F70] border border-rose-100',
  Premium: 'bg-violet-50 text-[#6956E8] border border-violet-100',
  Popular: 'bg-blue-50 text-[#2563EB] border border-blue-100',
  Fresh: 'bg-emerald-50 text-[#16A34A] border border-emerald-100',
  Seasonal: 'bg-amber-50 text-[#D68A00] border border-amber-100',
  Classic: 'bg-slate-100 text-[#475467] border border-slate-200',
  Signature: 'bg-rose-50 text-[#F43F70] border border-rose-100',
  'Kids Favorite': 'bg-orange-50 text-[#EA7200] border border-orange-100',
}

const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function money(value) {
  return formatter.format(value).replace(/\s/g, '')
}

function Trend({ value }) {
  if (value === 0)
    return <span className='text-sm font-medium text-[#98A2B3]'>—</span>

  const positive = value > 0

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 text-sm font-semibold',
        positive ? 'text-[#16A34A]' : 'text-[#DC3545]'
      )}
    >
      {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value)}%
    </span>
  )
}

function ProductImage({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false)
  const isSmall = className.includes('h-9')

  if (!src || failed) {
    return (
      <div
        className={cx(
          'grid place-items-center bg-[linear-gradient(135deg,#11182E_0%,#6956E8_55%,#F43F70_100%)] select-none',
          className
        )}
      >
        <div className='px-1 text-center text-white flex flex-col items-center justify-center'>
          <Package2 size={isSmall ? 16 : 24} className='mx-auto' />
          {!isSmall && (
            <span className='mt-1 line-clamp-2 text-[10px] font-semibold leading-tight max-w-[68px]'>
              {name}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={cx('object-cover', className)}
    />
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className='relative block min-w-0'>
      <span className='sr-only'>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='h-9 w-full appearance-none rounded-lg border border-[#E1E6EF] bg-white px-3 pr-8 text-sm font-semibold text-[#11182E] outline-none transition focus:border-[#F43F70] focus:ring-4 focus:ring-[#F43F70]/10'
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]'
      />
    </label>
  )
}

function MetricCard({ icon: Icon, label, value, change, tone }) {
  const toneClass = {
    brand: 'bg-rose-50 text-[#F43F70]',
    violet: 'bg-violet-50 text-[#6956E8]',
    orange: 'bg-orange-50 text-[#EA7200]',
    green: 'bg-emerald-50 text-[#16A34A]',
  }

  return (
    <article className='flex min-h-[76px] items-center gap-2.5 rounded-xl border border-[#E1E6EF] bg-white px-3 py-2.5 shadow-[0_8px_22px_rgba(17,24,46,0.035)]'>
      <span
        className={cx(
          'grid h-8 w-8 shrink-0 place-items-center rounded-full',
          toneClass[tone]
        )}
      >
        <Icon size={16} />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[11px] font-semibold leading-none text-[#667085]'>
          {label}
        </p>
        <p className='mt-1 truncate text-lg font-extrabold leading-tight tracking-tight text-[#11182E]'>
          {value}
        </p>
        <div className='mt-1 flex items-center gap-1.5'>
          <Trend value={change} />
          <span className='truncate text-[11px] text-[#98A2B3]'>
            vs last month
          </span>
        </div>
      </div>
    </article>
  )
}

function MiniChart({ values }) {
  const width = 420
  const height = 140
  const padding = 14
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const coords = values.map((v, i) => {
    const x =
      padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return [x, y]
  })
  const points = coords.map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <div className='mt-2.5 overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(105,86,232,0.10),rgba(105,86,232,0.02))]'>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className='h-24 w-full'
        role='img'
        aria-label='Sales performance chart'
      >
        {[28, 65, 102].map((y) => (
          <line
            key={y}
            x1='0'
            y1={y}
            x2={width}
            y2={y}
            stroke='#E1E6EF'
            strokeDasharray='4 6'
            strokeWidth='1'
          />
        ))}
        <polyline
          points={points}
          fill='none'
          stroke='#6956E8'
          strokeWidth='3'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        {coords.map(([x, y], idx) => (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r='3.5'
            fill='white'
            stroke='#6956E8'
            strokeWidth='2.5'
          />
        ))}
      </svg>
      <div className='flex justify-between px-2 pb-2 text-[11px] text-[#98A2B3]'>
        <span>1 May</span>
        <span>8 May</span>
        <span>15 May</span>
        <span>22 May</span>
        <span>29 May</span>
      </div>
    </div>
  )
}

function InfoRow({ label, value, multiline = false }) {
  return (
    <div className='grid grid-cols-[120px_minmax(0,1fr)] items-start gap-2'>
      <p className='m-0 text-sm leading-5 text-[#667085]'>{label}</p>
      <p
        className={cx(
          'm-0 max-w-[260px] text-sm font-bold text-[#11182E]',
          multiline ? 'leading-5' : 'leading-5'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function StatBox({ label, value, valueClass, helper }) {
  return (
    <article className='rounded-lg border border-[#F2F4F8] bg-[#FCFDFE] p-2'>
      <p className='text-[11px] font-medium leading-4 text-[#667085]'>
        {label}
      </p>
      <p className={cx('mt-1 text-sm font-bold', valueClass)}>{value}</p>
      {helper && <div className='mt-1 flex items-center gap-1.5'>{helper}</div>}
    </article>
  )
}

function DetailPanel({
  product,
  onClose,
  mobile = false,
  activeTab = 'Overview',
  setActiveTab = () => {},
  outletInventory = [],
  onAdjustStockClick = () => {},
}) {
  if (!product) {
    return (
      <aside className='h-full bg-white flex flex-col items-center justify-center text-center p-6 text-[#667085] relative'>
        <div className='absolute top-4 right-4'>
          <button
            type='button'
            onClick={onClose}
            className='grid h-9 w-9 place-items-center rounded-lg border border-[#E1E6EF] text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E] transition-colors duration-150'
            title='Hide product details'
          >
            <X size={16} />
          </button>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <div className='w-12 h-12 rounded-full bg-[#F6F8FB] flex items-center justify-center text-[#667085] mb-2 border border-dashed border-[#E1E6EF] text-lg'>
            📦
          </div>
          <div className='text-sm font-semibold text-[#11182E]'>
            No Product Selected
          </div>
          <div className='text-xs text-[#667085] max-w-[240px]'>
            Click on any product in the table to view its full details here.
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={cx(
        'bg-white flex flex-col',
        mobile
          ? 'fixed inset-y-0 right-0 z-50 w-full max-w-[480px] shadow-2xl'
          : 'h-full overflow-hidden'
      )}
    >
      <header className='shrink-0 border-b border-[#E1E6EF] bg-white px-5 pt-5 z-10'>
        <div className='flex items-center justify-between gap-3.5'>
          <div className='flex min-w-0 items-center gap-4'>
            <ProductImage
              src={product.image}
              name={product.name}
              className='h-20 w-20 shrink-0 rounded-2xl bg-[#F6F8FB] object-contain object-center p-1.5 border border-[#E1E6EF]/80 shadow-sm'
            />
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='m-0 truncate text-base font-extrabold text-[#11182E]'>
                  {product.name}
                </h2>
                <span
                  className={cx(
                    'rounded-md px-2 py-0.5 text-[11px] font-bold',
                    statusTone[product.status]
                  )}
                >
                  {product.status}
                </span>
              </div>
              <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-[#667085]'>
                <span>{product.sku}</span>
                <span>•</span>
                <span
                  className={cx(
                    'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                    categoryTone[product.category]
                  )}
                >
                  {product.category}
                </span>
              </div>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-1.5'>
            <button
              type='button'
              className='grid h-9 w-9 place-items-center rounded-lg border border-[#E1E6EF] text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E] transition-colors duration-150'
            >
              <MoreVertical size={16} />
            </button>
            <button
              type='button'
              onClick={onClose}
              className='grid h-9 w-9 place-items-center rounded-lg border border-[#E1E6EF] text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E] transition-colors duration-150'
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className='mt-4 flex gap-3 overflow-x-auto -mb-[1px]'>
          {['Overview', 'Inventory', 'Outlets', 'Sales', 'Activity'].map(
            (tab) => (
              <button
                key={tab}
                type='button'
                onClick={() => setActiveTab(tab)}
                className={cx(
                  'shrink-0 border-b-2 px-1 pb-3 text-sm font-bold transition-all duration-150',
                  activeTab === tab
                    ? 'border-[#F43F70] text-[#F43F70]'
                    : 'border-transparent text-[#667085] hover:text-[#11182E]'
                )}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-6'>
        {activeTab === 'Overview' && (
          <div className='space-y-4'>
            <section className='rounded-2xl border border-[#D7DFEC] bg-white p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='m-0 text-base font-extrabold text-[#11182E]'>
                  Basic Information
                </h3>
                <button
                  type='button'
                  className='rounded-lg border border-[#D7DFEC] px-3 py-1 text-sm font-bold text-[#11182E] hover:bg-[#F6F8FB]'
                >
                  Edit
                </button>
              </div>
              <div className='mt-3 space-y-2'>
                <InfoRow label='Product Name' value={product.name} />
                <InfoRow label='Category' value={product.category} />
                <InfoRow
                  label='Description'
                  value={product.description}
                  multiline
                />
                <InfoRow label='Price' value={money(product.price)} />
                <InfoRow label='Cost' value={money(product.cost)} />
                <InfoRow label='Tax' value={product.tax} />
                <div className='grid grid-cols-[120px_minmax(0,1fr)] items-start gap-2'>
                  <p className='m-0 text-sm leading-5 text-[#667085]'>Tags</p>
                  <div className='flex max-w-[260px] flex-wrap gap-2'>
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cx(
                          'rounded-lg px-2.5 py-1 text-[11px] font-bold',
                          tagTone[tag] ||
                            'bg-slate-100 text-slate-700 border border-slate-200'
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className='rounded-xl border border-[#E1E6EF] p-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-extrabold text-[#11182E]'>
                  Inventory Summary
                </h3>
                <button
                  type='button'
                  onClick={() => setActiveTab('Inventory')}
                  className='text-sm font-bold text-[#6956E8] hover:underline'
                >
                  View Details
                </button>
              </div>
              <div className='mt-2.5 grid grid-cols-3 gap-2'>
                <StatBox
                  label='Total Stock'
                  value={`${product.inventorySummary?.total ?? product.stock} cups`}
                  valueClass='text-[#11182E]'
                />
                <StatBox
                  label='Low Stock'
                  value={`${product.inventorySummary?.lowStock ?? 0} outlets`}
                  valueClass='text-[#EA7200]'
                />
                <StatBox
                  label='Out of Stock'
                  value={`${product.inventorySummary?.outOfStock ?? 0} outlets`}
                  valueClass='text-[#DC3545]'
                />
              </div>
              <div className='mt-2.5 h-2 overflow-hidden rounded-full bg-[#F2F4F8]'>
                <div className='flex h-full'>
                  <span className='h-full bg-[#16A34A]' style={{ width: '72%' }} />
                  <span className='h-full bg-[#EA7200]' style={{ width: '18%' }} />
                  <span className='h-full bg-[#DC3545]' style={{ width: '10%' }} />
                </div>
              </div>
            </section>

            <section className='rounded-xl border border-[#E1E6EF] p-3'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-extrabold text-[#11182E]'>
                  Sales Performance (This Month)
                </h3>
                <button
                  type='button'
                  className='text-sm font-bold text-[#6956E8] hover:underline'
                >
                  View Report
                </button>
              </div>
              <div className='mt-2.5 grid grid-cols-2 gap-2'>
                <StatBox
                  label='Total Sales'
                  value={money(product.salesMonth)}
                  valueClass='text-[#11182E]'
                  helper={
                    <>
                      <Trend value={product.salesChange} />
                      <span className='text-sm text-[#98A2B3]'>vs last month</span>
                    </>
                  }
                />
                <StatBox
                  label='Total Sold'
                  value={`${product.totalSold} cups`}
                  valueClass='text-[#11182E]'
                />
              </div>
              <MiniChart values={product.trend} />
            </section>

            <section className='rounded-xl border border-[#E1E6EF] p-3'>
              <h3 className='text-sm font-extrabold text-[#11182E]'>
                Quick Actions
              </h3>
              <div className='mt-2.5 grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  className='inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#6956E8]/25 bg-white px-3 text-sm font-bold text-[#6956E8] hover:bg-violet-50'
                >
                  <Edit3 size={14} /> Edit Product
                </button>
                <button
                  type='button'
                  onClick={onAdjustStockClick}
                  className='inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#F43F70] px-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(244,63,112,0.24)] hover:bg-[#e63166]'
                >
                  <Warehouse size={14} /> Adjust Stock
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Inventory' && (
          <div className='space-y-4 text-slate-700'>
            {/* Inventory cards grid */}
            <div className='grid grid-cols-3 gap-2.5'>
              {/* Total Stock */}
              <div className='rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm'>
                <div className='flex items-center gap-1.5 text-slate-400'>
                  <Calendar size={13} className='text-[#6956E8]' />
                  <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>Total Stock</span>
                </div>
                <div className='text-base font-extrabold text-slate-800 mt-2.5'>
                  {outletInventory.reduce((sum, item) => sum + item.available, 0)} cups
                </div>
              </div>

              {/* Low Stock Outlets */}
              <div className='rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm'>
                <div className='flex items-center gap-1.5 text-slate-400'>
                  <Warehouse size={13} className='text-amber-500' />
                  <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>Low Stock</span>
                </div>
                <div className='text-base font-extrabold text-slate-800 mt-2.5'>
                  {outletInventory.filter(item => item.available > 0 && item.available <= item.threshold).length} outlets
                </div>
              </div>

              {/* Out of Stock Outlets */}
              <div className='rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm'>
                <div className='flex items-center gap-1.5 text-slate-400'>
                  <Warehouse size={13} className='text-rose-500' />
                  <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>Out of Stock</span>
                </div>
                <div className='text-base font-extrabold text-slate-800 mt-2.5'>
                  {outletInventory.filter(item => item.available === 0).length} outlet
                </div>
              </div>
            </div>

            {/* Heading + Adjust Stock Button */}
            <div className='flex items-center justify-between mt-5 shrink-0'>
              <h3 className='text-sm font-extrabold text-slate-800'>
                Inventory by Outlet
              </h3>
              <button
                type='button'
                onClick={onAdjustStockClick}
                className='inline-flex h-8 items-center gap-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg shadow-sm transition-all cursor-pointer'
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Adjust Stock
              </button>
            </div>

            {/* Inventory table */}
            <div className='rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm'>
              <div className='overflow-x-auto max-w-full'>
                <table className='w-full text-left text-xs border-collapse'>
                  <thead className='bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100'>
                    <tr>
                      <th className='py-2.5 px-3'>Outlet</th>
                      <th className='py-2.5 px-2 text-right'>Avail</th>
                      <th className='py-2.5 px-2 text-right'>Rsvd</th>
                      <th className='py-2.5 px-2 text-right'>Limit</th>
                      <th className='py-2.5 px-3 text-center'>Status</th>
                      <th className='py-2.5 px-3'>Updated</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100 font-semibold text-slate-700'>
                    {outletInventory.map((item) => {
                      const isOutOfStock = item.available === 0
                      const isLowStock = item.available > 0 && item.available <= item.threshold
                      const statusLabel = isOutOfStock ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'Good')
                      const statusBadgeClass = isOutOfStock
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : (isLowStock ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')

                      return (
                        <tr key={item.outlet} className='hover:bg-slate-50/50'>
                          <td className='py-2.5 px-3 font-bold text-slate-800 text-[11px] truncate max-w-[180px]'>{item.outlet}</td>
                          <td className='py-2.5 px-2 text-right font-bold text-slate-800'>{item.available} cps</td>
                          <td className='py-2.5 px-2 text-right text-slate-400'>{item.reserved} cps</td>
                          <td className='py-2.5 px-2 text-right text-slate-400'>{item.threshold} cps</td>
                          <td className='py-2.5 px-3 text-center'>
                            <span className={cx('inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide leading-none', statusBadgeClass)}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className='py-2.5 px-3 text-[10px] text-slate-400 whitespace-nowrap'>{item.updated}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total outlets */}
            <div className='text-xs font-bold text-slate-400 uppercase tracking-wide mt-2 px-1'>
              Total outlets: {outletInventory.length}
            </div>
          </div>
        )}

        {(activeTab === 'Outlets' || activeTab === 'Sales' || activeTab === 'Activity') && (
          <div className='p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-slate-400'>
            <div className='text-2xl mb-2'>📊</div>
            <div className='text-xs font-bold uppercase tracking-wider text-slate-500'>{activeTab} Details</div>
            <p className='text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal'>
              Detailed performance metrics and visibility adjustments for this product tab are coming soon.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

function RowCheckbox() {
  return (
    <input
      type='checkbox'
      className='h-4 w-4 rounded border-[#D0D5DD] text-[#F43F70] focus:ring-[#F43F70]'
      onClick={(event) => event.stopPropagation()}
      readOnly
    />
  )
}

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [outletFilter, setOutletFilter] = useState('All Outlets')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [tagFilter, setTagFilter] = useState('All Tags')
  const [sortBy, setSortBy] = useState('Newest First')
  const [activeTab, setActiveTab] = useState('All Products')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(true)
  const [openDropdownId, setOpenDropdownId] = useState(null)

  // Selection states
  const [selectedSKUs, setSelectedSKUs] = useState([])
  const [allSelected, setAllSelected] = useState(false)

  // Outlets loading state
  const [outlets, setOutlets] = useState([])

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isAssignOutletsOpen, setIsAssignOutletsOpen] = useState(false)
  const [outletAssignmentProduct, setOutletAssignmentProduct] = useState(null)
  const [outletAssignmentRows, setOutletAssignmentRows] = useState([])
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)

  // More Filters Drawer State
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  const [filterMinPrice, setFilterMinPrice] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState('')
  const [filterMinSales, setFilterMinSales] = useState('')
  const [filterMaxSales, setFilterMaxSales] = useState('')
  const [filterStockCondition, setFilterStockCondition] = useState(['low', 'out']) // 'low', 'out', 'in'
  const [filterOutletsList, setFilterOutletsList] = useState(['Kemang', 'Gading Serpong'])
  const [filterCategoriesList, setFilterCategoriesList] = useState(['Minuman', 'Makanan Ringan'])
  const [filterStatusList, setFilterStatusList] = useState(['Active', 'Inactive', 'Out of Stock'])
  const [filterTagsList, setFilterTagsList] = useState(['Teh', 'Favorit', 'Signature'])
  const [filterUpdatedDate, setFilterUpdatedDate] = useState('Anytime')
  const [filterCreatedDate, setFilterCreatedDate] = useState('Anytime')

  const countActiveMoreFilters = () => {
    let count = 0
    if (filterMinPrice || filterMaxPrice) count++
    if (filterMinSales || filterMaxSales) count++
    if (filterStockCondition.length < 3) count++
    if (filterOutletsList.length > 0) count++
    if (filterCategoriesList.length > 0) count++
    if (filterStatusList.length > 0) count++
    if (filterTagsList.length > 0) count++
    if (filterUpdatedDate !== 'Anytime') count++
    if (filterCreatedDate !== 'Anytime') count++
    return count
  }

  const handleClearAllFilters = () => {
    setFilterMinPrice('')
    setFilterMaxPrice('')
    setFilterMinSales('')
    setFilterMaxSales('')
    setFilterStockCondition([])
    setFilterOutletsList([])
    setFilterCategoriesList([])
    setFilterStatusList([])
    setFilterTagsList([])
    setFilterUpdatedDate('Anytime')
    setFilterCreatedDate('Anytime')
  }

  // Inventory detail tab & stock adjustment states
  const [activeDetailTab, setActiveDetailTab] = useState('Overview')
  const [outletInventory, setOutletInventory] = useState([])
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false)
  const [adjustStockOutlet, setAdjustStockOutlet] = useState('')
  const [adjustStockType, setAdjustStockType] = useState('add') // 'add' | 'remove'
  const [adjustStockQuantity, setAdjustStockQuantity] = useState('10')
  const [adjustStockReasonSelect, setAdjustStockReasonSelect] = useState('Stock received')
  const [adjustStockReasonText, setAdjustStockReasonText] = useState('Received from supplier.')

  // Initialize outlet inventory dynamically for selectedProduct
  useEffect(() => {
    if (selectedProduct) {
      let list = []
      // Check if it's the first product or has matching stock
      if (selectedProduct.sku === 'SKU-SEL-001' || selectedProduct.id === 1) {
        list = [
          { outlet: 'Kalis Selayang', available: 24, reserved: 4, threshold: 10, updated: 'Today, 10:15 AM' },
          { outlet: 'Kalis Kepong', available: 18, reserved: 2, threshold: 10, updated: 'Today, 9:42 AM' },
          { outlet: 'Kalis Setapak', available: 12, reserved: 1, threshold: 10, updated: 'Today, 9:21 AM' },
          { outlet: 'Kalis Ampang', available: 9, reserved: 1, threshold: 10, updated: 'Today, 8:50 AM' },
          { outlet: 'Kalis Gombak', available: 7, reserved: 0, threshold: 10, updated: 'Today, 8:05 AM' },
          { outlet: 'Kalis Rawang', available: 6, reserved: 1, threshold: 10, updated: 'Today, 7:45 AM' },
          { outlet: 'Kalis Batu Caves', available: 0, reserved: 0, threshold: 10, updated: 'Today, 7:10 AM' },
          { outlet: 'Kalis Sungai Buloh', available: 10, reserved: 0, threshold: 10, updated: 'Today, 6:58 AM' }
        ]
      } else {
        const defaultNames = [
          'Kalis Selayang', 'Kalis Kepong', 'Kalis Setapak', 'Kalis Ampang',
          'Kalis Gombak', 'Kalis Rawang', 'Kalis Batu Caves', 'Kalis Sungai Buloh'
        ]
        const totalStock = selectedProduct.stock || 0
        const count = defaultNames.length
        let remaining = totalStock
        list = defaultNames.map((name, idx) => {
          let avail = 0
          if (idx === count - 1) {
            avail = remaining
          } else {
            avail = Math.floor(totalStock / count)
            remaining -= avail
          }
          const reserved = avail > 5 ? 1 : 0
          return {
            outlet: name,
            available: avail,
            reserved: reserved,
            threshold: 10,
            updated: 'Today, 12:00 PM'
          }
        })
      }
      setOutletInventory(list)
    }
  }, [selectedProduct])

  const handleConfirmAdjustStock = () => {
    const qty = Number(adjustStockQuantity) || 0
    const updated = outletInventory.map((item) => {
      if (item.outlet === adjustStockOutlet) {
        const diff = adjustStockType === 'add' ? qty : -qty
        const newAvail = Math.max(0, item.available + diff)
        return {
          ...item,
          available: newAvail,
          updated: 'Just now',
        }
      }
      return item
    })

    setOutletInventory(updated)
    const newTotal = updated.reduce((sum, item) => sum + item.available, 0)

    // Update main products state
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === selectedProduct.id) {
          return {
            ...p,
            stock: newTotal,
            stockState:
              newTotal > 10
                ? 'In Stock'
                : newTotal > 0
                  ? 'Low Stock'
                  : 'Out of Stock',
          }
        }
        return p
      })
    )

    // Also update selectedProduct
    setSelectedProduct((prev) => ({
      ...prev,
      stock: newTotal,
      stockState:
        newTotal > 10
          ? 'In Stock'
          : newTotal > 0
            ? 'Low Stock'
            : 'Out of Stock',
      inventorySummary: {
        total: newTotal,
        lowStock: updated.filter((item) => item.available > 0 && item.available <= item.threshold).length,
        outOfStock: updated.filter((item) => item.available === 0).length,
      },
    }))

    setIsAdjustStockOpen(false)
    alert('Stock adjusted successfully!')
  }

  // Add Product Drawer State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSku, setAddSku] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [addPrice, setAddPrice] = useState('')
  const [addCost, setAddCost] = useState('')
  const [addTax, setAddTax] = useState('PPN 11%')
  const [addTags, setAddTags] = useState('')
  const [addStatus, setAddStatus] = useState('Active')
  const [addAvailability, setAddAvailability] = useState('Always available')
  const [addTrackStock, setAddTrackStock] = useState(true)
  const [addInitialStock, setAddInitialStock] = useState('')
  const [addLowStockAlert, setAddLowStockAlert] = useState('10')
  const [addSelectedOutlets, setAddSelectedOutlets] = useState(['Pusat', 'Kemang', 'BSD', 'Bandung'])

  const handleSaveProduct = async () => {
    try {
      const payload = {
        name: addName,
        sku: addSku || `SKU-SEL-00${products.length + 1}`,
        category: addCategory || 'Signature',
        base_price: Number(addPrice) || 0,
        cost_price: Number(addCost) || 0,
        stock_quantity: Number(addInitialStock) || 0,
        is_active: addStatus === 'Active',
        description: addDescription,
      }

      if (!isDemoMode()) {
        await api.post('/products', payload)
      } else {
        // Mock add product to state in demo mode
        const mockNewProduct = {
          id: products.length + 1,
          _id: String(products.length + 1),
          name: addName,
          sku: addSku || `SKU-SEL-0${products.length + 1}`,
          image: '/images/products/salty-caramel.png',
          category: addCategory || 'Signature',
          outlets: addSelectedOutlets.length,
          price: Number(addPrice) || 0,
          cost: Number(addCost) || 0,
          stock: Number(addInitialStock) || 0,
          stockState: (Number(addInitialStock) || 0) > 10 ? 'In Stock' : ((Number(addInitialStock) || 0) > 0 ? 'Low Stock' : 'Out of Stock'),
          status: addStatus,
          salesMonth: 0,
          salesChange: 0,
          totalSold: 0,
          description: addDescription,
          tags: addTags ? addTags.split(',').map(t => t.trim()) : [],
          tax: addTax,
          trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          inventorySummary: {
            total: Number(addInitialStock) || 0,
            lowStock: 0,
            outOfStock: 0,
          }
        }
        setProducts(prev => [mockNewProduct, ...prev])
      }

      // Reset form
      setAddName('')
      setAddSku('')
      setAddCategory('')
      setAddDescription('')
      setAddPrice('')
      setAddCost('')
      setAddTags('')
      setAddStatus('Active')
      setAddInitialStock('')
      setIsAddProductOpen(false)
      alert(`Product "${payload.name}" added successfully!`)
      loadProducts()
    } catch (err) {
      console.error("Failed to add product:", err)
      alert("Failed to add product.")
    }
  }

  // High fidelity export configurations
  const [exportFormat, setExportFormat] = useState('csv') // 'csv' | 'excel' | 'pdf'
  const [exportScope, setExportScope] = useState('all') // 'all' | 'selected'
  const [exportOutletScope, setExportOutletScope] = useState('All Outlets')
  const [exportDateFilter, setExportDateFilter] = useState('This Month')
  const [exportDelivery, setExportDelivery] = useState('download') // 'download' | 'email'

  const allAvailableFields = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'price', label: 'Price' },
    { key: 'cost', label: 'Cost' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
    { key: 'tax', label: 'Tax' },
    { key: 'outlets', label: 'Outlets' },
    { key: 'totalSales', label: 'Total Sales (This Month)' },
    { key: 'unitsSold', label: 'Units Sold (This Month)' },
    { key: 'createdDate', label: 'Created Date' },
    { key: 'tags', label: 'Tags' },
  ]
  const [selectedFields, setSelectedFields] = useState(allAvailableFields.map(f => f.key))

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = products.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      const matchesOutlet =
        outletFilter === 'All Outlets' || item.outlets === Number(outletFilter)
      const matchesCategory =
        categoryFilter === 'All Categories' || item.category === categoryFilter
      const matchesStatus =
        statusFilter === 'All Status' ||
        item.status === statusFilter ||
        item.stockState === statusFilter
      const matchesTag =
        tagFilter === 'All Tags' || item.tags.includes(tagFilter)
      const matchesTab =
        activeTab === 'All Products' ||
        (activeTab === 'Active' && item.status === 'Active') ||
        (activeTab === 'Inactive' && item.status === 'Inactive') ||
        (activeTab === 'Low Stock' && item.stockState === 'Low Stock') ||
        (activeTab === 'Out of Stock' && item.stockState === 'Out of Stock')

      // Pricing & Sales ranges
      const matchesMinPrice = !filterMinPrice || item.price >= Number(filterMinPrice)
      const matchesMaxPrice = !filterMaxPrice || item.price <= Number(filterMaxPrice)
      const matchesMinSales = !filterMinSales || item.salesMonth >= Number(filterMinSales)
      const matchesMaxSales = !filterMaxSales || item.salesMonth <= Number(filterMaxSales)

      // Stock Condition Checkboxes
      let matchesStockCond = true
      if (filterStockCondition.length > 0) {
        matchesStockCond = false
        if (filterStockCondition.includes('low') && item.stock > 0 && item.stock <= 10) matchesStockCond = true
        if (filterStockCondition.includes('out') && item.stock === 0) matchesStockCond = true
        if (filterStockCondition.includes('in') && item.stock > 10) matchesStockCond = true
      }

      // Outlets multi-select
      let matchesOutletList = true
      if (filterOutletsList.length > 0) {
        matchesOutletList = filterOutletsList.some(o => 
          (o === 'Kemang' && item.outlets >= 2) ||
          (o === 'BSD' && item.outlets >= 3) ||
          (o === 'Pusat' && item.outlets >= 1) ||
          (o === 'Bandung' && item.outlets >= 4) ||
          (o === 'Gading Serpong' && item.outlets >= 1)
        )
      }

      // Categories multi-select
      let matchesCategoryList = true
      if (filterCategoriesList.length > 0) {
        matchesCategoryList = filterCategoriesList.includes(item.category)
      }

      // Statuses multi-select
      let matchesStatusList = true
      if (filterStatusList.length > 0) {
        matchesStatusList = filterStatusList.includes(item.status) || (filterStatusList.includes('Out of Stock') && item.stock === 0)
      }

      // Tags multi-select
      let matchesTagsList = true
      if (filterTagsList.length > 0) {
        matchesTagsList = item.tags.some(t => filterTagsList.includes(t))
      }

      return (
        matchesSearch &&
        matchesOutlet &&
        matchesCategory &&
        matchesStatus &&
        matchesTag &&
        matchesTab &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinSales &&
        matchesMaxSales &&
        matchesStockCond &&
        matchesOutletList &&
        matchesCategoryList &&
        matchesStatusList &&
        matchesTagsList
      )
    })

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'Newest First':
          return b.id - a.id
        case 'Oldest First':
          return a.id - b.id
        case 'Highest Sales':
          return b.salesMonth - a.salesMonth
        case 'Highest Stock':
          return b.stock - a.stock
        default:
          return 0
      }
    })
  }, [
    search,
    outletFilter,
    categoryFilter,
    statusFilter,
    tagFilter,
    activeTab,
    sortBy,
    products,
    filterMinPrice,
    filterMaxPrice,
    filterMinSales,
    filterMaxSales,
    filterStockCondition,
    filterOutletsList,
    filterCategoriesList,
    filterStatusList,
    filterTagsList,
    filterUpdatedDate,
    filterCreatedDate,
  ])

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  const toggleDropdown = (productId, event) => {
    event.stopPropagation()
    setOpenDropdownId((prev) => (prev === productId ? null : productId))
  }

  const toggleSelectSKU = (sku) => {
    setSelectedSKUs((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSKUs([])
      setAllSelected(false)
    } else {
      setSelectedSKUs(filteredProducts.map((p) => p.sku))
      setAllSelected(true)
    }
  }

  useEffect(() => {
    if (
      filteredProducts.length > 0 &&
      selectedSKUs.length === filteredProducts.length
    ) {
      setAllSelected(true)
    } else {
      setAllSelected(false)
    }
  }, [selectedSKUs, filteredProducts])

  useEffect(() => {
    loadProducts()
    loadOutlets()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      if (isDemoMode()) {
        setProducts(dummyProducts)
      } else {
        const res = await api.get('/products')
        const rawProducts = Array.isArray(res.data)
          ? res.data
          : res.data && Array.isArray(res.data.data)
            ? res.data.data
            : []

        const mappedProducts = rawProducts.map((item, idx) => ({
          id: item.id || item._id,
          _id: item.id || item._id,
          name: item.name,
          sku: item.sku || `SKU-SEL-00${idx + 1}`,
          image: item.thumbnail_url || '/images/products/salty-caramel.png',
          category: item.metadata?.category || item.category || 'Teh',
          outlets: item.outlets || 1,
          price: item.base_price || 0,
          cost: item.cost_price || 0,
          stock: item.stock_quantity || 0,
          stockState: item.is_active ? 'In Stock' : 'Out of Stock',
          status: item.is_active ? 'Active' : 'Inactive',
          salesMonth: item.salesMonth || 0,
          salesChange: item.salesChange || 0,
          totalSold: item.totalSold || 0,
          description: item.description || '',
          tags: item.tags || [],
          tax: item.tax_label || 'PPN 11%',
          trend: item.trend || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          inventorySummary: item.inventorySummary || {
            total: item.stock_quantity || 0,
            lowStock: 0,
            outOfStock: 0,
          },
        }))
        setProducts(mappedProducts)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadOutlets = async () => {
    try {
      if (isDemoMode()) {
        setOutlets([
          { id: 'Sudirman', name: 'Kalis Sudirman' },
          { id: 'Menteng', name: 'Kalis Menteng' },
          { id: 'Senopati', name: 'Kalis Senopati' },
        ])
      } else {
        const res = await api.get('/outlets')
        const rawOutlets = res.data?.data || res.data || []
        setOutlets(
          rawOutlets.map((o) => ({
            id: o.id || o._id,
            name: o.name,
          }))
        )
      }
    } catch (err) {
      console.error('Failed to load outlets:', err)
    }
  }

  const handleArchive = async () => {
    try {
      if (archiveTarget === 'bulk') {
        const productsToArchive = products.filter((p) =>
          selectedSKUs.includes(p.sku)
        )
        for (const p of productsToArchive) {
          if (!isDemoMode()) {
            await api.delete(`/products/${p.id}`)
          }
        }
        alert(`Successfully archived ${productsToArchive.length} products.`)
        setSelectedSKUs([])
      } else {
        if (!isDemoMode()) {
          await api.delete(`/products/${archiveTarget.id}`)
        }
        alert(`Product "${archiveTarget.name}" archived successfully.`)
      }
      setIsArchiveConfirmOpen(false)
      setArchiveTarget(null)
      loadProducts()
    } catch (err) {
      console.error('Failed to archive:', err)
      alert('Failed to archive product.')
    }
  }

  const handleOpenAssignOutlets = async (product) => {
    setOutletAssignmentProduct(product)
    setIsAssignOutletsOpen(true)

    try {
      if (isDemoMode()) {
        const mockAvailability = [
          {
            outletId: 'Sudirman',
            outletName: 'Kalis Sudirman',
            isAvailable: true,
            price: product.price,
            stockQuantity: product.stock,
          },
          {
            outletId: 'Menteng',
            outletName: 'Kalis Menteng',
            isAvailable: product.outlets >= 2,
            price: product.price,
            stockQuantity: product.stock,
          },
          {
            outletId: 'Senopati',
            outletName: 'Kalis Senopati',
            isAvailable: product.outlets >= 3,
            price: product.price,
            stockQuantity: product.stock,
          },
        ]
        setOutletAssignmentRows(mockAvailability)
      } else {
        const res = await api.get(`/products/${product.id}/outlet-availability`)
        const data = res.data?.data || []
        const rows = outlets.map((o) => {
          const match = data.find(
            (item) => item.outletId === o.id || item.outlet_id === o.id
          )
          return {
            outletId: o.id,
            outletName: o.name,
            isAvailable: match ? !!match.isAvailable : true,
            price: match ? match.price : product.price,
            stockQuantity: match ? match.stockQuantity : product.stock,
          }
        })
        setOutletAssignmentRows(rows)
      }
    } catch (err) {
      console.error('Failed to load availability:', err)
      setOutletAssignmentRows([
        {
          outletId: 'Sudirman',
          outletName: 'Kalis Sudirman',
          isAvailable: true,
          price: product.price,
          stockQuantity: product.stock,
        },
      ])
    }
  }

  const handleSaveOutletAssignment = async () => {
    try {
      if (!isDemoMode()) {
        await api.put(
          `/products/${outletAssignmentProduct.id}/outlet-availability`,
          {
            outlets: outletAssignmentRows.map((r) => ({
              outletId: r.outletId,
              isAvailable: r.isAvailable,
              price: Number(r.price),
              stockQuantity: Number(r.stockQuantity),
            })),
          }
        )
      }
      setIsAssignOutletsOpen(false)
      alert(`Outlet availability saved for "${outletAssignmentProduct.name}".`)
      loadProducts()
    } catch (err) {
      console.error('Failed to save outlet assignment:', err)
      alert('Failed to save outlet assignment.')
    }
  }

  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0])
    }
  }, [products])

  const counts = useMemo(
    () => ({
      'All Products': products.length,
      Active: products.filter((item) => item.status === 'Active').length,
      Inactive: products.filter((item) => item.status === 'Inactive').length,
      'Low Stock': products.filter((item) => item.stockState === 'Low Stock')
        .length,
      'Out of Stock': products.filter(
        (item) => item.stockState === 'Out of Stock'
      ).length,
    }),
    [products]
  )

  const summary = useMemo(() => {
    const totalRevenue = products.reduce(
      (sum, item) => sum + item.salesMonth,
      0
    )
    return {
      totalProducts: products.length,
      activeProducts: counts.Active,
      lowStock: counts['Low Stock'],
      revenue: totalRevenue,
    }
  }, [counts])



  const openProduct = (product) => {
    setSelectedProduct(product)
    setIsDetailOpen(true)
    setMobileDetailOpen(true)
  }

  const exportCsv = (onlySelected) => {
    const listToExport = onlySelected
      ? products.filter((p) => selectedSKUs.includes(p.sku))
      : filteredProducts

    const header = [
      'Product',
      'SKU',
      'Category',
      'Outlets',
      'Price',
      'Stock',
      'Stock State',
      'Status',
      'Sales This Month',
    ]
    const rows = listToExport.map((item) => [
      item.name,
      item.sku,
      item.category,
      item.outlets,
      item.price,
      item.stock,
      item.stockState,
      item.status,
      item.salesMonth,
    ])
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = onlySelected
      ? 'kalis-selected-products.csv'
      : 'kalis-products.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='flex flex-1 overflow-hidden bg-[#F6F8FB] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)] text-[#11182E]'>
      <main
        className={cx(
          'flex-1 flex flex-col min-w-0 p-4 pt-3 overflow-hidden transition-[padding] duration-200 motion-reduce:transition-none',
          isDetailOpen ? 'xl:pr-[576px]' : 'xl:pr-4'
        )}
      >
        <div className='flex min-h-0 w-full flex-1 flex-col overflow-hidden'>
          <header className='-mx-1 shrink-0 flex flex-col gap-3 overflow-visible px-1 pt-1 pb-1 lg:flex-row lg:items-start lg:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold tracking-tight text-[#11182E]'>
                Products
              </h1>
              <p className='mt-1 text-sm text-[#667085]'>
                Manage all products across your outlets.
              </p>
            </div>
            <div className='flex flex-wrap items-center justify-end gap-2.5 overflow-visible xl:flex-nowrap'>
              {!isDetailOpen && selectedProduct && (
                <button
                  type='button'
                  onClick={() => setIsDetailOpen(true)}
                  className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-3 text-sm font-bold text-[#11182E] shadow-sm transition hover:border-[#F43F70] hover:text-[#F43F70]'
                  title='Show product details'
                >
                  <Eye size={14} />
                  <span>{selectedProduct.sku}</span>
                </button>
              )}
              <button
                type='button'
                onClick={() => {
                  setExportScope('all')
                  setIsExportModalOpen(true)
                }}
                className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8]'
              >
                <Download size={14} />
                Export
              </button>
              <button
                type='button'
                onClick={() => setIsAddProductOpen(true)}
                className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#F43F70] px-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(244,63,112,0.24)] transition hover:bg-[#e62e63]'
              >
                <Plus size={16} />
                Add Product
              </button>
            </div>
          </header>

          <section className='mt-3 shrink-0 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              icon={Box}
              label='Total Products'
              value={summary.totalProducts}
              change={12}
              tone='brand'
            />
            <MetricCard
              icon={Package2}
              label='Active Products'
              value={summary.activeProducts}
              change={8}
              tone='violet'
            />
            <MetricCard
              icon={Eye}
              label='Low Stock'
              value={summary.lowStock}
              change={-3}
              tone='orange'
            />
            <MetricCard
              icon={TrendingUp}
              label='Total Revenue (This Month)'
              value={money(summary.revenue)}
              change={15}
              tone='green'
            />
          </section>

          <section className='mt-3 shrink-0 grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1.35fr_.95fr_.95fr_.95fr_.95fr_auto] relative'>
            {selectedSKUs.length > 0 && (
              <div className='absolute inset-0 bg-[#F6EFFB] border border-[#E1D1F0] rounded-lg z-20 px-4 py-1.5 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200'>
                <div className='flex items-center gap-4 flex-wrap'>
                  <span className='text-purple-900 font-bold text-xs flex items-center gap-1.5'>
                    <span className='w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-[10px]'>
                      {selectedSKUs.length}
                    </span>
                    <span>selected</span>
                  </span>

                  <div className='h-4 w-px bg-purple-200 hidden sm:block'></div>

                  <div className='flex items-center gap-1.5 flex-wrap'>
                    <button
                      type='button'
                      onClick={() => {
                        setArchiveTarget('bulk')
                        setIsArchiveConfirmOpen(true)
                      }}
                      className='px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer'
                    >
                      <Trash2 size={12} />
                      Archive Selected
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setExportScope('selected')
                        setIsExportModalOpen(true)
                      }}
                      className='px-2.5 py-1 hover:bg-purple-100 text-purple-700 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer'
                    >
                      <Download size={12} />
                      Export Selected
                    </button>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => setSelectedSKUs([])}
                  className='p-1 rounded-full hover:bg-purple-200 text-purple-700 transition-colors shrink-0'
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <label className='relative block min-w-0'>
              <span className='sr-only'>Search product</span>
              <Search
                size={15}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]'
              />
              <input
                type='search'
                name='product-search'
                id='product-search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete='off'
                autoCorrect='off'
                spellCheck='false'
                placeholder='Search product name, SKU, category...'
                className='h-9 w-full rounded-lg border border-[#E1E6EF] bg-white pl-9 pr-3 text-sm text-[#11182E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#F43F70] focus:ring-4 focus:ring-[#F43F70]/10'
              />
            </label>
            <FilterSelect
              label='Outlets'
              value={outletFilter}
              onChange={setOutletFilter}
              options={['All Outlets', '5', '6', '7', '8']}
            />
            <FilterSelect
              label='Categories'
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                'All Categories',
                'Signature',
                'Coffee',
                'Non Coffee',
                'Tea',
                'Chocolate',
              ]}
            />
            <FilterSelect
              label='Status'
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                'All Status',
                'Active',
                'Inactive',
                'In Stock',
                'Low Stock',
                'Out of Stock',
              ]}
            />
            <FilterSelect
              label='Tags'
              value={tagFilter}
              onChange={setTagFilter}
              options={[
                'All Tags',
                'Best Seller',
                'Premium',
                'Fresh',
                'Popular',
                'Seasonal',
                'Classic',
                'Signature',
                'Kids Favorite',
              ]}
            />
            <button
              type='button'
              onClick={() => setIsMoreFiltersOpen(true)}
              className='inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#D6DCE8] bg-white px-3 text-sm font-bold text-[#11182E] hover:bg-[#F2F4F8] relative'
            >
              <Filter size={14} />
              <span>More Filters</span>
              {countActiveMoreFilters() > 0 && (
                <span className='flex h-5 w-5 items-center justify-center rounded-full bg-[#FF1F6D] text-[10px] font-bold text-white shadow-sm ml-0.5 min-w-[20px] shrink-0'>
                  {countActiveMoreFilters()}
                </span>
              )}
            </button>
          </section>

          <section className='mt-3 shrink-0'>
            <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-[#E1E6EF] bg-white p-1'>
                {Object.entries(counts).map(([tab, count]) => (
                  <button
                    key={tab}
                    type='button'
                    onClick={() => setActiveTab(tab)}
                    className={cx(
                      'inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-bold transition',
                      activeTab === tab
                        ? 'bg-[#FFF0F5] text-[#F43F70]'
                        : 'text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E]'
                    )}
                  >
                    {tab}
                    <span
                      className={cx(
                        'rounded-full px-1.5 py-0.5 text-[11px]',
                        activeTab === tab
                          ? 'bg-[#F43F70] text-white'
                          : 'bg-[#F2F4F8] text-[#667085]'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
              <div className='flex items-center gap-2 self-start lg:self-auto'>
                <span className='whitespace-nowrap text-sm font-medium text-[#667085]'>
                  Sort by:
                </span>
                <div className='w-36'>
                  <FilterSelect
                    label='Sort products'
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      'Newest First',
                      'Oldest First',
                      'Highest Sales',
                      'Highest Stock',
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className='mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E1E6EF] bg-white shadow-[0_8px_30px_rgba(17,24,46,0.03)]'>
            <div className='min-h-0 flex-1 overflow-auto'>
              <table className='w-full min-w-[980px] border-separate border-spacing-0'>
                <thead className='bg-[#FCFDFE]'>
                  <tr className='text-left text-sm font-semibold text-[#667085]'>
                    {[
                      '',
                      'Product',
                      'Category',
                      'Outlets',
                      'Price',
                      'Stock',
                      'Status',
                      'Sales (This Month)',
                      'Action',
                    ].map((head) => (
                      <th
                        key={head || 'check'}
                        className={cx(
                          'border-b border-[#E1E6EF] px-3 py-2.5',
                          head === 'Action' && 'text-right'
                        )}
                      >
                        {head ? (
                          head
                        ) : (
                          <input
                            type='checkbox'
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className='h-4 w-4 rounded border-[#D0D5DD] text-[#F43F70] focus:ring-[#F43F70] cursor-pointer'
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => (
                    <tr
                      key={item.id}
                      className={cx(
                        'cursor-pointer transition hover:bg-[#FCF8FB]',
                        selectedProduct?.id === item.id && 'bg-[#FFF9FC]'
                      )}
                      onClick={() => openProduct(item)}
                    >
                      <td
                        className='border-b border-[#F2F4F8] px-3 py-3'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type='checkbox'
                          checked={selectedSKUs.includes(item.sku)}
                          onChange={() => toggleSelectSKU(item.sku)}
                          className='h-4 w-4 rounded border-[#D0D5DD] text-[#F43F70] focus:ring-[#F43F70] cursor-pointer'
                        />
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <div className='flex items-center gap-3'>
                          <ProductImage
                            src={item.image}
                            name={item.name}
                            className='h-9 w-9 rounded-lg'
                          />
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-extrabold text-[#11182E]'>
                              {item.name}
                            </p>
                            <p className='mt-1 text-xs text-[#667085]'>
                              {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <span
                          className={cx(
                            'rounded-md px-2 py-1 text-[11px] font-bold',
                            categoryTone[item.category]
                          )}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3 text-sm font-semibold text-[#11182E]'>
                        {item.outlets} outlets
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3 text-sm font-bold text-[#11182E]'>
                        {money(item.price)}
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <p className='text-sm font-extrabold text-[#11182E]'>
                          {item.stock}
                        </p>
                        <p
                          className={cx(
                            'mt-0.5 text-xs font-bold',
                            stockTone[item.stockState]
                          )}
                        >
                          {item.stockState}
                        </p>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <span
                          className={cx(
                            'rounded-md px-2 py-1 text-[11px] font-bold',
                            statusTone[item.status]
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <p className='text-sm font-bold text-[#11182E]'>
                          {money(item.salesMonth)}
                        </p>
                        <div className='mt-0.5'>
                          <Trend value={item.salesChange} />
                        </div>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <div className='flex justify-end gap-2'>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              openProduct(item)
                            }}
                            className='bg-white hover:bg-[#F2F4F8] border border-[#E1E6EF] text-xs font-semibold px-2.5 py-1.5 rounded-lg text-[#667085] shadow-sm transition duration-150 focus:outline-none'
                          >
                            View
                          </button>
                          <div className='relative inline-block text-left'>
                            <button
                              type='button'
                              onClick={(e) => toggleDropdown(item.id, e)}
                              className={`border-0 text-[#667085] hover:text-[#26314D] hover:bg-[#F2F4F8] w-8 h-8 rounded-lg flex items-center justify-center transition duration-150 focus:outline-none ${
                                openDropdownId === item.id
                                  ? 'bg-[#F2F4F8] text-[#26314D]'
                                  : ''
                              }`}
                              title='More actions'
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openDropdownId === item.id && (
                              <div className='absolute right-0 mt-1.5 w-44 bg-white border border-[#E1E6EF] rounded-xl shadow-lg py-1.5 z-50 text-left animate-in fade-in duration-100'>
                                <button
                                  type='button'
                                  onClick={() => {
                                    openProduct(item)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                                >
                                  View details
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    alert(`Edit product: ${item.name}`)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                                >
                                  Edit product
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    alert(`Duplicate product: ${item.name}`)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                                >
                                  Duplicate
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    alert(`Manage inventory for: ${item.name}`)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                                >
                                  Manage inventory
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    handleOpenAssignOutlets(item)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                                >
                                  Manage outlets
                                </button>
                                <div className='h-px bg-slate-100 my-1'></div>
                                <button
                                  type='button'
                                  onClick={() => {
                                    setArchiveTarget(item)
                                    setIsArchiveConfirmOpen(true)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                                >
                                  Archive
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} className='px-6 py-16 text-center'>
                        <div className='mx-auto max-w-sm'>
                          <span className='mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F43F70]/10 text-[#F43F70]'>
                            <Search size={24} />
                          </span>
                          <h2 className='mt-4 text-xl font-bold text-[#11182E]'>
                            No products found
                          </h2>
                          <p className='mt-1 text-base text-[#667085]'>
                            Try changing the search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className='shrink-0 flex flex-col gap-2 border-t border-[#E1E6EF] px-3 py-2.5 md:flex-row md:items-center md:justify-between'>
              <p className='text-sm text-[#667085]'>
                Showing 1 to {Math.min(filteredProducts.length, 10)} of{' '}
                {filteredProducts.length} products
              </p>
              <div className='flex flex-wrap items-center gap-2'>
                {['‹', '1', '2', '3', '...', '13', '›'].map((item, idx) => (
                  <button
                    key={`${item}-${idx}`}
                    type='button'
                    className={cx(
                      'grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-sm font-bold',
                      item === '1'
                        ? 'border-[#F43F70] bg-[#FFF0F5] text-[#F43F70]'
                        : 'border-[#E1E6EF] bg-white text-[#667085]'
                    )}
                  >
                    {item}
                  </button>
                ))}
                <div className='w-28'>
                  <FilterSelect
                    label='Rows per page'
                    value='10 / page'
                    onChange={() => {}}
                    options={['10 / page', '20 / page', '50 / page']}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className='mt-2.5 shrink-0 flex items-center justify-between rounded-lg border border-[#E1E6EF] bg-white px-3 py-2 text-sm text-[#667085]'>
            <div className='flex flex-wrap items-center gap-2'>
              <span>
                Showing:{' '}
                <strong className='text-[#11182E]'>
                  {filteredProducts.length} products
                </strong>
              </span>
            </div>
            <button
              type='button'
              className='inline-flex items-center gap-1.5 font-semibold text-[#667085] transition hover:text-[#11182E]'
            >
              Last updated: 10:25 AM <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </main>

      {isDetailOpen && (
        <div className='fixed inset-y-0 right-0 z-[80] hidden xl:block w-[560px] h-[100dvh] bg-white border-l border-[#E1E6EF] overflow-hidden shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
          <DetailPanel
            product={selectedProduct}
            onClose={() => setIsDetailOpen(false)}
            activeTab={activeDetailTab}
            setActiveTab={setActiveDetailTab}
            outletInventory={outletInventory}
            onAdjustStockClick={() => {
              if (outletInventory && outletInventory.length > 0) {
                setAdjustStockOutlet(outletInventory[0].outlet)
              }
              setAdjustStockType('add')
              setAdjustStockQuantity('10')
              setAdjustStockReasonSelect('Stock received')
              setAdjustStockReasonText('Received from supplier.')
              setIsAdjustStockOpen(true)
            }}
          />
        </div>
      )}

      {mobileDetailOpen && (
        <div className='xl:hidden'>
          <button
            type='button'
            onClick={() => setMobileDetailOpen(false)}
            className='fixed inset-0 z-40 bg-[#11182E]/40 backdrop-blur-[2px]'
          />
          <DetailPanel
            product={selectedProduct}
            mobile
            onClose={() => setMobileDetailOpen(false)}
            activeTab={activeDetailTab}
            setActiveTab={setActiveDetailTab}
            outletInventory={outletInventory}
            onAdjustStockClick={() => {
              if (outletInventory && outletInventory.length > 0) {
                setAdjustStockOutlet(outletInventory[0].outlet)
              }
              setAdjustStockType('add')
              setAdjustStockQuantity('10')
              setAdjustStockReasonSelect('Stock received')
              setAdjustStockReasonText('Received from supplier.')
              setIsAdjustStockOpen(true)
            }}
          />
        </div>
      )}

      {/* MORE FILTERS DRAWER */}
      {isMoreFiltersOpen && (
        <div className='fixed inset-0 z-[100] flex justify-end'>
          {/* Backdrop */}
          <button
            type='button'
            onClick={() => setIsMoreFiltersOpen(false)}
            className='fixed inset-0 bg-[#11182E]/40 backdrop-blur-[2px] cursor-default border-0 focus:outline-none'
          />

          {/* Drawer Panel */}
          <div className='relative z-10 bg-white w-full max-w-[420px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200'>
            {/* Header */}
            <header className='px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0'>
              <div>
                <h3 className='text-lg font-extrabold text-slate-900 flex items-center gap-2'>
                  <Filter size={18} className='text-slate-800' />
                  <span>More Filters</span>
                </h3>
                <p className='text-xs text-slate-400 font-semibold mt-1'>
                  Refine your product results with advanced filters.
                </p>
              </div>
              <button
                onClick={() => setIsMoreFiltersOpen(false)}
                className='p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all cursor-pointer'
              >
                <X size={16} />
              </button>
            </header>

            {/* Scrollable Form */}
            <div className='p-6 overflow-y-auto space-y-5.5 flex-1 min-h-0 text-slate-700 text-sm'>
              {/* Outlets Multi-select */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Outlets
                </label>
                <div className='flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl items-center relative'>
                  {filterOutletsList.map(item => (
                    <span key={item} className='inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700'>
                      <span>{item === 'Kemang' ? 'SelaluTeh Kemang' : (item === 'Gading Serpong' ? 'SelaluTeh Gading Serpong' : item)}</span>
                      <button
                        type='button'
                        onClick={() => setFilterOutletsList(prev => prev.filter(x => x !== item))}
                        className='text-slate-400 hover:text-slate-700 font-bold border-0 bg-transparent text-[10px]'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {filterOutletsList.length > 2 && (
                    <span className='inline-flex bg-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600'>
                      +{filterOutletsList.length - 2}
                    </span>
                  )}
                  <select
                    onChange={(e) => {
                      if (e.target.value && !filterOutletsList.includes(e.target.value)) {
                        setFilterOutletsList(prev => [...prev, e.target.value])
                      }
                      e.target.value = ''
                    }}
                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                  >
                    <option value=''>Add outlet...</option>
                    <option value='Kemang'>SelaluTeh Kemang</option>
                    <option value='Gading Serpong'>SelaluTeh Gading Serpong</option>
                    <option value='Pusat'>SelaluTeh Pusat</option>
                    <option value='BSD'>SelaluTeh BSD</option>
                    <option value='Bandung'>SelaluTeh Bandung</option>
                  </select>
                  <div className='ml-auto pr-1 pointer-events-none text-slate-400'>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Categories Multi-select */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Categories
                </label>
                <div className='flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl items-center relative'>
                  {filterCategoriesList.map(item => (
                    <span key={item} className='inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700'>
                      <span>{item}</span>
                      <button
                        type='button'
                        onClick={() => setFilterCategoriesList(prev => prev.filter(x => x !== item))}
                        className='text-slate-400 hover:text-slate-700 font-bold border-0 bg-transparent text-[10px]'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {filterCategoriesList.length > 2 && (
                    <span className='inline-flex bg-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600'>
                      +{filterCategoriesList.length - 2}
                    </span>
                  )}
                  <select
                    onChange={(e) => {
                      if (e.target.value && !filterCategoriesList.includes(e.target.value)) {
                        setFilterCategoriesList(prev => [...prev, e.target.value])
                      }
                      e.target.value = ''
                    }}
                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                  >
                    <option value=''>Add category...</option>
                    <option value='Minuman'>Minuman</option>
                    <option value='Makanan'>Makanan</option>
                    <option value='Makanan Ringan'>Makanan Ringan</option>
                    <option value='Signature'>Signature</option>
                  </select>
                  <div className='ml-auto pr-1 pointer-events-none text-slate-400'>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Status Multi-select */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Status
                </label>
                <div className='flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl items-center relative'>
                  {filterStatusList.map(item => (
                    <span key={item} className='inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700'>
                      <span>{item}</span>
                      <button
                        type='button'
                        onClick={() => setFilterStatusList(prev => prev.filter(x => x !== item))}
                        className='text-slate-400 hover:text-slate-700 font-bold border-0 bg-transparent text-[10px]'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      if (e.target.value && !filterStatusList.includes(e.target.value)) {
                        setFilterStatusList(prev => [...prev, e.target.value])
                      }
                      e.target.value = ''
                    }}
                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                  >
                    <option value=''>Add status...</option>
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                    <option value='Out of Stock'>Out of Stock</option>
                  </select>
                  <div className='ml-auto pr-1 pointer-events-none text-slate-400'>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Tags Multi-select */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Tags
                </label>
                <div className='flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl items-center relative'>
                  {filterTagsList.map(item => (
                    <span key={item} className='inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700'>
                      <span>{item}</span>
                      <button
                        type='button'
                        onClick={() => setFilterTagsList(prev => prev.filter(x => x !== item))}
                        className='text-slate-400 hover:text-slate-700 font-bold border-0 bg-transparent text-[10px]'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      if (e.target.value && !filterTagsList.includes(e.target.value)) {
                        setFilterTagsList(prev => [...prev, e.target.value])
                      }
                      e.target.value = ''
                    }}
                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                  >
                    <option value=''>Add tag...</option>
                    <option value='Teh'>Teh</option>
                    <option value='Favorit'>Favorit</option>
                    <option value='Signature'>Signature</option>
                    <option value='Best Seller'>Best Seller</option>
                  </select>
                  <div className='ml-auto pr-1 pointer-events-none text-slate-400'>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Stock Condition */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                  Stock Condition
                </label>
                <div className='flex gap-4 flex-wrap'>
                  {[
                    { key: 'low', label: 'Low Stock (≤ 10)' },
                    { key: 'out', label: 'Out of Stock (= 0)' },
                    { key: 'in', label: 'In Stock (> 10)' },
                  ].map(cond => (
                    <label key={cond.key} className='flex items-center gap-2 cursor-pointer text-xs font-bold select-none text-slate-700 hover:text-slate-900'>
                      <input
                        type='checkbox'
                        checked={filterStockCondition.includes(cond.key)}
                        onChange={() => {
                          setFilterStockCondition(prev =>
                            prev.includes(cond.key) ? prev.filter(x => x !== cond.key) : [...prev, cond.key]
                          )
                        }}
                        className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4.5 h-4.5 cursor-pointer'
                      />
                      <span>{cond.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range & Sales Range Row */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Price Range (Rp)
                  </label>
                  <div className='flex items-center gap-1.5'>
                    <input
                      type='number'
                      value={filterMinPrice}
                      onChange={(e) => setFilterMinPrice(e.target.value)}
                      placeholder='Min price'
                      className='w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF1F6D]'
                    />
                    <span className='text-slate-300'>—</span>
                    <input
                      type='number'
                      value={filterMaxPrice}
                      onChange={(e) => setFilterMaxPrice(e.target.value)}
                      placeholder='Max price'
                      className='w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF1F6D]'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Sales Range (Rp)
                  </label>
                  <div className='flex items-center gap-1.5'>
                    <input
                      type='number'
                      value={filterMinSales}
                      onChange={(e) => setFilterMinSales(e.target.value)}
                      placeholder='Min sales'
                      className='w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF1F6D]'
                    />
                    <span className='text-slate-300'>—</span>
                    <input
                      type='number'
                      value={filterMaxSales}
                      onChange={(e) => setFilterMaxSales(e.target.value)}
                      placeholder='Max sales'
                      className='w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF1F6D]'
                    />
                  </div>
                </div>
              </div>

              {/* Updated Date & Created Date Row */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Updated Date
                  </label>
                  <div className='relative flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden px-3.5 py-2 cursor-pointer hover:border-slate-300'>
                    <Calendar size={13} className='text-slate-400 mr-2 shrink-0' />
                    <select
                      value={filterUpdatedDate}
                      onChange={(e) => setFilterUpdatedDate(e.target.value)}
                      className='w-full bg-transparent text-xs text-slate-700 outline-none font-bold appearance-none cursor-pointer pr-5'
                    >
                      <option value='Anytime'>Anytime</option>
                      <option value='Today'>Today</option>
                      <option value='This Week'>This Week</option>
                      <option value='This Month'>This Month</option>
                    </select>
                    <div className='absolute right-3.5 pointer-events-none text-slate-400'>
                      <ChevronDown size={13} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Created Date
                  </label>
                  <div className='relative flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden px-3.5 py-2 cursor-pointer hover:border-slate-300'>
                    <Calendar size={13} className='text-slate-400 mr-2 shrink-0' />
                    <select
                      value={filterCreatedDate}
                      onChange={(e) => setFilterCreatedDate(e.target.value)}
                      className='w-full bg-transparent text-xs text-slate-700 outline-none font-bold appearance-none cursor-pointer pr-5'
                    >
                      <option value='Anytime'>Anytime</option>
                      <option value='Today'>Today</option>
                      <option value='This Week'>This Week</option>
                      <option value='This Month'>This Month</option>
                    </select>
                    <div className='absolute right-3.5 pointer-events-none text-slate-400'>
                      <ChevronDown size={13} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort By Dropdown */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                  Sort By
                </label>
                <div className='relative'>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className='w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1rem',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <option value='Newest First'>Newest First</option>
                    <option value='Oldest First'>Oldest First</option>
                    <option value='Highest Sales'>Highest Sales</option>
                    <option value='Highest Stock'>Highest Stock</option>
                  </select>
                </div>
              </div>

              {/* Saved Filter Sets */}
              <div className='border-t border-slate-100 pt-5 space-y-3'>
                <div className='flex items-center justify-between'>
                  <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider'>
                    Saved Filter Sets
                  </h4>
                  <button
                    onClick={() => alert("Preset management panel opens.")}
                    className='text-xs font-bold text-[#FF1F6D] hover:underline cursor-pointer border-0 bg-transparent shadow-none p-0'
                  >
                    Manage
                  </button>
                </div>

                <div className='space-y-2.5'>
                  {[
                    {
                      name: 'Low Stock Minuman',
                      desc: 'Outlets: 4 • Status: Active • Stock: Low (≤ 10)',
                      action: () => {
                        setFilterCategoriesList(['Minuman'])
                        setFilterStatusList(['Active'])
                        setFilterStockCondition(['low'])
                        setFilterOutletsList(['Kemang', 'BSD', 'Bandung'])
                      }
                    },
                    {
                      name: 'Top Sellers This Month',
                      desc: 'Status: Active • Sales: > Rp500.000',
                      action: () => {
                        setFilterStatusList(['Active'])
                        setFilterMinSales('500000')
                      }
                    }
                  ].map((preset) => (
                    <div key={preset.name} className='bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between gap-3'>
                      <div>
                        <div className='font-bold text-slate-800 text-xs'>{preset.name}</div>
                        <div className='text-[10px] text-slate-400 mt-1 font-semibold'>{preset.desc}</div>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <button
                          type='button'
                          onClick={preset.action}
                          className='px-3 py-1 bg-white hover:bg-slate-50 text-[#FF1F6D] border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer'
                        >
                          Use
                        </button>
                        <button
                          type='button'
                          className='p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors border-0 bg-transparent'
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className='px-6 py-4.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0'>
              <button
                type='button'
                onClick={handleClearAllFilters}
                className='text-xs font-bold text-rose-500 hover:underline cursor-pointer border-0 bg-transparent shadow-none p-0'
              >
                Clear all
              </button>

              <div className='flex items-center gap-2 shrink-0'>
                <button
                  type='button'
                  onClick={() => alert("Filter set saved successfully!")}
                  className='px-3.5 py-2.5 border border-[#FF1F6D]/30 text-[#FF1F6D] bg-white hover:bg-rose-50/10 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer'
                >
                  <Bookmark size={13} />
                  Save filter set
                </button>
                <button
                  type='button'
                  onClick={() => setIsMoreFiltersOpen(false)}
                  className='px-4 py-2.5 bg-[#FF1F6D] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition-all flex items-center gap-1.5 cursor-pointer'
                >
                  <Check size={13} />
                  <span>Apply filters</span>
                  {countActiveMoreFilters() > 0 && (
                    <span className='flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#FF1F6D] text-[10px] font-bold shadow-sm shrink-0'>
                      {countActiveMoreFilters()}
                    </span>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ADD PRODUCT DRAWER */}
      {isAddProductOpen && (
        <div className='fixed inset-0 z-[100] flex justify-end'>
          {/* Backdrop */}
          <button
            type='button'
            onClick={() => setIsAddProductOpen(false)}
            className='fixed inset-0 bg-[#11182E]/40 backdrop-blur-[2px] cursor-default border-0 focus:outline-none'
          />

          {/* Drawer Panel */}
          <div className='relative z-10 bg-white w-full max-w-[560px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200'>
            {/* Header */}
            <header className='px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0'>
              <div>
                <h3 className='text-lg font-extrabold text-slate-900 flex items-center gap-2.5'>
                  <span>Add Product</span>
                  <span className='text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider'>
                    Create new product
                  </span>
                </h3>
                <p className='text-xs text-slate-400 font-semibold mt-1'>
                  Fill in the details below to add a new product to your catalog.
                </p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className='p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all cursor-pointer'
              >
                <X size={16} />
              </button>
            </header>

            {/* Scrollable Form */}
            <div className='p-6 overflow-y-auto space-y-6 flex-1 min-h-0 text-slate-700 text-sm'>
              {/* Product Image & Primary Fields Row */}
              <div className='flex gap-5 items-start'>
                {/* Left: Product Image */}
                <div className='w-[140px] shrink-0'>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>
                    Product Image
                  </label>
                  <div className='w-[140px] h-[140px] border-2 border-dashed border-slate-200 hover:border-[#FF1F6D] rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-rose-50/5 group'>
                    <UploadCloud size={24} className='text-slate-400 group-hover:text-[#FF1F6D] transition-colors mb-2' />
                    <span className='text-xs font-bold text-slate-700 group-hover:text-[#FF1F6D] transition-colors'>Upload image</span>
                    <span className='text-[9px] text-slate-400 font-semibold leading-relaxed mt-1'>
                      PNG, JPG or WEBP<br />Max 2MB • 1:1 ratio
                    </span>
                  </div>
                </div>

                {/* Right: Input fields */}
                <div className='flex-1 space-y-4'>
                  <div>
                    <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Product Name <span className='text-[#FF1F6D]'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder='e.g. Teh Tarik Vanilla'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      SKU <span className='text-[#FF1F6D]'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={addSku}
                      onChange={(e) => setAddSku(e.target.value)}
                      placeholder='e.g. SKU-SEL-007'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Category <span className='text-[#FF1F6D]'>*</span>
                    </label>
                    <div className='relative'>
                      <select
                        value={addCategory}
                        onChange={(e) => setAddCategory(e.target.value)}
                        className='w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1rem',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        <option value=''>Select category</option>
                        <option value='Minuman'>Minuman</option>
                        <option value='Makanan'>Makanan</option>
                        <option value='Signature'>Signature</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder='Describe the product, ingredients, taste, or other key details...'
                  className='w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold resize-none'
                />
                <div className='text-right text-[10px] text-slate-400 font-bold mt-1'>
                  {addDescription.length}/500
                </div>
              </div>

              {/* Price, Cost & Tax Row */}
              <div className='grid grid-cols-3 gap-3.5'>
                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Price <span className='text-[#FF1F6D]'>*</span>
                  </label>
                  <div className='flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/20 focus-within:border-[#FF1F6D] overflow-hidden'>
                    <span className='text-xs font-bold text-slate-400 bg-slate-100 border-r border-slate-200 px-3 py-2.5 shrink-0'>
                      Rp
                    </span>
                    <input
                      type='number'
                      value={addPrice}
                      onChange={(e) => setAddPrice(e.target.value)}
                      placeholder='0'
                      className='w-full px-3 py-2 bg-transparent text-xs text-slate-700 outline-none font-bold'
                    />
                  </div>
                  <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block leading-tight'>
                    Selling price visible to customers
                  </span>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Cost <span className='text-[#FF1F6D]'>*</span>
                  </label>
                  <div className='flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/20 focus-within:border-[#FF1F6D] overflow-hidden'>
                    <span className='text-xs font-bold text-slate-400 bg-slate-100 border-r border-slate-200 px-3 py-2.5 shrink-0'>
                      Rp
                    </span>
                    <input
                      type='number'
                      value={addCost}
                      onChange={(e) => setAddCost(e.target.value)}
                      placeholder='0'
                      className='w-full px-3 py-2 bg-transparent text-xs text-slate-700 outline-none font-bold'
                    />
                  </div>
                  <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block leading-tight'>
                    Your purchase / production cost
                  </span>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Tax
                  </label>
                  <div className='relative'>
                    <select
                      value={addTax}
                      onChange={(e) => setAddTax(e.target.value)}
                      className='w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1rem',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value='PPN 11%'>PPN 11%</option>
                      <option value='No Tax'>No Tax</option>
                    </select>
                  </div>
                  <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block leading-tight'>
                    Tax applied to this product
                  </span>
                </div>
              </div>

              {/* Tags & Product Status */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Tags
                  </label>
                  <input
                    type='text'
                    value={addTags}
                    onChange={(e) => setAddTags(e.target.value)}
                    placeholder='Add tags...'
                    className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold'
                  />
                  <div className='flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1'>
                    <span>Press Enter to add tags</span>
                    <span>{addTags ? addTags.split(',').length : 0}/10</span>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Product Status
                  </label>
                  <div className='relative'>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value)}
                      className='w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1rem',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value='Active'>Active</option>
                      <option value='Inactive'>Inactive</option>
                    </select>
                  </div>
                  <span className='text-[10px] text-slate-400 font-semibold mt-1.5 block'>
                    Only active products are visible in POS
                  </span>
                </div>
              </div>

              {/* Availability Type */}
              <div>
                <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5'>
                  <span>Availability Type</span>
                  <svg className='w-3.5 h-3.5 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </label>
                <div className='relative'>
                  <select
                    value={addAvailability}
                    onChange={(e) => setAddAvailability(e.target.value)}
                    className='w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1rem',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <option value='Always available'>Always available</option>
                    <option value='Custom availability'>Custom availability</option>
                  </select>
                </div>
                <span className='text-[10px] text-slate-400 font-semibold mt-1.5 block'>
                  Control how this product is available for sale
                </span>
              </div>

              {/* Outlet Assignment Preview */}
              <div>
                <div className='flex items-center justify-between mb-1.5'>
                  <div>
                    <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider'>
                      Outlet Assignment (Preview)
                    </h4>
                    <p className='text-[10px] text-slate-400 font-bold mt-0.5'>
                      Select outlets where this product will be available.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      if (addSelectedOutlets.length === 4) {
                        setAddSelectedOutlets([])
                      } else {
                        setAddSelectedOutlets(['Pusat', 'Kemang', 'BSD', 'Bandung'])
                      }
                    }}
                    className='text-xs font-bold text-[#FF1F6D] hover:text-[#e0155b] transition-colors border-0 bg-transparent cursor-pointer'
                  >
                    {addSelectedOutlets.length === 4 ? 'Clear All' : 'Select All'}
                  </button>
                </div>

                <div className='grid grid-cols-2 gap-2.5 mt-3'>
                  {[
                    { key: 'Pusat', name: 'SelaluTeh Pusat', loc: 'Jakarta' },
                    { key: 'Kemang', name: 'SelaluTeh Kemang', loc: 'Jakarta Selatan' },
                    { key: 'BSD', name: 'SelaluTeh BSD', loc: 'Tangerang' },
                    { key: 'Bandung', name: 'SelaluTeh Bandung', loc: 'Bandung' },
                  ].map((outlet) => (
                    <label
                      key={outlet.key}
                      className={`border rounded-xl p-3 flex items-start gap-3 bg-white relative cursor-pointer hover:border-[#FF1F6D]/50 transition-colors ${
                        addSelectedOutlets.includes(outlet.key) ? 'border-[#FF1F6D]/30 bg-rose-50/5' : 'border-slate-200'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={addSelectedOutlets.includes(outlet.key)}
                        onChange={() => {
                          setAddSelectedOutlets((prev) =>
                            prev.includes(outlet.key)
                              ? prev.filter((k) => k !== outlet.key)
                              : [...prev, outlet.key]
                          )
                        }}
                        className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4 h-4 cursor-pointer mt-0.5'
                      />
                      <div>
                        <div className='font-bold text-slate-800 text-xs'>{outlet.name}</div>
                        <div className='text-[10px] text-slate-400 mt-0.5 font-semibold'>{outlet.loc}</div>
                      </div>
                    </label>
                  ))}

                  <div className='border border-slate-200 border-dashed rounded-xl p-3 flex items-center justify-center text-xs font-bold text-slate-500 hover:border-slate-300 transition-all cursor-pointer bg-slate-50/50'>
                    +8 more
                  </div>
                </div>
              </div>

              {/* Inventory Defaults */}
              <div className='border-t border-slate-100 pt-5 space-y-4'>
                <div>
                  <h4 className='font-bold text-slate-800 text-sm'>
                    Inventory Defaults
                  </h4>
                  <p className='text-[10px] text-slate-400 font-bold mt-0.5'>
                    Set initial inventory defaults for this product.
                  </p>
                </div>

                <div className='flex items-center gap-4 flex-wrap'>
                  <div>
                    <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Initial Stock
                    </label>
                    <div className='flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/20 focus-within:border-[#FF1F6D] overflow-hidden w-36'>
                      <input
                        type='number'
                        value={addInitialStock}
                        onChange={(e) => setAddInitialStock(e.target.value)}
                        placeholder='0'
                        className='w-full px-3 py-2 bg-transparent text-xs text-slate-700 outline-none font-bold'
                      />
                      <span className='text-xs text-slate-400 font-semibold bg-slate-100 border-l border-slate-200 px-3 py-2 shrink-0'>
                        cups
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Low Stock Alert
                    </label>
                    <div className='flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/20 focus-within:border-[#FF1F6D] overflow-hidden w-36'>
                      <input
                        type='number'
                        value={addLowStockAlert}
                        onChange={(e) => setAddLowStockAlert(e.target.value)}
                        placeholder='10'
                        className='w-full px-3 py-2 bg-transparent text-xs text-slate-700 outline-none font-bold'
                      />
                      <span className='text-xs text-slate-400 font-semibold bg-slate-100 border-l border-slate-200 px-3 py-2 shrink-0'>
                        cups
                      </span>
                    </div>
                  </div>

                  <label className='flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors self-end pb-2.5 select-none'>
                    <input
                      type='checkbox'
                      checked={addTrackStock}
                      onChange={(e) => setAddTrackStock(e.target.checked)}
                      className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4.5 h-4.5 cursor-pointer'
                    />
                    <span>Track stock for this product</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className='px-6 py-4.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0'>
              <button
                type='button'
                onClick={() => setIsAddProductOpen(false)}
                className='px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm font-semibold'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSaveProduct}
                className='px-5 py-2.5 bg-[#FF1F6D] text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition-all font-semibold'
              >
                Save Product
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* 3. ASSIGN OUTLETS MODAL */}
      {isAssignOutletsOpen && outletAssignmentProduct && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
          <div className='bg-white rounded-2xl w-full max-w-[480px] shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]'>
            <header className='px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0'>
              <div>
                <h3 className='text-base font-extrabold text-slate-900'>
                  Assign Outlets & Custom Pricing
                </h3>
                <p className='text-xs text-slate-400 font-semibold mt-1'>
                  Configure availability for &quot;
                  {outletAssignmentProduct.name}&quot;
                </p>
              </div>
              <button
                onClick={() => setIsAssignOutletsOpen(false)}
                className='p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all'
              >
                <X size={16} />
              </button>
            </header>

            <div className='p-6 overflow-y-auto space-y-4 flex-1 min-h-0'>
              <div className='divide-y divide-slate-100/70 max-h-[360px] overflow-y-auto pr-1'>
                {outletAssignmentRows.map((row, idx) => (
                  <div
                    key={row.outletId}
                    className='py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4'
                  >
                    <div className='flex items-center gap-3.5'>
                      <input
                        type='checkbox'
                        checked={row.isAvailable}
                        onChange={(e) => {
                          setOutletAssignmentRows((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? { ...r, isAvailable: e.target.checked }
                                : r
                            )
                          )
                        }}
                        className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4.5 h-4.5 cursor-pointer'
                      />
                      <div>
                        <div className='font-bold text-slate-950 text-sm'>
                          {row.outletName}
                        </div>
                        <div className='text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider'>
                          {row.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 shrink-0'>
                      <div>
                        <label className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1'>
                          Price Override
                        </label>
                        <input
                          disabled={!row.isAvailable}
                          value={row.price}
                          onChange={(e) => {
                            setOutletAssignmentRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, price: e.target.value } : r
                              )
                            )
                          }}
                          type='number'
                          placeholder={String(outletAssignmentProduct.price)}
                          className='w-28 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#FF1F6D] disabled:opacity-50'
                        />
                      </div>
                      <div>
                        <label className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1'>
                          Stock Override
                        </label>
                        <input
                          disabled={!row.isAvailable}
                          value={row.stockQuantity}
                          onChange={(e) => {
                            setOutletAssignmentRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, stockQuantity: e.target.value }
                                  : r
                              )
                            )
                          }}
                          type='number'
                          placeholder={String(outletAssignmentProduct.stock)}
                          className='w-28 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#FF1F6D] disabled:opacity-50'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className='px-6 py-4.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 rounded-b-2xl shrink-0'>
              <button
                onClick={() => setIsAssignOutletsOpen(false)}
                className='px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutletAssignment}
                className='px-5 py-2.5 bg-[#FF1F6D] text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition-all'
              >
                Save Availability
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* 4. ARCHIVE CONFIRMATION MODAL */}
      {isArchiveConfirmOpen && archiveTarget && (
        <div className='fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
          <div className='bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border border-slate-100 flex flex-col'>
            <div className='p-6 text-center flex flex-col items-center gap-4.5'>
              <span className='grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 border border-rose-100/50 text-[#FF1F6D]'>
                <Trash2 size={28} />
              </span>
              <div>
                <h3 className='text-base font-extrabold text-slate-900'>
                  Archive Confirmation
                </h3>
                <p className='text-slate-500 text-xs font-semibold mt-2 leading-relaxed'>
                  {archiveTarget === 'bulk'
                    ? `Are you sure you want to archive all ${selectedSKUs.length} selected products? This will disable them across all outlets.`
                    : `Are you sure you want to archive product "${archiveTarget.name}"? This will disable it across all outlets.`}
                </p>
              </div>
            </div>

            <footer className='px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-3 rounded-b-2xl'>
              <button
                onClick={() => {
                  setIsArchiveConfirmOpen(false)
                  setArchiveTarget(null)
                }}
                className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm'
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className='px-5 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-rose-700 transition-all'
              >
                Yes, Archive
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* 5. EXPORT MODAL */}
      {isExportModalOpen && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
          <div className='bg-white rounded-2xl w-full max-w-[620px] shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150'>
            <header className='px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0'>
              <h3 className='text-lg font-bold text-slate-900'>
                Export Products
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className='p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all'
              >
                <X size={16} />
              </button>
            </header>

            <div className='p-6 overflow-y-auto space-y-6 flex-1 min-h-0 text-slate-700 text-sm'>
              {/* 1. Export Format */}
              <div>
                <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5'>
                  1. Export Format
                </h4>
                <div className='grid grid-cols-3 gap-3'>
                  {/* CSV Card */}
                  <button
                    type='button'
                    onClick={() => setExportFormat('csv')}
                    className={`flex flex-col text-left p-3.5 border rounded-2xl transition-all relative cursor-pointer ${
                      exportFormat === 'csv'
                        ? 'border-[#FF1F6D] bg-rose-50/10 shadow-sm ring-1 ring-[#FF1F6D]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className='w-10 h-10 rounded-xl bg-rose-50 text-[#FF1F6D] flex items-center justify-center mb-3.5'>
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                    <span className='font-extrabold text-slate-800 text-sm'>CSV</span>
                    <span className='text-[10px] text-slate-400 font-semibold mt-1 leading-normal'>
                      Best for data analysis and spreadsheets
                    </span>
                  </button>

                  {/* Excel Card */}
                  <button
                    type='button'
                    onClick={() => setExportFormat('excel')}
                    className={`flex flex-col text-left p-3.5 border rounded-2xl transition-all relative cursor-pointer ${
                      exportFormat === 'excel'
                        ? 'border-[#FF1F6D] bg-rose-50/10 shadow-sm ring-1 ring-[#FF1F6D]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className='w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5'>
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                    <span className='font-extrabold text-slate-800 text-sm'>Excel</span>
                    <span className='text-[10px] text-slate-400 font-semibold mt-1 leading-normal'>
                      Best for advanced analysis
                    </span>
                  </button>

                  {/* PDF Card */}
                  <button
                    type='button'
                    onClick={() => setExportFormat('pdf')}
                    className={`flex flex-col text-left p-3.5 border rounded-2xl transition-all relative cursor-pointer ${
                      exportFormat === 'pdf'
                        ? 'border-[#FF1F6D] bg-rose-50/10 shadow-sm ring-1 ring-[#FF1F6D]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className='w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3.5'>
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                        />
                      </svg>
                    </div>
                    <span className='font-extrabold text-slate-800 text-sm'>PDF</span>
                    <span className='text-[10px] text-slate-400 font-semibold mt-1 leading-normal'>
                      Best for reports and printing
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Export Scope */}
              <div>
                <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5'>
                  2. Export Scope
                </h4>
                <div className='space-y-3.5'>
                  <label className='flex items-start gap-3 cursor-pointer group'>
                    <input
                      type='radio'
                      name='exportScope'
                      value='all'
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className='h-4 w-4 rounded-full border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] mt-0.5 cursor-pointer'
                    />
                    <div>
                      <span className='font-bold text-slate-800 text-sm group-hover:text-slate-900 transition-colors'>
                        All filtered products ({filteredProducts.length})
                      </span>
                      <p className='text-[11px] font-semibold text-slate-400 mt-0.5'>
                        Export all products based on current filters
                      </p>
                    </div>
                  </label>

                  <label className='flex items-start gap-3 cursor-pointer group'>
                    <input
                      type='radio'
                      name='exportScope'
                      value='selected'
                      checked={exportScope === 'selected'}
                      onChange={() => setExportScope('selected')}
                      className='h-4 w-4 rounded-full border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] mt-0.5 cursor-pointer'
                    />
                    <div>
                      <span className='font-bold text-slate-800 text-sm group-hover:text-slate-900 transition-colors'>
                        Selected products ({selectedSKUs.length})
                      </span>
                      <p className='text-[11px] font-semibold text-slate-400 mt-0.5'>
                        Export only selected items
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Data Fields */}
              <div>
                <div className='flex items-center justify-between mb-2.5'>
                  <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider'>
                    3. Data Fields
                  </h4>
                  <label className='flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#FF1F6D] hover:text-[#e0155b] transition-colors'>
                    <input
                      type='checkbox'
                      checked={selectedFields.length === allAvailableFields.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields(allAvailableFields.map((f) => f.key))
                        } else {
                          setSelectedFields([])
                        }
                      }}
                      className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-3.5 h-3.5 cursor-pointer'
                    />
                    <span>Select all</span>
                  </label>
                </div>

                <div className='bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4'>
                  {allAvailableFields.map((field) => (
                    <label
                      key={field.key}
                      className='flex items-center gap-2.5 cursor-pointer hover:text-slate-955 transition-colors text-xs font-semibold'
                    >
                      <input
                        type='checkbox'
                        checked={selectedFields.includes(field.key)}
                        onChange={() => {
                          setSelectedFields((prev) =>
                            prev.includes(field.key)
                              ? prev.filter((k) => k !== field.key)
                              : [...prev, field.key]
                          )
                        }}
                        className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4 h-4 cursor-pointer'
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Outlet Scope & 5. Date Filter */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider mb-2'>
                    4. Outlet Scope
                  </h4>
                  <div className='relative'>
                    <select
                      value={exportOutletScope}
                      onChange={(e) => setExportOutletScope(e.target.value)}
                      className='w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1rem',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value='All Outlets'>All Outlets (12)</option>
                      <option value='Sudirman'>Kalis Sudirman</option>
                      <option value='Menteng'>Kalis Menteng</option>
                      <option value='Senopati'>Kalis Senopati</option>
                    </select>
                  </div>
                  <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 block'>
                    Export data from all outlets
                  </span>
                </div>

                <div>
                  <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider mb-2'>
                    5. Date Filter (Optional)
                  </h4>
                  <div className='relative'>
                    <select
                      value={exportDateFilter}
                      onChange={(e) => setExportDateFilter(e.target.value)}
                      className='w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1rem',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <option value='This Month'>This Month</option>
                      <option value='Today'>Today</option>
                      <option value='Yesterday'>Yesterday</option>
                      <option value='Last 7 Days'>Last 7 Days</option>
                      <option value='Custom'>Custom Range</option>
                    </select>
                  </div>
                  <span className='text-[9px] font-bold text-slate-400 mt-1.5 block leading-normal'>
                    May 1, 2025 - May 29, 2025 • Applies to sales and inventory data
                  </span>
                </div>
              </div>

              {/* 6. Delivery Option */}
              <div>
                <h4 className='font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5'>
                  6. Delivery Option
                </h4>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => setExportDelivery('download')}
                    className={`flex items-start gap-3 p-3.5 border rounded-2xl text-left transition-all cursor-pointer ${
                      exportDelivery === 'download'
                        ? 'border-[#FF1F6D] bg-rose-50/10 shadow-sm ring-1 ring-[#FF1F6D]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type='radio'
                      name='exportDelivery'
                      value='download'
                      checked={exportDelivery === 'download'}
                      readOnly
                      className='h-4 w-4 rounded-full border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] mt-0.5 cursor-pointer'
                    />
                    <div>
                      <span className='font-bold text-slate-800 text-sm'>Download now</span>
                      <p className='text-[10px] text-slate-400 font-semibold mt-1 leading-normal'>
                        Export file will be generated and downloaded immediately
                      </p>
                    </div>
                  </button>

                  <button
                    type='button'
                    onClick={() => setExportDelivery('email')}
                    className={`flex items-start gap-3 p-3.5 border rounded-2xl text-left transition-all cursor-pointer ${
                      exportDelivery === 'email'
                        ? 'border-[#FF1F6D] bg-rose-50/10 shadow-sm ring-1 ring-[#FF1F6D]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type='radio'
                      name='exportDelivery'
                      value='email'
                      checked={exportDelivery === 'email'}
                      readOnly
                      className='h-4 w-4 rounded-full border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] mt-0.5 cursor-pointer'
                    />
                    <div>
                      <span className='font-bold text-slate-800 text-sm'>Send to email</span>
                      <p className='text-[10px] text-slate-400 font-semibold mt-1 leading-normal'>
                        Export file will be sent to your email
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <footer className='px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 rounded-b-2xl shrink-0'>
              <button
                type='button'
                onClick={() => setIsExportModalOpen(false)}
                className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm font-semibold'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={() => {
                  if (exportDelivery === 'download') {
                    exportCsv(exportScope === 'selected')
                  } else {
                    alert(`Catalog export will be delivered to your email as a ${exportFormat.toUpperCase()} file shortly.`)
                  }
                  setIsExportModalOpen(false)
                }}
                className='px-5 py-2.5 bg-[#FF1F6D] text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition-all font-semibold'
              >
                Export
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {isAdjustStockOpen && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
          <div className='bg-white rounded-2xl w-full max-w-[500px] shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150'>
            {/* Header */}
            <header className='px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0'>
              <h3 className='text-base font-extrabold text-slate-900'>
                Adjust Stock
              </h3>
              <button
                onClick={() => setIsAdjustStockOpen(false)}
                className='p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer'
              >
                <X size={15} />
              </button>
            </header>

            {/* Content */}
            <div className='p-6 space-y-4 text-xs font-semibold text-slate-700'>
              <div className='grid grid-cols-2 gap-5'>
                {/* Left Column */}
                <div className='space-y-4'>
                  {/* Outlet Selector */}
                  <div>
                    <label className='block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Outlet <span className='text-rose-500'>*</span>
                    </label>
                    <div className='relative'>
                      <select
                        value={adjustStockOutlet}
                        onChange={(e) => setAdjustStockOutlet(e.target.value)}
                        className='w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1rem',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        {outletInventory.map((item) => (
                          <option key={item.outlet} value={item.outlet}>
                            {item.outlet}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Adjustment Type Radio Buttons */}
                  <div>
                    <label className='block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2'>
                      Adjustment Type <span className='text-rose-500'>*</span>
                    </label>
                    <div className='flex items-center gap-4'>
                      <label className='flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900'>
                        <input
                          type='radio'
                          name='adjustStockType'
                          value='add'
                          checked={adjustStockType === 'add'}
                          onChange={() => setAdjustStockType('add')}
                          className='h-4.5 w-4.5 border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] cursor-pointer'
                        />
                        <span>Add Stock</span>
                      </label>
                      <label className='flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900'>
                        <input
                          type='radio'
                          name='adjustStockType'
                          value='remove'
                          checked={adjustStockType === 'remove'}
                          onChange={() => setAdjustStockType('remove')}
                          className='h-4.5 w-4.5 border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] cursor-pointer'
                        />
                        <span>Remove Stock</span>
                      </label>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className='block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Quantity <span className='text-rose-500'>*</span>
                    </label>
                    <div className='flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/20 focus-within:border-[#FF1F6D] overflow-hidden w-full'>
                      <input
                        type='number'
                        value={adjustStockQuantity}
                        onChange={(e) => setAdjustStockQuantity(e.target.value)}
                        placeholder='10'
                        className='w-full px-3 py-2 bg-transparent text-xs text-slate-700 outline-none font-bold'
                      />
                      <span className='text-xs text-slate-400 font-semibold bg-slate-100 border-l border-slate-200 px-3 py-2 shrink-0'>
                        cups
                      </span>
                    </div>
                  </div>

                  {/* Reason Category dropdown select */}
                  <div>
                    <label className='block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Reason Category <span className='text-rose-500'>*</span>
                    </label>
                    <div className='relative'>
                      <select
                        value={adjustStockReasonSelect}
                        onChange={(e) => setAdjustStockReasonSelect(e.target.value)}
                        className='w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF1F6D]/20 focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-bold appearance-none cursor-pointer'
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1rem',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        <option value='Stock received'>Stock received</option>
                        <option value='Damaged goods'>Damaged goods</option>
                        <option value='Inventory count correction'>Inventory count correction</option>
                        <option value='Expired product'>Expired product</option>
                        <option value='Lost / Theft'>Lost / Theft</option>
                        <option value='Customer return'>Customer return</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className='flex flex-col h-full'>
                  <label className='block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                    Reason Notes <span className='text-rose-500'>*</span>
                  </label>
                  <textarea
                    value={adjustStockReasonText}
                    onChange={(e) => setAdjustStockReasonText(e.target.value)}
                    placeholder='Received from supplier.'
                    className='w-full flex-1 min-h-[140px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/20 text-xs text-slate-700 font-bold resize-none'
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className='px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-2xl shrink-0'>
              <button
                type='button'
                onClick={() => setIsAdjustStockOpen(false)}
                className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleConfirmAdjustStock}
                className='px-5 py-2.5 bg-[#FF1F6D] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition-all cursor-pointer'
              >
                Confirm Adjustment
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
