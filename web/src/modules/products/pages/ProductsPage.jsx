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

function DetailPanel({ product, onClose, mobile = false }) {
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
          ? 'fixed inset-y-0 right-0 z-50 w-full max-w-[390px] shadow-2xl'
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
            (tab, i) => (
              <button
                key={tab}
                type='button'
                className={cx(
                  'shrink-0 border-b-2 px-1 pb-3 text-sm font-bold transition-all duration-150',
                  i === 0
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

        <section className='mt-2.5 rounded-xl border border-[#E1E6EF] p-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-extrabold text-[#11182E]'>
              Inventory Summary
            </h3>
            <button
              type='button'
              className='text-sm font-bold text-[#6956E8] hover:underline'
            >
              View Details
            </button>
          </div>
          <div className='mt-2.5 grid grid-cols-3 gap-2'>
            <StatBox
              label='Total Stock'
              value={`${product.inventorySummary.total} cups`}
              valueClass='text-[#11182E]'
            />
            <StatBox
              label='Low Stock'
              value={`${product.inventorySummary.lowStock} outlets`}
              valueClass='text-[#EA7200]'
            />
            <StatBox
              label='Out of Stock'
              value={`${product.inventorySummary.outOfStock} outlets`}
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

        <section className='mt-2.5 rounded-xl border border-[#E1E6EF] p-3'>
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

        <section className='mt-2.5 rounded-xl border border-[#E1E6EF] p-3'>
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
              className='inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#F43F70] px-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(244,63,112,0.24)] hover:bg-[#e63166]'
            >
              <Warehouse size={14} /> Update Stock
            </button>
          </div>
        </section>
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

  useEffect(() => {
    loadProducts()
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
      return (
        matchesSearch &&
        matchesOutlet &&
        matchesCategory &&
        matchesStatus &&
        matchesTag &&
        matchesTab
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
  ])

  const openProduct = (product) => {
    setSelectedProduct(product)
    setIsDetailOpen(true)
    setMobileDetailOpen(true)
  }

  const exportCsv = () => {
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
    const rows = filteredProducts.map((item) => [
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
    anchor.download = 'kalis-products.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='flex flex-1 overflow-hidden bg-[#F6F8FB] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)] text-[#11182E]'>
      <main
        className={cx(
          'flex-1 flex flex-col min-w-0 p-4 pt-3 overflow-hidden transition-[padding] duration-200 motion-reduce:transition-none',
          isDetailOpen ? 'xl:pr-[416px]' : 'xl:pr-4'
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
                onClick={exportCsv}
                className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8]'
              >
                <Download size={14} />
                Export
              </button>
              <button
                type='button'
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

          <section className='mt-3 shrink-0 grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1.35fr_.95fr_.95fr_.95fr_.95fr_auto]'>
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
              className='inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#D6DCE8] bg-white px-3 text-sm font-bold text-[#11182E] hover:bg-[#F2F4F8]'
            >
              <Filter size={14} />
              More Filters
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
                        {head ? head : <RowCheckbox />}
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
                      <td className='border-b border-[#F2F4F8] px-3 py-3'>
                        <RowCheckbox />
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
                          <button
                            type='button'
                            onClick={(e) => e.stopPropagation()}
                            className='border-0 text-[#667085] hover:text-[#26314D] hover:bg-[#F2F4F8] w-8 h-8 rounded-lg flex items-center justify-center transition duration-150 focus:outline-none'
                            title='More actions'
                          >
                            <MoreVertical size={16} />
                          </button>
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
        <div className='fixed inset-y-0 right-0 z-[80] hidden xl:block w-[400px] h-[100dvh] bg-white border-l border-[#E1E6EF] overflow-hidden shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
          <DetailPanel
            product={selectedProduct}
            onClose={() => setIsDetailOpen(false)}
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
          />
        </div>
      )}
    </div>
  )
}
