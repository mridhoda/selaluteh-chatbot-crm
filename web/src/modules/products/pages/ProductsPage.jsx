import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ImportModal from '../components/ImportModal'
import * as XLSX from 'xlsx'
import api from '../../../shared/api/httpClient'
import { getOrderQueryParams, getSessionUser } from '../../../shared/auth/permissions'
import { isDemoMode } from '../../../mocks/demoState'
import selkopAlphaImage from '../../../assets/product-image/minuman/Selkop Aren Creamy & Alpha.webp'
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
  Store,
  ArrowUpRight,
  Copy,
  Archive,
  Camera,
  Sliders,
  Link,
  Shield,
} from 'lucide-react'

function resolveProductImage(name, fallback = '') {
  if (String(name || '').trim().toLowerCase() === 'selkop alpha') return selkopAlphaImage
  return fallback
}

async function createProductImageUpload(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || typeof createImageBitmap !== 'function') return file
  try {
    const source = await createImageBitmap(file)
    const scale = Math.min(1, 512 / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(source.width * scale)
    canvas.height = Math.round(source.height * scale)
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
    source.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' }) : file
  } catch {
    return file
  }
}

const dummyProducts = [
  {
    id: 1,
    name: 'Selkop Aren Creamy',
    sku: 'cof-slkp-01',
    image: '/images/products/salty-caramel.png',
    category: 'Signature',
    outlets: 1,
    price: 1000,
    cost: 8500,
    stock: 100,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 1000,
    salesChange: 100,
    totalSold: 190,
    modifierGroups: ['Sugar Level', 'Ice Level', 'Size / Ukuran'],
    description: 'Perpaduan espresso, susu segar, gula aren, dan sentuhan kelapa gurih.',
    tags: ['Best Seller', 'Premium'],
    tax: 'No Tax',
    trend: [
      420000, 430000, 760000, 840000, 690000, 790000, 950000, 820000, 910000,
      1200000, 1080000, 1140000,
    ],
    inventorySummary: { total: 100, lowStock: 0, outOfStock: 0 },
  },
  {
    id: 2,
    name: 'Cappuccino',
    sku: 'cof-cap-02',
    image: '/images/products/gula-aren.png',
    category: 'Coffee',
    outlets: 2,
    price: 18000,
    cost: 7000,
    stock: 85,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 2340000,
    salesChange: 25,
    totalSold: 180,
    modifierGroups: ['Size / Ukuran', 'Extra Shot'],
    description: 'Espresso dengan foam susu tebal dan taburan bubuk cokelat di atasnya.',
    tags: ['Best Seller'],
    tax: 'No Tax',
    trend: [
      380000, 430000, 520000, 460000, 650000, 700000, 610000, 720000, 680000,
      790000, 760000, 820000,
    ],
    inventorySummary: { total: 85, lowStock: 0, outOfStock: 0 },
  },
  {
    id: 3,
    name: 'Americano',
    sku: 'cof-ame-03',
    image: '/images/products/matcha-latte.png',
    category: 'Coffee',
    outlets: 2,
    price: 16000,
    cost: 5000,
    stock: 62,
    stockState: 'In Stock',
    status: 'Active',
    salesMonth: 1860000,
    salesChange: 18,
    totalSold: 130,
    modifierGroups: ['Ice Level', 'Extra Shot'],
    description: 'Espresso dengan air panas untuk kopi hitam yang klasik dan bersih.',
    tags: ['Classic'],
    tax: 'No Tax',
    trend: [
      220000, 290000, 360000, 410000, 520000, 480000, 530000, 610000, 590000,
      660000, 710000, 760000,
    ],
    inventorySummary: { total: 62, lowStock: 0, outOfStock: 0 },
  },
  {
    id: 4,
    name: 'Croissant',
    sku: 'pas-cro-01',
    image: '/images/products/lemon-tea.png',
    category: 'Pastry',
    outlets: 1,
    price: 22000,
    cost: 11000,
    stock: 12,
    stockState: 'Low Stock',
    status: 'Active',
    salesMonth: 440000,
    salesChange: -5,
    totalSold: 80,
    modifierGroups: [],
    description: 'Croissant mentega yang renyah dan berlapis-lapis.',
    tags: ['Fresh'],
    tax: 'No Tax',
    trend: [
      210000, 180000, 240000, 190000, 220000, 230000, 160000, 140000, 120000,
      110000, 100000, 90000,
    ],
    inventorySummary: { total: 12, lowStock: 12, outOfStock: 0 },
  },
  {
    id: 5,
    name: 'Mineral Water',
    sku: 'bev-min-01',
    image: '/images/products/choco-hazelnut.png',
    category: 'Beverage',
    outlets: 1,
    price: 8000,
    cost: 2000,
    stock: 0,
    stockState: 'Out of Stock',
    status: 'Inactive',
    salesMonth: 0,
    salesChange: -100,
    totalSold: 0,
    modifierGroups: [],
    description: 'Air mineral kemasan dingin menyegarkan.',
    tags: ['Fresh'],
    tax: 'No Tax',
    trend: [
      80000, 120000, 130000, 160000, 170000, 145000, 150000, 155000, 175000,
      180000, 210000, 220000,
    ],
    inventorySummary: { total: 0, lowStock: 0, outOfStock: 1 },
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
    modifierGroups: ['Sugar Level', 'Ice Level'],
    description: 'Thai tea klasik dengan warna kuat dan rasa manis creamy.',
    tags: ['Popular'],
    tax: 'No Tax',
    trend: [
      60000, 70000, 85000, 90000, 100000, 92000, 95000, 98000, 101000, 112000,
      120000, 124000,
    ],
    inventorySummary: { total: 250, lowStock: 4, outOfStock: 0 },
  },
  {
    id: 7,
    name: 'Americano Original',
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
    modifierGroups: ['Ice Level', 'Extra Shot'],
    description: 'Espresso dan air panas untuk pecinta kopi hitam yang clean.',
    tags: ['Classic'],
    tax: 'No Tax',
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
    modifierGroups: ['Size / Ukuran', 'Whipped Cream'],
    description: 'Minuman red velvet creamy dengan rasa manis lembut dan warna menarik.',
    tags: ['Seasonal'],
    tax: 'No Tax',
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
    modifierGroups: ['Size / Ukuran', 'Sugar Level'],
    description: 'Kopi susu vanilla lembut dengan aroma manis yang familiar.',
    tags: ['Classic'],
    tax: 'No Tax',
    trend: [
      52000, 60000, 71000, 74000, 68000, 62000, 58000, 54000, 50000, 48000,
      45000, 42000,
    ],
    inventorySummary: { total: 120, lowStock: 5, outOfStock: 0 },
  },
  {
    id: 10,
    name: 'Aren Creamy Signature',
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
    modifierGroups: ['Size / Ukuran', 'Ice Level', 'Sugar Level'],
    description: 'Menu creamy khas dengan manis gula aren yang lembut dan mudah dinikmati.',
    tags: ['Signature', 'Popular'],
    tax: 'No Tax',
    trend: [
      150000, 180000, 210000, 240000, 230000, 260000, 280000, 300000, 320000,
      340000, 360000, 390000,
    ],
    inventorySummary: { total: 210, lowStock: 4, outOfStock: 0 },
  },
]

const dummyModifiers = [
  {
    id: 1,
    name: 'Toppings',
    code: 'mod-top-01',
    type: 'Optional',
    selectionRule: 'Multi-select (max 3)',
    minSelection: 0,
    maxSelection: 3,
    outletScope: 'All Outlets',
    description: 'Optional add-ons for selected drinks and snacks.',
    tags: ['Add-on', 'Upsell'],
    options: [
      { name: 'Extra Cheese', price: 5000 },
      { name: 'Extra Sauce', price: 3000 },
      { name: 'Whipped Cream', price: 6000 },
      { name: 'Boba', price: 7000 },
      { name: 'Oreo Crumble', price: 4000 }
    ],
    productsCount: 12,
    categoriesCount: 3,
    requiredInCheckout: false,
    status: 'Active',
    updatedAt: 'May 10, 2024 10:15 AM'
  },
  {
    id: 2,
    name: 'Drink Options',
    code: 'mod-drk-01',
    type: 'Required',
    selectionRule: 'Single-select',
    minSelection: 1,
    maxSelection: 1,
    outletScope: 'All Outlets',
    description: 'Choice of drink base.',
    tags: ['Core', 'Choice'],
    options: [
      { name: 'Fresh Milk', price: 0 },
      { name: 'Oat Milk', price: 6000 },
      { name: 'Soy Milk', price: 4000 },
      { name: 'Almond Milk', price: 7000 }
    ],
    productsCount: 8,
    categoriesCount: 2,
    requiredInCheckout: true,
    status: 'Active',
    updatedAt: 'May 9, 2024 09:40 AM'
  },
  {
    id: 3,
    name: 'Sugar Level',
    code: 'mod-sug-01',
    type: 'Optional',
    selectionRule: 'Single-select',
    minSelection: 1,
    maxSelection: 1,
    outletScope: 'All Outlets',
    description: 'Adjust sweetness level.',
    tags: ['Sweetness'],
    options: [
      { name: 'No Sugar', price: 0 },
      { name: 'Less Sugar', price: 0 },
      { name: 'Normal Sugar', price: 0 },
      { name: 'Extra Sugar', price: 0 }
    ],
    productsCount: 10,
    categoriesCount: 3,
    requiredInCheckout: false,
    status: 'Active',
    updatedAt: 'May 8, 2024 04:20 PM'
  },
  {
    id: 4,
    name: 'Ice Level',
    code: 'mod-ice-01',
    type: 'Optional',
    selectionRule: 'Single-select',
    minSelection: 1,
    maxSelection: 1,
    outletScope: 'All Outlets',
    description: 'Adjust ice amount.',
    tags: ['Ice'],
    options: [
      { name: 'No Ice', price: 0 },
      { name: 'Less Ice', price: 0 },
      { name: 'Normal Ice', price: 0 }
    ],
    productsCount: 10,
    categoriesCount: 3,
    requiredInCheckout: false,
    status: 'Active',
    updatedAt: 'May 8, 2024 02:10 PM'
  },
  {
    id: 5,
    name: 'Extras',
    code: 'mod-ext-01',
    type: 'Optional',
    selectionRule: 'Multi-select (max 2)',
    minSelection: 0,
    maxSelection: 2,
    outletScope: 'All Outlets',
    description: 'Extra items for your order.',
    tags: ['Add-on'],
    options: [
      { name: 'Chocolate Sauce', price: 3000 },
      { name: 'Caramel Sauce', price: 3000 },
      { name: 'Grass Jelly', price: 4000 }
    ],
    productsCount: 5,
    categoriesCount: 1,
    requiredInCheckout: false,
    status: 'Inactive',
    updatedAt: 'May 7, 2024 11:05 AM'
  }
]

const getModifierIcon = (name) => {
  const n = name.toLowerCase()
  if (n.includes('topping')) {
    return {
      bg: 'bg-[#7F56D9]', // purple
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )
    }
  }
  if (n.includes('drink') || n.includes('milk') || n.includes('option')) {
    return {
      bg: 'bg-[#2970FF]', // blue
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9V5.25c0-.69.56-1.25 1.25-1.25h2c.69 0 1.25.56 1.25 1.25V9M3.75 9h16.5M4.5 9l1.5 10.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25L19.5 9" />
        </svg>
      )
    }
  }
  if (n.includes('sugar') || n.includes('sweet')) {
    return {
      bg: 'bg-[#EAAA08]', // amber/yellow
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }
  if (n.includes('ice') || n.includes('cold') || n.includes('level')) {
    return {
      bg: 'bg-[#06AED4]', // teal/cyan
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3m14.364-6.364l-10.728 10.728m0-10.728l10.728 10.728" />
        </svg>
      )
    }
  }
  // fallback / extras
  return {
    bg: 'bg-[#F79009]', // orange
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.15-.36.6-.36.75 0l2.368 5.678 6.136.568c.394.036.551.522.256.793l-4.57 4.16.822 5.926c.053.385-.364.689-.705.485l-5.328-3.155-5.328 3.155c-.34.204-.758-.1-.705-.485l.822-5.926-4.57-4.16c-.295-.271-.138-.757.256-.793l6.136-.568L11.48 3.499z" />
      </svg>
    )
  }
}

const categoryTone = {
  Signature: 'bg-rose-50 text-[#F43F70] border border-rose-100',
  Coffee: 'bg-violet-50 text-[#6956E8] border border-violet-100',
  'Non Coffee': 'bg-indigo-50 text-[#5B52D6] border border-indigo-100',
  Tea: 'bg-emerald-50 text-[#16A34A] border border-emerald-100',
  Chocolate: 'bg-orange-50 text-[#EA7200] border border-orange-100',
  Pastry: 'bg-amber-50 text-[#D68A00] border border-amber-100',
  Beverage: 'bg-blue-50 text-[#2563EB] border border-blue-100',
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
  const amount = Number(value)
  return formatter.format(Number.isFinite(amount) ? amount : 0).replace(/\s/g, '')
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const isSmall = className.includes('h-9')

  useEffect(() => {
    if (!previewOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewOpen])

  const preview = previewOpen && src ? createPortal(
    <div className='fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-5' onClick={() => setPreviewOpen(false)}>
      <div className='relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-white p-2 shadow-2xl' onClick={(event) => event.stopPropagation()}>
        <button type='button' onClick={() => setPreviewOpen(false)} className='absolute -right-3 -top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100' aria-label='Tutup preview foto'><X size={18} /></button>
        <img src={src} alt={name} className='max-h-[84vh] max-w-[86vw] rounded-xl object-contain' />
        <p className='m-0 px-2 pb-1 pt-2 text-center text-sm font-black text-slate-800'>{name}</p>
      </div>
    </div>,
    document.body,
  ) : null

  if (!src || failed) {
    return <>
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
      {preview}
    </>
  }

  return <>
    <img src={src} alt={name} onError={() => setFailed(true)} onClick={(event) => { event.stopPropagation(); setPreviewOpen(true) }} className={cx('cursor-zoom-in object-cover', className)} title='Klik untuk memperbesar foto' />
    {preview}
  </>
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
    brand: 'bg-[#FFF1F2] text-[#DC3545]',
    violet: 'bg-[#F5F3FF] text-[#6956E8]',
    orange: 'bg-[#FFF7E8] text-[#EA7200]',
    green: 'bg-[#ECFDF5] text-[#15803D]',
  }

  return (
    <article className='rounded-2xl border border-[#E1E6EF] bg-white p-3.5 shadow-[0_2px_12px_rgba(17,24,46,0.04)] flex items-center gap-3.5'>
      <span
        className={cx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-full',
          toneClass[tone]
        )}
      >
        <Icon size={22} />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='m-0 text-[11px] font-bold text-[#667085] leading-tight'>
          {label}
        </p>
        <p className='m-0 mt-0.5 text-2xl font-bold tracking-tight text-[#11182E] leading-none'>
          {value}
        </p>
        <div className='mt-1 flex items-center gap-1'>
          <Trend value={change} />
          <span className='text-[10px] font-semibold text-[#98A2B3] leading-none'>
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
  outletAvailability = [],
  onAdjustStockClick = () => {},
  onAssignOutletsClick = () => {},
  onToggleOutletAvailability = () => {},
  onOutletVisibilityChange = () => {},
  onUpdateProduct = () => {},
  onEditClick = () => {},
  productActivities = [],
  isLoadingActivities = false,
  activityTypeFilter = 'all',
  setActivityTypeFilter = () => {},
  totalActivities = 0,
  displayedActivities = [],
  dateRangeLabel = '',
  handleLoadMoreActivities = () => {},
  mappedActivities = [],
}) {
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editedDesc, setEditedDesc] = useState('')
  const [savingDesc, setSavingDesc] = useState(false)

  useEffect(() => {
    setEditedDesc(product?.description || '')
    setIsEditingDesc(false)
  }, [product])

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
                  onClick={() => onEditClick(product)}
                  className='rounded-lg border border-[#D7DFEC] px-3 py-1 text-sm font-bold text-[#11182E] hover:bg-[#F6F8FB] transition-colors cursor-pointer'
                >
                  Edit
                </button>
              </div>
              <div className='mt-3 space-y-2'>
                <InfoRow label='Product Name' value={product.name} />
                <InfoRow label='Category' value={product.category} />
                
                {/* Description Inline Editing (Full Width) */}
                <div className='border-t border-slate-100 pt-2.5 mt-2.5 pb-1'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm leading-5 text-[#667085]'>Description</span>
                    {!isEditingDesc && (
                      <button
                        type='button'
                        onClick={() => {
                          setEditedDesc(product.description || '')
                          setIsEditingDesc(true)
                        }}
                        className='p-1 rounded-md text-slate-400 hover:text-[#FF1F6D] hover:bg-rose-50 transition cursor-pointer'
                        title='Edit description'
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                  <div>
                    {isEditingDesc ? (
                      <div className='space-y-2'>
                        <textarea
                          rows={3}
                          value={editedDesc}
                          onChange={(e) => setEditedDesc(e.target.value)}
                          placeholder='Add product description...'
                          className='w-full rounded-xl border border-[#E1E6EF] bg-white p-2.5 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-semibold resize-none'
                        />
                        <div className='flex items-center gap-2'>
                          <button
                            type='button'
                            onClick={async () => {
                              setSavingDesc(true)
                              await onUpdateProduct(product.id || product._id, { description: editedDesc })
                              setIsEditingDesc(false)
                              setSavingDesc(false)
                            }}
                            disabled={savingDesc}
                            className='px-3 py-1.5 bg-[#FF1F6D] hover:bg-[#e0155b] disabled:bg-slate-350 text-white text-xs font-bold rounded-lg transition duration-150 cursor-pointer'
                          >
                            {savingDesc ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setEditedDesc(product.description || '')
                              setIsEditingDesc(false)
                            }}
                            disabled={savingDesc}
                            className='px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition duration-150 cursor-pointer'
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className='m-0 text-sm font-semibold text-[#11182E] leading-relaxed whitespace-pre-wrap'>
                        {product.description || <span className='text-slate-400 font-semibold italic'>No description</span>}
                      </p>
                    )}
                  </div>
                </div>
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

        {activeTab === 'Outlets' && (
          <div className='space-y-4 text-slate-700'>
            {/* Header section */}
            <div className='flex items-center justify-between shrink-0'>
              <div>
                <h3 className='text-sm font-extrabold text-slate-800'>Outlets</h3>
                <p className='text-[11px] text-slate-400 font-semibold mt-0.5'>
                  Manage product availability and pricing in each outlet.
                </p>
              </div>
              <button
                type='button'
                onClick={onAssignOutletsClick}
                className='inline-flex h-8 items-center gap-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg shadow-sm transition-all cursor-pointer'
              >
                <Store size={13} className='text-slate-400' />
                Assign to Outlets
              </button>
            </div>

            {/* Outlets table */}
            <div className='rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm'>
              <div className='overflow-x-auto max-w-full'>
                <table className='w-full text-left text-xs border-collapse'>
                  <thead className='bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100'>
                    <tr>
                      <th className='py-2.5 px-3'>Outlet</th>
                      <th className='py-2.5 px-2 text-center'>Available</th>
                      <th className='py-2.5 px-2 text-right'>Price</th>
                      <th className='py-2.5 px-3 text-center'>Stock Visibility</th>
                      <th className='py-2.5 px-3 text-center'>Status</th>
                      <th className='py-2.5 px-3 text-right'>Action</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100 font-semibold text-slate-700'>
                    {outletAvailability.map((row, idx) => {
                      const statusBadgeClass = row.isAvailable
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                      
                      return (
                        <tr key={row.outletId} className='hover:bg-slate-50/50'>
                          <td className='py-2.5 px-3 font-bold text-slate-800 text-[11px] truncate max-w-[130px]'>
                            {row.outletName}
                          </td>
                          <td className='py-2.5 px-2 text-center'>
                            <button
                              type='button'
                              onClick={() => onToggleOutletAvailability(idx, !row.isAvailable)}
                              className={cx(
                                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                row.isAvailable ? 'bg-emerald-500' : 'bg-slate-200'
                              )}
                            >
                              <span
                                className={cx(
                                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                  row.isAvailable ? 'translate-x-4' : 'translate-x-0'
                                )}
                              />
                            </button>
                          </td>
                          <td className='py-2.5 px-2 text-right'>
                            <div className='font-bold text-slate-800'>{money(row.price)}</div>
                            <span className={cx('text-[9px] font-bold uppercase leading-none block mt-0.5', row.isOverride ? 'text-amber-600' : 'text-slate-400')}>
                              {row.isOverride ? 'Override' : 'Default'}
                            </span>
                          </td>
                          <td className='py-2.5 px-3 text-center'>
                            <select
                              value={row.visibility || 'Show'}
                              onChange={(e) => onOutletVisibilityChange(idx, e.target.value)}
                              className='bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer'
                            >
                              <option value='Show'>Show</option>
                              <option value='Hide'>Hide</option>
                            </select>
                          </td>
                          <td className='py-2.5 px-3 text-center'>
                            <span className={cx('inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide leading-none', statusBadgeClass)}>
                              {row.isAvailable ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className='py-2.5 px-3 text-right'>
                            <div className='flex items-center justify-end gap-1.5'>
                              <button type='button' onClick={onAssignOutletsClick} className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors'>
                                <Edit3 size={12} />
                              </button>
                              <button type='button' className='p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors'>
                                <MoreVertical size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className='text-xs font-bold text-slate-400 uppercase tracking-wide mt-2 px-1'>
              Total assigned outlets: {outletAvailability.filter(o => o.isAvailable).length} of {outletAvailability.length}
            </div>
          </div>
        )}

        {activeTab === 'Sales' && (
          <div className='space-y-5 text-slate-700'>
            {/* Header + dropdown */}
            <div className='flex items-center justify-between shrink-0'>
              <h3 className='text-sm font-extrabold text-slate-800'>Sales Overview (This Month)</h3>
              <div className='relative'>
                <select className='pl-2 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer' style={{
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.35rem center',
                  backgroundSize: '0.8rem',
                  backgroundRepeat: 'no-repeat',
                }}>
                  <option>Compare Period</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                </select>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className='grid grid-cols-3 gap-2'>
              <div className='rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm'>
                <div className='text-[10px] font-bold text-slate-400'>Revenue</div>
                <div className='text-[15px] font-extrabold text-slate-800 mt-1'>{money(product.salesMonth)}</div>
                <div className='text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1.5'>
                  <Trend value={product.salesChange} /> <span className='text-slate-400 font-medium'>vs last month</span>
                </div>
              </div>
              
              <div className='rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm'>
                <div className='text-[10px] font-bold text-slate-400'>Units Sold</div>
                <div className='text-[15px] font-extrabold text-slate-800 mt-1'>{product.totalSold} cups</div>
                <div className='text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1.5'>
                  <Trend value={product.salesChange} /> <span className='text-slate-400 font-medium'>vs last month</span>
                </div>
              </div>

              <div className='rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm'>
                <div className='text-[10px] font-bold text-slate-400'>Avg. Price</div>
                <div className='text-[15px] font-extrabold text-slate-800 mt-1'>{money(product.price)}</div>
                <div className='text-[10px] font-bold text-slate-400 flex items-center gap-0.5 mt-1.5'>
                  <span className='font-medium'>— vs last month</span>
                </div>
              </div>
            </div>

            {/* Outlet Performance */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='text-xs font-bold text-slate-800'>Outlet Performance</h4>
                <button type='button' className='text-[10px] font-bold text-[#6956E8] hover:underline'>View Full Report</button>
              </div>
              <div className='grid grid-cols-2 rounded-xl border border-[#E1E6EF] bg-white p-3 shadow-sm divide-x divide-slate-100'>
                {/* Left Side: Best Performing Outlet */}
                <div className='flex items-center gap-3 pr-3.5'>
                  <span className='grid h-9 w-9 place-items-center rounded-xl bg-purple-50 border border-purple-100 text-[#6956E8] shrink-0'>
                    <Store size={18} />
                  </span>
                  <div className='min-w-0'>
                    <div className='text-[10px] font-bold text-slate-400'>Best Performing Outlet</div>
                    <div className='text-xs font-bold text-slate-900 mt-0.5 truncate'>
                      {product.bestPerformingOutlet?.name || 'No Sales Outlet'}
                    </div>
                    <div className='flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-500'>
                      <span>{money(product.bestPerformingOutlet?.revenue || 0)}</span>
                      <span>•</span>
                      <span>{product.bestPerformingOutlet?.quantity || 0} cups</span>
                      {product.bestPerformingOutlet && (
                        <span className='inline-block px-1 py-0.2 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase border border-emerald-100/50 leading-none shrink-0'>Top Outlet</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Right Side: comparison */}
                <div className='pl-3.5 flex flex-col justify-center'>
                  <div className='text-[10px] font-bold text-slate-400'>vs Last Month</div>
                  <div className='text-xs font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5'>
                    <Trend value={product.salesChange} />
                  </div>
                  <div className='text-[10px] font-semibold text-slate-500 mt-0.5'>
                    {(() => {
                      const changePct = Number(product.salesChange) || 0
                      const curRev = product.bestPerformingOutlet?.revenue || 0
                      const curQty = product.bestPerformingOutlet?.quantity || 0
                      const prevRev = changePct !== 0 ? Math.round(curRev / (1 + changePct / 100)) : curRev
                      const prevQty = changePct !== 0 ? Math.round(curQty / (1 + changePct / 100)) : curQty
                      return `${money(prevRev)} • ${prevQty} cups`
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Sales Chart */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='text-xs font-bold text-slate-800'>Sales by Day (This Month)</h4>
                <button type='button' className='text-[10px] font-bold text-[#6956E8] hover:underline'>View Full Report</button>
              </div>
              {/* Beautiful custom line chart with Y-axis */}
              {(() => {
                const width = 420
                const height = 140
                const padding = 14
                const values = product.trend || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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

                const maxVal = Math.max(...values, 1)
                const labels = [
                  maxVal,
                  maxVal * 0.75,
                  maxVal * 0.5,
                  maxVal * 0.25,
                  0
                ]
                const formatYLabel = (val) => {
                  if (val >= 1000000) {
                    return `Rp${(val / 1000000).toFixed(1)}m`
                  }
                  if (val >= 1000) {
                    return `Rp${Math.round(val / 1000)}k`
                  }
                  return `Rp${Math.round(val)}`
                }

                return (
                  <div className='relative'>
                    <div className='flex gap-3'>
                      {/* Y-axis Labels */}
                      <div className='flex flex-col justify-between text-[9px] font-bold text-slate-400 py-1.5 text-right w-11 shrink-0'>
                        {labels.map((lbl, idx) => (
                          <span key={idx}>{formatYLabel(lbl)}</span>
                        ))}
                      </div>
                      
                      {/* Chart Area */}
                      <div className='flex-1 relative'>
                        <svg viewBox={`0 0 ${width} ${height}`} className='h-28 w-full bg-[linear-gradient(180deg,rgba(105,86,232,0.06),rgba(105,86,232,0.01))] rounded-lg' role='img'>
                          {/* Grid lines */}
                          {[14, 42, 70, 98, 126].map((y, idx) => (
                            <line key={idx} x1='0' y1={y} x2={width} y2={y} stroke='#E1E6EF' strokeDasharray='4 6' strokeWidth='1' />
                          ))}
                          {/* Data line */}
                          <polyline
                            points={points}
                            fill='none'
                            stroke='#6956E8'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                          {/* Dots */}
                          {coords.map(([x, y], idx) => (
                            <circle key={idx} cx={x} cy={y} r='3.5' fill='white' stroke='#6956E8' strokeWidth='2' />
                          ))}
                        </svg>
                      </div>
                    </div>
                    {/* Date labels offset to match chart area */}
                    <div className='flex justify-between pl-14 pr-2 text-[10px] font-bold text-slate-400 mt-1.5'>
                      <span>1 May</span>
                      <span>8 May</span>
                      <span>15 May</span>
                      <span>22 May</span>
                      <span>29 May</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Contribution by Outlet */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='text-xs font-bold text-slate-800'>Contribution by Outlet</h4>
                <button type='button' className='text-[10px] font-bold text-[#6956E8] hover:underline'>View Full Report</button>
              </div>
              <div className='space-y-2.5'>
                {(() => {
                  const contributions = (product.outletContributions && product.outletContributions.length > 0)
                    ? product.outletContributions.slice(0, 5).map((item, idx) => ({
                        rank: idx + 1,
                        name: item.name,
                        amount: item.amount,
                        pct: item.pct,
                        active: true,
                      }))
                    : [
                        { rank: 1, name: 'SelaluTeh - Kemang', amount: 680000, pct: 21, active: true },
                        { rank: 2, name: 'SelaluTeh - SCBD', amount: 540000, pct: 17, active: true },
                        { rank: 3, name: 'SelaluTeh - Bintaro', amount: 420000, pct: 13, active: true },
                        { rank: 4, name: 'SelaluTeh - Bandung', amount: 380000, pct: 13, active: true },
                        { rank: 5, name: 'SelaluTeh - Surabaya', amount: 290000, pct: 9, active: true },
                      ]

                  if (product.outletContributions && product.outletContributions.length > 5) {
                    const othersList = product.outletContributions.slice(5)
                    const othersAmount = othersList.reduce((sum, item) => sum + item.amount, 0)
                    const othersPct = othersList.reduce((sum, item) => sum + item.pct, 0)
                    contributions.push({
                      rank: null,
                      name: `Others (${othersList.length} outlets)`,
                      amount: othersAmount,
                      pct: othersPct,
                      active: false,
                    })
                  }

                  return contributions.map((item, idx) => (
                    <div key={idx} className='flex items-center gap-3 py-0.5 text-xs font-bold text-slate-700'>
                      <span className='text-[10px] font-extrabold text-slate-400 w-4 text-center shrink-0'>
                        {item.rank || ''}
                      </span>
                      <span className={cx('w-32 truncate shrink-0', item.active ? 'text-slate-800' : 'text-slate-500 pl-0 font-semibold')}>
                        {item.name}
                      </span>
                      <div className='flex-1 h-1 rounded-full bg-slate-50 overflow-hidden shrink-0 min-w-[50px]'>
                        <div className={cx('h-full rounded-full', item.active ? 'bg-[#6956E8]' : 'bg-slate-200')} style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className='text-slate-800 font-extrabold shrink-0 w-20 text-right'>
                        {money(item.amount)}
                      </span>
                      <span className='text-slate-400 text-[10px] font-bold w-8 text-right shrink-0'>
                        {item.pct}%
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* View Full Report Button */}
            <button type='button' className='w-full py-2.5 bg-[#F0EEFF] hover:bg-[#E5E2FF] text-xs font-extrabold text-[#6956E8] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer'>
              View Full Report
              <svg className='w-3.5 h-3.5 text-[#6956E8]' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </button>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className='space-y-4 text-slate-700'>
            {/* Header */}
            <div>
              <h3 className='text-sm font-extrabold text-slate-800'>Activity History</h3>
              <p className='text-[11px] text-slate-400 font-semibold mt-0.5'>
                Track all changes and actions for this product.
              </p>
            </div>

            {/* Filters */}
            <div className='flex gap-2 shrink-0'>
              <div className='relative flex-1 min-w-0'>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className='w-full pl-2 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer'
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.45rem center',
                    backgroundSize: '0.9rem',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <option value='all'>All Activity Types</option>
                  <option value='product.price_change'>Price Changes</option>
                  <option value='stock.adjust'>Stock Adjustments</option>
                  <option value='product.outlet_availability_change'>Outlet Configuration</option>
                </select>
              </div>
              <button type='button' className='inline-flex h-8 items-center gap-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap'>
                {dateRangeLabel}
                <Calendar size={13} className='text-slate-400' />
              </button>
            </div>

            {/* Timeline */}
            <div className='relative pl-7 mt-6 space-y-5'>
              {/* Vertical line stem */}
              <div className='absolute left-3.5 top-2 bottom-2 w-[1.5px] bg-slate-100' />

              {isLoadingActivities ? (
                <div className='flex flex-col items-center justify-center py-8 text-slate-400 space-y-2'>
                  <RefreshCw className='animate-spin text-[#6956E8]' size={20} />
                  <span className='text-xs font-semibold'>Loading activities...</span>
                </div>
              ) : displayedActivities.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8 text-slate-400'>
                  <span className='text-xs font-semibold'>No activities recorded for this product</span>
                </div>
              ) : (
                displayedActivities.map((activity, idx) => (
                  <div key={idx} className='relative group'>
                    {/* Circle Icon Node */}
                    <span className={cx('absolute -left-7 top-1.5 grid h-6.5 w-6.5 place-items-center rounded-full border bg-white shadow-sm transition-all group-hover:scale-110 z-10', activity.iconBg)}>
                      {activity.icon}
                    </span>

                    {/* Card content */}
                    <div className='rounded-xl border border-slate-100 p-3 bg-white shadow-sm hover:border-slate-200 transition-all'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                          {/* Avatar */}
                          <span className='h-5 w-5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-[8px] flex items-center justify-center shrink-0 uppercase shadow-inner'>
                            {activity.avatar}
                          </span>
                          <div>
                            <div className='text-xs font-bold text-slate-800'>{activity.title}</div>
                            <div className='text-[10px] text-slate-400 font-semibold mt-0.5'>by {activity.actor}</div>
                          </div>
                        </div>
                        <div className='text-[10px] text-slate-400 font-bold tracking-wide text-right shrink-0 whitespace-nowrap'>
                          {activity.time}
                        </div>
                      </div>

                      {/* Secondary details */}
                      {activity.details && (
                        <div className='mt-2.5 text-xs text-slate-500 font-semibold pl-7 leading-normal'>
                          {activity.details}
                          {activity.badge && (
                            <span className={cx('inline-block ml-1.5 px-1 py-0.2 rounded text-[9px] font-extrabold uppercase border leading-none', activity.badgeBg)}>
                              {activity.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom info */}
            <div className='flex items-center justify-between mt-5 pt-3 border-t border-slate-100 shrink-0'>
              <span className='text-[11px] text-slate-400 font-bold uppercase tracking-wider'>
                {productActivities.length > 0 ? totalActivities : mappedActivities.length} activities found
              </span>
              {displayedActivities.length < (productActivities.length > 0 ? totalActivities : mappedActivities.length) && (
                <button
                  type='button'
                  onClick={handleLoadMoreActivities}
                  className='px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition-all shadow-sm cursor-pointer'
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function ModifierDetailPanel({
  modifier,
  onClose,
  mobile = false,
  activeTab = 'Overview',
  setActiveTab = () => {},
  products = [],
  onUpdateModifier = () => {},
}) {
  const [searchLinkedQuery, setSearchLinkedQuery] = useState('')
  const [outletFilter, setOutletFilter] = useState('All Outlets')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('Status')
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false)
  const [isOptionsPopupOpen, setIsOptionsPopupOpen] = useState(false)
  const [isLinkProductsPopupOpen, setIsLinkProductsPopupOpen] = useState(false)
  const [linkProductSearch, setLinkProductSearch] = useState('')
  const [selectedLinkProductIds, setSelectedLinkProductIds] = useState([])
  const [editForm, setEditForm] = useState(() => ({
    name: modifier.name || '',
    type: modifier.type || 'Optional',
    selectionRule: modifier.selectionRule || 'Single-select',
    minSelection: modifier.minSelection ?? 0,
    maxSelection: modifier.maxSelection ?? 1,
    outletScope: modifier.outletScope || 'all_outlets',
    description: modifier.description || '',
    tags: (modifier.tags || []).join(', '),
  }))
  const [optionsDraft, setOptionsDraft] = useState(() => (modifier.options || []).map((option) => ({
    id: option.id || option.name,
    name: option.name || String(option),
    price: option.price ?? option.priceDelta ?? 0,
  })))

  useEffect(() => {
    setEditForm({
      name: modifier.name || '',
      type: modifier.type || 'Optional',
      selectionRule: modifier.selectionRule || 'Single-select',
      minSelection: modifier.minSelection ?? 0,
      maxSelection: modifier.maxSelection ?? 1,
      outletScope: modifier.outletScope || 'all_outlets',
      description: modifier.description || '',
      tags: (modifier.tags || []).join(', '),
    })
    setOptionsDraft((modifier.options || []).map((option) => ({
      id: option.id || option.name,
      name: option.name || String(option),
      price: option.price ?? option.priceDelta ?? 0,
    })))
  }, [modifier.id])

  const saveEditForm = () => {
    const updated = {
      ...modifier,
      ...editForm,
      minSelection: Number(editForm.minSelection || 0),
      maxSelection: Number(editForm.maxSelection || 0),
      tags: editForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      requiredInCheckout: editForm.type === 'Required' || Number(editForm.minSelection || 0) > 0,
    }
    onUpdateModifier(updated)
    setIsEditPopupOpen(false)
  }

  const saveOptionsDraft = () => {
    const nextOptions = optionsDraft
      .map((option) => ({ ...option, name: option.name.trim(), price: Number(option.price || 0) }))
      .filter((option) => option.name)
    onUpdateModifier({ ...modifier, options: nextOptions })
    setIsOptionsPopupOpen(false)
  }

  const saveLinkedProducts = async () => {
    const nextLinkedProducts = products.filter((product) => selectedLinkProductIds.includes(product.id))
    let updatedModifier = {
      ...modifier,
      linkedProducts: nextLinkedProducts,
      productsCount: nextLinkedProducts.length,
      categoriesCount: new Set(nextLinkedProducts.map((product) => product.category).filter(Boolean)).size || modifier.categoriesCount,
    }
    try {
      const res = await api.put(`/products/modifiers/${modifier.id}/links`, { productIds: selectedLinkProductIds })
      const refreshed = Array.isArray(res.data?.data) ? res.data.data.find((item) => item.id === modifier.id) : null
      if (refreshed) updatedModifier = refreshed
    } catch (err) {
      console.error('Failed to persist linked products:', err)
    }
    onUpdateModifier(updatedModifier)
    setIsLinkProductsPopupOpen(false)
  }

  // Find actual products linked to this modifier group
  const linkedProducts = useMemo(() => {
    const backendLinkedProducts = Array.isArray(modifier.linkedProducts) && modifier.linkedProducts.length > 0
      ? modifier.linkedProducts.map((product) => ({
          ...product,
          category: product.metadata?.category || product.category || 'Menu',
          sku: product.sku || product.code || '',
          price: Number(product.price ?? product.basePrice ?? product.base_price ?? 0),
          image: product.image || product.thumbnailUrl || product.thumbnail_url || '',
          status: product.isActive === false ? 'Inactive' : 'Active',
        }))
      : []
    const sourceProducts = backendLinkedProducts.length > 0 ? backendLinkedProducts : products
    return sourceProducts.filter((p) => {
      // check if product has modifier group
      const hasGroup = backendLinkedProducts.length > 0 || (p.modifierGroups && p.modifierGroups.some(
        (g) => g.toLowerCase() === modifier.name.toLowerCase()
      ))
      if (!hasGroup) return false

      // Apply search query
      if (searchLinkedQuery) {
        const q = searchLinkedQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchSku = (p.sku || '').toLowerCase().includes(q)
        if (!matchName && !matchSku) return false
      }

      // Apply category filter
      if (categoryFilter !== 'All Categories') {
        if (p.category !== categoryFilter) return false
      }

      return true
    })
  }, [products, modifier.name, searchLinkedQuery, categoryFilter])

  useEffect(() => {
    if (!isLinkProductsPopupOpen) return
    setSelectedLinkProductIds(linkedProducts.map((product) => product.id))
  }, [isLinkProductsPopupOpen, modifier.id])

  const linkProductCandidates = useMemo(() => {
    const q = linkProductSearch.trim().toLowerCase()
    return products.filter((product) => {
      if (!q) return true
      return product.name.toLowerCase().includes(q) || String(product.sku || '').toLowerCase().includes(q) || String(product.category || '').toLowerCase().includes(q)
    })
  }, [products, linkProductSearch])

  // Count unique categories
  const categoriesCount = useMemo(() => {
    const cats = new Set(linkedProducts.map((p) => p.category))
    return cats.size || modifier.categoriesCount || 0
  }, [linkedProducts, modifier.categoriesCount])

  const iconData = getModifierIcon(modifier.name)

  return (
    <>
    <aside
      className={cx(
        'bg-white flex flex-col h-full',
        mobile
          ? 'fixed inset-y-0 right-0 z-50 w-full max-w-[480px] shadow-2xl'
          : 'h-full overflow-hidden'
      )}
    >
      {/* Sidebar Header */}
      <header className='shrink-0 border-b border-[#E1E6EF] bg-white px-5 pt-5 z-10'>
        <div className='flex items-center justify-between gap-3.5'>
          <div className='flex min-w-0 items-center gap-4'>
            <div className={cx('w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm shrink-0', iconData.bg)}>
              <div className='scale-125'>{iconData.icon}</div>
            </div>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='m-0 truncate text-base font-extrabold text-[#11182E]'>
                  {modifier.name}
                </h2>
                <span className='rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-[11px] font-bold'>
                  {modifier.status}
                </span>
              </div>
              <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-[#667085]'>
                <span>{modifier.code}</span>
                <span>•</span>
                <span className={cx(
                  'rounded-lg px-2 py-0.5 text-[11px] font-bold border',
                  modifier.type === 'Required'
                    ? 'bg-[#FFF1F2] text-[#DC3545] border-[#FEE2E2]'
                    : 'bg-[#F5F3FF] text-[#6956E8] border-[#EDE9FE]'
                )}>
                  {modifier.type}
                </span>
              </div>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-1.5'>
            <button
              type='button'
              className='grid h-9 w-9 place-items-center rounded-lg border border-[#E1E6EF] text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E] transition cursor-pointer'
            >
              <MoreVertical size={16} />
            </button>
            <button
              type='button'
              onClick={onClose}
              className='grid h-9 w-9 place-items-center rounded-lg border border-[#E1E6EF] text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E] transition cursor-pointer'
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs switcher: Overview, Linked Products (Activity is excluded as requested) */}
        <div className='mt-4 flex gap-3 overflow-x-auto -mb-[1px]'>
          {['Overview', 'Linked Products'].map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={() => setActiveTab(tab)}
              className={cx(
                'shrink-0 border-b-2 px-1 pb-3 text-sm font-bold transition-all duration-150 cursor-pointer',
                activeTab === tab
                  ? 'border-[#FF1F6D] text-[#FF1F6D]'
                  : 'border-transparent text-[#667085] hover:text-[#11182E]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Sidebar Content */}
      <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-6 bg-[#FCFDFE]'>
        {activeTab === 'Overview' && (
          <div className='space-y-4'>
            {/* Basic Information */}
            <section className='rounded-2xl border border-[#D7DFEC] bg-white p-4 shadow-[0_2px_8px_rgba(17,24,46,0.02)]'>
              <div className='flex items-center justify-between'>
                <h3 className='m-0 text-base font-extrabold text-[#11182E]'>
                  Basic Information
                </h3>
                <button
                  type='button'
                  onClick={() => setIsEditPopupOpen(true)}
                  className='rounded-lg border border-[#D7DFEC] px-3 py-1 text-sm font-bold text-[#11182E] hover:bg-[#F6F8FB] transition cursor-pointer bg-white'
                >
                  Edit
                </button>
              </div>
              <div className='mt-4 space-y-3.5'>
                <InfoRow label='Modifier Group Name' value={modifier.name} />
                <div className='grid grid-cols-[150px_minmax(0,1fr)] items-center gap-2'>
                  <span className='text-sm text-[#667085]'>Type</span>
                  <span className={cx(
                    'inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold border w-max',
                    modifier.type === 'Required'
                      ? 'bg-[#FFF1F2] text-[#DC3545] border-[#FEE2E2]'
                      : 'bg-[#F5F3FF] text-[#6956E8] border-[#EDE9FE]'
                  )}>
                    {modifier.type}
                  </span>
                </div>
                <InfoRow label='Selection Rule' value={modifier.selectionRule} />
                <InfoRow label='Min Selection' value={modifier.minSelection ?? 0} />
                <InfoRow label='Max Selection' value={modifier.maxSelection ?? 1} />
                <InfoRow label='Outlet Scope' value={modifier.outletScope || 'All Outlets'} />
                <InfoRow label='Description' value={modifier.description || '-'} multiline />
                
                <div className='grid grid-cols-[150px_minmax(0,1fr)] items-start gap-2 pt-1 border-t border-slate-100'>
                  <span className='text-sm text-[#667085]'>Tags</span>
                  <div className='flex flex-wrap gap-1.5'>
                    {modifier.tags && modifier.tags.length > 0 ? (
                      modifier.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cx(
                            'rounded-lg px-2.5 py-0.5 text-[11px] font-bold border',
                            tag === 'Add-on'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-violet-50 text-violet-700 border-violet-100'
                          )}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className='text-sm font-semibold text-slate-400 italic'>No tags</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Modifier Options */}
            <section className='rounded-2xl border border-[#D7DFEC] bg-white p-4 shadow-[0_2px_8px_rgba(17,24,46,0.02)]'>
              <div className='flex items-center justify-between'>
                <h3 className='m-0 text-base font-extrabold text-[#11182E]'>
                  Modifier Options
                </h3>
                <button
                  type='button'
                  onClick={() => setIsOptionsPopupOpen(true)}
                  className='text-sm font-bold text-[#FF1F6D] hover:underline cursor-pointer bg-transparent border-0'
                >
                  Manage Options
                </button>
              </div>
              <div className='mt-3.5 divide-y divide-slate-100'>
                {modifier.options.map((opt, idx) => {
                  const name = typeof opt === 'string' ? opt : opt.name
                  const price = typeof opt === 'string' ? 0 : opt.price
                  return (
                    <div key={idx} className='flex items-center justify-between py-2.5 first:pt-0 last:pb-0'>
                      <div className='flex items-center gap-2.5 min-w-0'>
                        {/* 6-dot grab handle */}
                        <div className='flex flex-col gap-0.5 text-slate-350 cursor-grab'>
                          <div className='flex gap-0.5'>
                            <span className='w-1 h-1 rounded-full bg-slate-300' />
                            <span className='w-1 h-1 rounded-full bg-slate-300' />
                          </div>
                          <div className='flex gap-0.5'>
                            <span className='w-1 h-1 rounded-full bg-slate-300' />
                            <span className='w-1 h-1 rounded-full bg-slate-300' />
                          </div>
                          <div className='flex gap-0.5'>
                            <span className='w-1 h-1 rounded-full bg-slate-300' />
                            <span className='w-1 h-1 rounded-full bg-slate-300' />
                          </div>
                        </div>
                        {/* Purple bullet */}
                        <div className='w-2 h-2 rounded-full bg-[#7F56D9]' />
                        <span className='text-sm font-semibold text-[#11182E] truncate'>{name}</span>
                      </div>
                      <span className='text-sm font-bold text-[#475467] shrink-0'>
                        {price > 0 ? `+Rp${price.toLocaleString('id-ID')}` : '+Rp0'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Linked Products Summary */}
            <section className='rounded-2xl border border-[#D7DFEC] bg-white p-4 shadow-[0_2px_8px_rgba(17,24,46,0.02)]'>
              <div className='flex items-center justify-between'>
                <h3 className='m-0 text-base font-extrabold text-[#11182E]'>
                  Linked Products Summary
                </h3>
                <button
                  type='button'
                  onClick={() => setActiveTab('Linked Products')}
                  className='text-sm font-bold text-[#FF1F6D] hover:underline cursor-pointer bg-transparent border-0'
                >
                  View Linked Products
                </button>
              </div>
              <div className='mt-4 grid grid-cols-3 gap-2.5'>
                <div className='rounded-xl border border-slate-100 bg-[#FCFDFE] p-2.5 text-center'>
                  <p className='text-[10px] font-bold text-[#667085] leading-tight uppercase tracking-wider'>Linked Products</p>
                  <p className='mt-1 text-lg font-black text-[#11182E]'>{modifier.productsCount}</p>
                </div>
                <div className='rounded-xl border border-slate-100 bg-[#FCFDFE] p-2.5 text-center'>
                  <p className='text-[10px] font-bold text-[#667085] leading-tight uppercase tracking-wider'>Categories</p>
                  <p className='mt-1 text-lg font-black text-[#11182E]'>{categoriesCount}</p>
                </div>
                <div className='rounded-xl border border-slate-100 bg-[#FCFDFE] p-2.5 text-center'>
                  <p className='text-[10px] font-bold text-[#667085] leading-tight uppercase tracking-wider'>Required</p>
                  <p className='mt-1 text-lg font-black text-[#11182E]'>{modifier.requiredInCheckout ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {/* Horizontal list of linked products */}
              <div className='mt-4 flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin'>
                {linkedProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className='flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 bg-[#F8FAFC] shrink-0 min-w-0 max-w-[150px] shadow-sm'>
                    <div className='w-4.5 h-4.5 rounded bg-purple-100 flex items-center justify-center text-[10px] shrink-0'>☕</div>
                    <span className='text-xs font-semibold text-[#475467] truncate'>{p.name}</span>
                  </div>
                ))}
                {linkedProducts.length === 0 && (
                  <div className='text-xs italic text-slate-450 w-full text-center py-2'>No linked products found.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Linked Products Tab */}
        {activeTab === 'Linked Products' && (
          <div className='space-y-4'>
            {/* Top metrics cards */}
            <div className='grid grid-cols-3 gap-2.5'>
              <div className='rounded-xl border border-[#EDE9FE] bg-[#F5F3FF] p-3 text-center shadow-sm flex flex-col items-center justify-center'>
                <div className='w-8 h-8 rounded-full bg-white text-[#7F56D9] flex items-center justify-center shadow-sm'>
                  <Link size={14} />
                </div>
                <p className='mt-2 text-xl font-black text-[#11182E] leading-none'>{modifier.productsCount}</p>
                <p className='mt-1 text-[10px] font-bold text-[#7F56D9] uppercase tracking-wider leading-none'>Linked Products</p>
              </div>
              <div className='rounded-xl border border-[#FFEDD5] bg-[#FFF7ED] p-3 text-center shadow-sm flex flex-col items-center justify-center'>
                <div className='w-8 h-8 rounded-full bg-white text-[#EA7200] flex items-center justify-center shadow-sm'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <p className='mt-2 text-xl font-black text-[#11182E] leading-none'>{categoriesCount}</p>
                <p className='mt-1 text-[10px] font-bold text-[#EA7200] uppercase tracking-wider leading-none'>Categories</p>
              </div>
              <div className='rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] p-3 text-center shadow-sm flex flex-col items-center justify-center'>
                <div className='w-8 h-8 rounded-full bg-white text-[#10B981] flex items-center justify-center shadow-sm'>
                  <Store size={14} />
                </div>
                <p className='mt-2 text-xl font-black text-[#11182E] leading-none'>6</p>
                <p className='mt-1 text-[10px] font-bold text-[#10B981] uppercase tracking-wider leading-none'>Used in Outlets</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className='space-y-2.5'>
              <label className='relative block min-w-0'>
                <span className='sr-only'>Search linked product</span>
                <Search size={14} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]' />
                <input
                  type='text'
                  value={searchLinkedQuery}
                  onChange={(e) => setSearchLinkedQuery(e.target.value)}
                  placeholder='Search linked product...'
                  className='h-9 w-full rounded-lg border border-[#E1E6EF] bg-white pl-8 pr-3 text-sm text-[#11182E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF1F6D]'
                />
              </label>
              <div className='grid grid-cols-3 gap-2'>
                <select
                  value={outletFilter}
                  onChange={(e) => setOutletFilter(e.target.value)}
                  className='h-8 rounded-lg border border-[#E1E6EF] bg-white px-2 text-xs font-semibold text-[#475467] outline-none'
                >
                  <option>All Outlets</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className='h-8 rounded-lg border border-[#E1E6EF] bg-white px-2 text-xs font-semibold text-[#475467] outline-none'
                >
                  <option value='All Categories'>All Categories</option>
                  <option value='Signature'>Signature</option>
                  <option value='Coffee'>Coffee</option>
                  <option value='Pastry'>Pastry</option>
                  <option value='Beverage'>Beverage</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className='h-8 rounded-lg border border-[#E1E6EF] bg-white px-2 text-xs font-semibold text-[#475467] outline-none'
                >
                  <option>Status</option>
                </select>
              </div>
            </div>

            {/* Linked Products List */}
            <div className='border border-slate-100 rounded-xl bg-white overflow-hidden shadow-sm'>
              <div className='overflow-x-auto'>
                <table className='w-full border-separate border-spacing-0'>
                  <thead>
                    <tr className='text-left text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-wider'>
                      <th className='px-3 py-2 border-b border-slate-100 w-9'>
                        <div className='w-4.5 h-4.5 rounded-full border-2 border-[#FF1F6D] bg-[#FF1F6D] flex items-center justify-center text-white text-[9px] font-black cursor-pointer'>✓</div>
                      </th>
                      <th className='px-3 py-2 border-b border-slate-100'>Product</th>
                      <th className='px-3 py-2 border-b border-slate-100 text-right'>Price</th>
                      <th className='px-3 py-2 border-b border-slate-100 text-right'>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProducts.slice(0, 5).map((p) => (
                      <tr key={p.id} className='hover:bg-[#FFF7F9]/30 transition group'>
                        <td className='px-3 py-3 border-b border-slate-50'>
                          {/* Checkbox with checked state (checked circle with pink border/bg) */}
                          <div className='w-4.5 h-4.5 rounded-full border-2 border-[#FF1F6D] bg-[#FF1F6D] flex items-center justify-center text-white text-[9px] font-black cursor-pointer shadow-sm shadow-rose-100'>✓</div>
                        </td>
                        <td className='px-3 py-3 border-b border-slate-50'>
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <ProductImage
                              src={p.image}
                              name={p.name}
                              className='h-9 w-9 shrink-0 rounded-lg bg-slate-50 object-contain p-0.5 border border-slate-100 shadow-sm'
                            />
                            <div className='min-w-0 flex flex-col'>
                              <span className='text-xs font-bold text-[#11182E] truncate leading-tight'>{p.name}</span>
                              <div className='flex items-center gap-1 mt-0.5'>
                                <span className='text-[9px] font-semibold text-[#98A2B3] uppercase leading-none'>{p.sku || `SKU-0${p.id}`}</span>
                                <span className='text-[9px] text-slate-300'>•</span>
                                <span className={cx(
                                  'inline-flex h-4 items-center rounded-md px-1.5 text-[8px] font-bold leading-none border',
                                  categoryTone[p.category] || 'bg-slate-50 text-slate-600'
                                )}>
                                  {p.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-3 py-3 border-b border-slate-50 text-right text-xs font-bold text-[#475467]'>
                          {money(p.price)}
                        </td>
                        <td className='px-3 py-3 border-b border-slate-50 text-right' onClick={(e) => e.stopPropagation()}>
                          <div className='flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition'>
                            <button
                              type='button'
                              className='text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1 rounded-md text-slate-700 shadow-xs cursor-pointer'
                              onClick={() => alert(`Viewing product: ${p.name}`)}
                            >
                              View
                            </button>
                            <button className='p-1 text-slate-400 hover:text-slate-600 cursor-pointer'>
                              <MoreVertical size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className='p-3 border-t border-slate-100 bg-[#FCFDFE] flex items-center justify-between text-[11px] text-[#667085]'>
                <span>Showing 1 to {Math.min(5, linkedProducts.length)} of {linkedProducts.length} products</span>
                <div className='flex items-center gap-1.5'>
                  <button className='px-1.5 py-1 rounded border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 font-bold'>&lt;</button>
                  <button className='px-2.5 py-1 rounded border border-[#FF1F6D] bg-[#FFF1F2] text-[#FF1F6D] font-bold'>1</button>
                  <button className='px-1.5 py-1 rounded border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 font-bold'>&gt;</button>
                </div>
              </div>
            </div>

            {/* Apply to more products card */}
            <div className='rounded-2xl border border-[#EDE9FE] bg-white p-4 flex items-center justify-between gap-3 shadow-sm'>
              <div className='flex items-center gap-3.5 min-w-0'>
                <div className='w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7F56D9] flex items-center justify-center shadow-xs shrink-0'>
                  <Link size={16} />
                </div>
                <div className='min-w-0'>
                  <h4 className='m-0 text-sm font-extrabold text-[#11182E] leading-tight'>Apply to more products</h4>
                  <p className='m-0 mt-0.5 text-xs text-[#667085] leading-snug truncate'>Link this modifier group to additional products.</p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setIsLinkProductsPopupOpen(true)}
                className='shrink-0 px-3.5 py-2 bg-[#FF1F6D] hover:bg-[#e0155b] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer'
              >
                Link Product
              </button>
            </div>

            {/* Information Banner */}
            <div className='rounded-2xl bg-[#F5F3FF] border border-[#EDE9FE] p-3.5 flex gap-3 text-xs text-[#6956E8] font-semibold leading-relaxed shadow-xs'>
              <div className='w-5 h-5 rounded-full bg-white text-[#6956E8] flex items-center justify-center shadow-xs shrink-0 mt-0.5'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' strokeWidth='3' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>This modifier group is available on all linked products across selected outlets.</span>
            </div>
          </div>
        )}
      </div>
    </aside>
    {isEditPopupOpen && (
      <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4' onClick={() => setIsEditPopupOpen(false)}>
        <div className='w-full max-w-[560px] overflow-hidden rounded-3xl bg-white shadow-2xl' onClick={(event) => event.stopPropagation()}>
          <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
            <div>
              <p className='m-0 text-[11px] font-black uppercase tracking-wider text-[#FF1F6D]'>Modifier Group</p>
              <h3 className='m-0 mt-1 text-xl font-black text-[#11182E]'>Edit Basic Information</h3>
            </div>
            <button type='button' onClick={() => setIsEditPopupOpen(false)} className='grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50'>
              <X size={16} />
            </button>
          </div>
          <div className='grid gap-4 px-5 py-5'>
            <label className='grid gap-1.5'>
              <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Group Name</span>
              <input value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <label className='grid gap-1.5'>
                <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Type</span>
                <select value={editForm.type} onChange={(e) => setEditForm((current) => ({ ...current, type: e.target.value }))} className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]'>
                  <option>Optional</option>
                  <option>Required</option>
                </select>
              </label>
              <label className='grid gap-1.5'>
                <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Selection Rule</span>
                <select value={editForm.selectionRule} onChange={(e) => setEditForm((current) => ({ ...current, selectionRule: e.target.value, maxSelection: e.target.value.includes('Multi') ? current.maxSelection || 2 : 1 }))} className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]'>
                  <option>Single-select</option>
                  <option>Multi-select (max 2)</option>
                  <option>Multi-select (max 3)</option>
                </select>
              </label>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <label className='grid gap-1.5'>
                <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Min</span>
                <input type='number' min='0' value={editForm.minSelection} onChange={(e) => setEditForm((current) => ({ ...current, minSelection: e.target.value }))} className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
              </label>
              <label className='grid gap-1.5'>
                <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Max</span>
                <input type='number' min='0' value={editForm.maxSelection} onChange={(e) => setEditForm((current) => ({ ...current, maxSelection: e.target.value }))} className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
              </label>
              <label className='grid gap-1.5'>
                <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Outlet Scope</span>
                <input value={editForm.outletScope} onChange={(e) => setEditForm((current) => ({ ...current, outletScope: e.target.value }))} className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
              </label>
            </div>
            <label className='grid gap-1.5'>
              <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Description</span>
              <textarea value={editForm.description} onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))} rows={3} className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#FF1F6D]' />
            </label>
            <label className='grid gap-1.5'>
              <span className='text-xs font-black uppercase tracking-wider text-slate-400'>Tags</span>
              <input value={editForm.tags} onChange={(e) => setEditForm((current) => ({ ...current, tags: e.target.value }))} placeholder='Sweetness, Default' className='h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
            </label>
          </div>
          <div className='flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4'>
            <button type='button' onClick={() => setIsEditPopupOpen(false)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600'>Cancel</button>
            <button type='button' onClick={saveEditForm} className='rounded-xl bg-[#FF1F6D] px-4 py-2 text-sm font-black text-white shadow-lg shadow-pink-100'>Save Changes</button>
          </div>
        </div>
      </div>
    )}
    {isOptionsPopupOpen && (
      <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4' onClick={() => setIsOptionsPopupOpen(false)}>
        <div className='w-full max-w-[560px] overflow-hidden rounded-3xl bg-white shadow-2xl' onClick={(event) => event.stopPropagation()}>
          <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
            <div>
              <p className='m-0 text-[11px] font-black uppercase tracking-wider text-[#FF1F6D]'>Modifier Options</p>
              <h3 className='m-0 mt-1 text-xl font-black text-[#11182E]'>Manage {modifier.name}</h3>
            </div>
            <button type='button' onClick={() => setIsOptionsPopupOpen(false)} className='grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50'>
              <X size={16} />
            </button>
          </div>
          <div className='space-y-3 px-5 py-5'>
            {optionsDraft.map((option, index) => (
              <div key={option.id || index} className='grid grid-cols-[1fr_120px_36px] gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3'>
                <input value={option.name} onChange={(e) => setOptionsDraft((current) => current.map((item, idx) => idx === index ? { ...item, name: e.target.value } : item))} className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
                <input type='number' value={option.price} onChange={(e) => setOptionsDraft((current) => current.map((item, idx) => idx === index ? { ...item, price: e.target.value } : item))} className='h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#FF1F6D]' />
                <button type='button' onClick={() => setOptionsDraft((current) => current.filter((_, idx) => idx !== index))} className='grid h-10 w-10 place-items-center rounded-xl border border-rose-100 bg-white text-rose-500 hover:bg-rose-50'>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type='button' onClick={() => setOptionsDraft((current) => [...current, { id: `new-${Date.now()}`, name: '', price: 0 }])} className='w-full rounded-2xl border border-dashed border-[#FFB3CF] bg-[#FFF7FA] px-4 py-3 text-sm font-black text-[#FF1F6D]'>+ Add Option</button>
          </div>
          <div className='flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4'>
            <button type='button' onClick={() => setIsOptionsPopupOpen(false)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600'>Cancel</button>
            <button type='button' onClick={saveOptionsDraft} className='rounded-xl bg-[#FF1F6D] px-4 py-2 text-sm font-black text-white shadow-lg shadow-pink-100'>Save Options</button>
          </div>
        </div>
      </div>
    )}
    {isLinkProductsPopupOpen && (
      <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4' onClick={() => setIsLinkProductsPopupOpen(false)}>
        <div className='w-full max-w-[640px] overflow-hidden rounded-3xl bg-white shadow-2xl' onClick={(event) => event.stopPropagation()}>
          <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
            <div>
              <p className='m-0 text-[11px] font-black uppercase tracking-wider text-[#FF1F6D]'>Linked Products</p>
              <h3 className='m-0 mt-1 text-xl font-black text-[#11182E]'>Link products to {modifier.name}</h3>
              <p className='m-0 mt-1 text-xs font-semibold text-slate-500'>{selectedLinkProductIds.length} product selected</p>
            </div>
            <button type='button' onClick={() => setIsLinkProductsPopupOpen(false)} className='grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50'>
              <X size={16} />
            </button>
          </div>

          <div className='border-b border-slate-100 px-5 py-4'>
            <label className='relative block'>
              <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
              <input
                value={linkProductSearch}
                onChange={(event) => setLinkProductSearch(event.target.value)}
                placeholder='Search product name, SKU, or category...'
                className='h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#FF1F6D]'
              />
            </label>
          </div>

          <div className='max-h-[420px] overflow-y-auto px-5 py-4'>
            {linkProductCandidates.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-bold text-slate-400'>No products found.</div>
            ) : (
              <div className='space-y-2.5'>
                {linkProductCandidates.map((product) => {
                  const checked = selectedLinkProductIds.includes(product.id)
                  return (
                    <button
                      key={product.id}
                      type='button'
                      onClick={() => setSelectedLinkProductIds((current) => checked ? current.filter((id) => id !== product.id) : [...current, product.id])}
                      className={cx(
                        'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
                        checked ? 'border-[#FFB3CF] bg-[#FFF7FA]' : 'border-slate-100 bg-white hover:bg-slate-50'
                      )}
                    >
                      <div className={cx(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-black',
                        checked ? 'border-[#FF1F6D] bg-[#FF1F6D] text-white' : 'border-slate-300 bg-white text-transparent'
                      )}>
                        ✓
                      </div>
                      <ProductImage src={product.image} name={product.name} className='h-11 w-11 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1' />
                      <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='truncate text-sm font-black text-[#11182E]'>{product.name}</span>
                          <span className='rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500'>{product.category}</span>
                        </div>
                        <div className='mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400'>
                          <span>{product.sku}</span>
                          <span>•</span>
                          <span>{money(product.price)}</span>
                          <span>•</span>
                          <span>{product.status}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4'>
            <button type='button' onClick={() => setSelectedLinkProductIds([])} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600'>Clear</button>
            <div className='flex gap-2'>
              <button type='button' onClick={() => setIsLinkProductsPopupOpen(false)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600'>Cancel</button>
              <button type='button' onClick={saveLinkedProducts} className='rounded-xl bg-[#FF1F6D] px-4 py-2 text-sm font-black text-white shadow-lg shadow-pink-100'>Link {selectedLinkProductIds.length} Product</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
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

let demoProductsList = null

export default function ProductsPage() {
  const [mainTab, setMainTab] = useState('products')
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

  // Modifiers states
  const [modifiers, setModifiers] = useState([])
  const [selectedModifier, setSelectedModifier] = useState(null)
  const [isModifierDetailOpen, setIsModifierDetailOpen] = useState(false)
  const [activeModifierDetailTab, setActiveModifierDetailTab] = useState('Overview')
  const [isAddModifierGroupOpen, setIsAddModifierGroupOpen] = useState(false)

  // Add Modifier Group Wizard states
  const [addModifierStep, setAddModifierStep] = useState(1)
  const [newModifierType, setNewModifierType] = useState('Single Choice')
  const [newModifierName, setNewModifierName] = useState('')
  const [newModifierDesc, setNewModifierDesc] = useState('')
  const [newModifierMaxOptions, setNewModifierMaxOptions] = useState('1')
  const [newModifierOutletScope, setNewModifierOutletScope] = useState('All Outlets')

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null)

  // Modifiers filters states
  const [modifierSearch, setModifierSearch] = useState('')
  const [modifierOutletFilter, setModifierOutletFilter] = useState('All Outlets')
  const [modifierTypeFilter, setModifierTypeFilter] = useState('All Types')
  const [modifierStatusFilter, setModifierStatusFilter] = useState('All Status')
  const [modifierRuleFilter, setModifierRuleFilter] = useState('Selection Rule')
  const [modifierSortBy, setModifierSortBy] = useState('Newest First')

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Filtered and sorted modifier groups
  const filteredModifiers = useMemo(() => {
    return modifiers.filter((mod) => {
      if (modifierSearch) {
        const query = modifierSearch.toLowerCase()
        const matchName = mod.name.toLowerCase().includes(query)
        const matchCode = (mod.code || '').toLowerCase().includes(query)
        const matchOptions = mod.options.some(opt => (opt.name || opt).toLowerCase().includes(query))
        if (!matchName && !matchCode && !matchOptions) return false
      }
      if (modifierTypeFilter !== 'All Types') {
        if (mod.type !== modifierTypeFilter) return false
      }
      if (modifierStatusFilter !== 'All Status') {
        if (mod.status !== modifierStatusFilter) return false
      }
      if (modifierRuleFilter !== 'Selection Rule') {
        if (modifierRuleFilter === 'Single-select') {
          if (!mod.selectionRule.toLowerCase().includes('single')) return false
        } else if (modifierRuleFilter === 'Multi-select') {
          if (!mod.selectionRule.toLowerCase().includes('multi')) return false
        }
      }
      return true
    }).sort((a, b) => {
      if (modifierSortBy === 'Newest First') {
        return String(b.updatedAt || b.id).localeCompare(String(a.updatedAt || a.id))
      }
      if (modifierSortBy === 'Oldest First') {
        return String(a.updatedAt || a.id).localeCompare(String(b.updatedAt || b.id))
      }
      return 0
    })
  }, [modifiers, modifierSearch, modifierTypeFilter, modifierStatusFilter, modifierRuleFilter, modifierSortBy])

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // More Filters Drawer State
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  const [filterMinPrice, setFilterMinPrice] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState('')
  const [filterMinSales, setFilterMinSales] = useState('')
  const [filterMaxSales, setFilterMaxSales] = useState('')
  const [filterStockCondition, setFilterStockCondition] = useState([]) // 'low', 'out', 'in'
  const [filterOutletsList, setFilterOutletsList] = useState([])
  const [filterCategoriesList, setFilterCategoriesList] = useState([])
  const [filterStatusList, setFilterStatusList] = useState([])
  const [filterTagsList, setFilterTagsList] = useState([])
  const [filterUpdatedDate, setFilterUpdatedDate] = useState('Anytime')
  const [filterCreatedDate, setFilterCreatedDate] = useState('Anytime')

  const countActiveMoreFilters = () => {
    let count = 0
    if (filterMinPrice || filterMaxPrice) count++
    if (filterMinSales || filterMaxSales) count++
    if (filterStockCondition.length > 0 && filterStockCondition.length < 3) count++
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
  const [productActivities, setProductActivities] = useState([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activityTypeFilter, setActivityTypeFilter] = useState('all')
  const [activitiesLimit, setActivitiesLimit] = useState(10)
  const [totalActivities, setTotalActivities] = useState(0)
  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importProductsList, setImportProductsList] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatusText, setImportStatusText] = useState('')
  const [importErrors, setImportErrors] = useState([])
  const [outletInventory, setOutletInventory] = useState([])
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false)
  const [adjustStockOutlet, setAdjustStockOutlet] = useState('')
  const [adjustStockType, setAdjustStockType] = useState('add') // 'add' | 'remove'
  const [adjustStockQuantity, setAdjustStockQuantity] = useState('10')
  const [adjustStockReasonSelect, setAdjustStockReasonSelect] = useState('Stock received')
  const [adjustStockReasonText, setAdjustStockReasonText] = useState('Received from supplier.')
  const [backupAssignmentRows, setBackupAssignmentRows] = useState([])
  const [assignSearchQuery, setAssignSearchQuery] = useState('')
  const [bulkAvailability, setBulkAvailability] = useState(true)
  const [bulkUseDefaultPrice, setBulkUseDefaultPrice] = useState(true)
  const [bulkVisibility, setBulkVisibility] = useState('Show')

  const inventoryAdjustmentReasonByLabel = {
    'Stock received': 'adjustment',
    'Damaged goods': 'adjustment',
    'Inventory count correction': 'adjustment',
    'Expired product': 'adjustment',
    'Lost / Theft': 'adjustment',
    'Customer return': 'return',
  }

  const loadProductAvailabilityAndInventory = async (product, currentOutlets = outlets) => {
    if (!product) return

    try {
      if (isDemoMode()) {
        let inventoryList = []
        if (product.sku === 'SKU-SEL-001' || product.id === 1) {
          inventoryList = [
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
          const totalStock = product.stock || 0
          const count = defaultNames.length
          let remaining = totalStock
          inventoryList = defaultNames.map((name, idx) => {
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
        setOutletInventory(inventoryList)

        const initialOutlets = [
          { outletId: 'Senayan', outletName: 'Kalis Cafe - Senayan', isAvailable: true, price: product.price, isOverride: false, visibility: 'Show' },
          { outletId: 'Kemang', outletName: 'Kalis Cafe - Kemang', isAvailable: true, price: product.price + 500, isOverride: true, visibility: 'Show' },
          { outletId: 'KelapaGading', outletName: 'Kalis Cafe - Kelapa Gading', isAvailable: false, price: product.price, isOverride: false, visibility: 'Hide' },
          { outletId: 'Bandung', outletName: 'Kalis Cafe - Bandung', isAvailable: true, price: product.price, isOverride: false, visibility: 'Show' },
          { outletId: 'Surabaya', outletName: 'Kalis Cafe - Surabaya', isAvailable: true, price: product.price - 500, isOverride: true, visibility: 'Show' },
          { outletId: 'Bali', outletName: 'Kalis Cafe - Bali', isAvailable: false, price: product.price, isOverride: false, visibility: 'Show' },
          { outletId: 'Medan', outletName: 'Kalis Cafe - Medan', isAvailable: false, price: product.price, isOverride: false, visibility: 'Show' },
        ]
        setOutletAssignmentRows(initialOutlets)
      } else {
        const res = await api.get(`/products/${product.id}/outlet-availability`)
        const data = res.data?.data || []
        
        const availabilityRows = currentOutlets.map((o) => {
          const match = data.find(
            (item) => item.outletId === o.id || item.outlet_id === o.id
          )
          
          const priceVal = match && match.priceOverride !== null && match.priceOverride !== undefined
            ? match.priceOverride
            : (match && match.price !== undefined ? match.price : product.price)

          const stockQuantityVal = match && match.stockQuantity !== null && match.stockQuantity !== undefined
            ? match.stockQuantity
            : (match && match.stock_quantity !== undefined ? match.stock_quantity : product.stock)

          return {
            outletId: o.id,
            outletName: o.name,
            isAvailable: match ? !!match.isAvailable : true,
            price: priceVal,
            stockQuantity: stockQuantityVal,
            isOverride: match ? (match.priceOverride !== null && match.priceOverride !== undefined && match.priceOverride !== product.price) : false,
            visibility: match && match.status === 'inactive' ? 'Hide' : 'Show',
          }
        })
        setOutletAssignmentRows(availabilityRows)

        const inventoryStockByOutlet = new Map()
        await Promise.all(currentOutlets.map(async (o) => {
          try {
            const stockRes = await api.get(`/api/inventory/${product.id}`, {
              params: { outletId: o.id },
            })
            const stockItem = stockRes.data?.data
            if (stockItem) {
              inventoryStockByOutlet.set(String(o.id), {
                quantity: Number(stockItem.quantity ?? stockItem.stockQuantity ?? 0),
                lowStockThreshold: Number(stockItem.lowStockThreshold ?? product.lowStockAlert ?? 10),
                updatedAt: stockItem.updatedAt,
              })
            }
          } catch (err) {
            console.warn('Failed to load inventory stock for outlet:', o.id, err)
          }
        }))

        const inventoryRows = currentOutlets.map((o) => {
          const match = data.find(
            (item) => item.outletId === o.id || item.outlet_id === o.id
          )
          const stockItem = inventoryStockByOutlet.get(String(o.id))
          const avail = stockItem
            ? stockItem.quantity
            : match && match.stockQuantity !== null && match.stockQuantity !== undefined
            ? match.stockQuantity
            : (match && match.stock_quantity !== undefined ? match.stock_quantity : 0)

          const lastUpdatedAt = stockItem?.updatedAt || match?.updatedAt
          const lastUpdatedStr = lastUpdatedAt 
            ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—'

          return {
            outletId: o.id,
            outlet: o.name,
            available: avail,
            reserved: 0,
            threshold: stockItem?.lowStockThreshold || product.lowStockAlert || 10,
            updated: lastUpdatedAt ? `Today, ${lastUpdatedStr}` : '—'
          }
        })
        setOutletInventory(inventoryRows)
      }
    } catch (err) {
      console.error('Failed to load product availability and inventory:', err)
    }
  }

  const loadProductActivities = async (product, limit = activitiesLimit) => {
    if (!product || isDemoMode()) {
      setProductActivities([])
      return
    }

    setIsLoadingActivities(true)
    try {
      const res = await api.get('/audit/logs', {
        params: {
          resourceType: 'product',
          resourceId: product.id,
          limit: limit,
        }
      })
      const list = res.data?.data || []
      setProductActivities(list)
      setTotalActivities(res.data?.meta?.total || list.length)
    } catch (err) {
      console.error('Failed to load product activities:', err)
      setProductActivities([])
    } finally {
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    setActivitiesLimit(10)
    loadProductAvailabilityAndInventory(selectedProduct, outlets)
    loadProductActivities(selectedProduct, 10)
  }, [selectedProduct, outlets])

  const handleConfirmAdjustStock = async () => {
    const qty = Number(adjustStockQuantity) || 0
    if (!qty || qty <= 0) {
      alert('Quantity must be greater than 0.')
      return
    }

    const targetOutletRow = outletAssignmentRows.find(
      (r) => r.outletName === adjustStockOutlet || r.outletId === adjustStockOutlet
    )
    
    const outletId = targetOutletRow ? targetOutletRow.outletId : adjustStockOutlet
    const currentStock = targetOutletRow ? targetOutletRow.stockQuantity : 0
    const diff = adjustStockType === 'add' ? qty : -qty
    const newStock = Math.max(0, currentStock + diff)

    try {
      if (isDemoMode()) {
        const updated = outletInventory.map((item) => {
          if (item.outlet === adjustStockOutlet) {
            return {
              ...item,
              available: newStock,
              updated: 'Just now',
            }
          }
          return item
        })
        setOutletInventory(updated)
        
        const newTotal = updated.reduce((sum, item) => sum + item.available, 0)
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id) ? {
            ...p,
            stock: newTotal,
            stockState: newTotal > 10 ? 'In Stock' : (newTotal > 0 ? 'Low Stock' : 'Out of Stock'),
          } : p)
        )

        if (!demoProductsList) {
          demoProductsList = dummyProducts.map(p => ({ ...p }))
        }
        demoProductsList = demoProductsList.map((p) => (p.id === selectedProduct.id || p._id === selectedProduct.id) ? {
          ...p,
          stock: newTotal,
          stockState: newTotal > 10 ? 'In Stock' : (newTotal > 0 ? 'Low Stock' : 'Out of Stock'),
        } : p)

        setSelectedProduct((prev) => ({
          ...prev,
          stock: newTotal,
          stockState: newTotal > 10 ? 'In Stock' : (newTotal > 0 ? 'Low Stock' : 'Out of Stock'),
          inventorySummary: {
            total: newTotal,
            lowStock: updated.filter((item) => item.available > 0 && item.available <= item.threshold).length,
            outOfStock: updated.filter((item) => item.available === 0).length,
          },
        }))
      } else {
        const adjustRes = await api.post(`/api/inventory/${selectedProduct.id}/adjust`, {
          outletId,
          delta: diff,
          reason: inventoryAdjustmentReasonByLabel[adjustStockReasonSelect] || 'adjustment',
          notes: [adjustStockReasonSelect, adjustStockReasonText].filter(Boolean).join(': '),
        })
        const adjustedQuantity = Number(adjustRes.data?.data?.quantity ?? newStock)
        const updateInventoryRows = (rows) => rows.map((item) => {
          const isTargetOutlet = String(item.outletId || item.outlet) === String(outletId)
            || String(item.outlet) === String(adjustStockOutlet)
          return isTargetOutlet
            ? { ...item, available: adjustedQuantity, updated: 'Just now' }
            : item
        })
        setOutletInventory((prev) => updateInventoryRows(prev))
        setOutletAssignmentRows((prev) => prev.map((row) => (
          String(row.outletId) === String(outletId)
            ? { ...row, stockQuantity: adjustedQuantity }
            : row
        )))

        await loadProducts()
        await loadProductAvailabilityAndInventory(selectedProduct, outlets)
        await loadProductActivities(selectedProduct)
      }

      setIsAdjustStockOpen(false)
      alert('Stock adjusted successfully!')
    } catch (err) {
      console.error('Failed to adjust stock:', err)
      alert('Failed to adjust stock. Please try again.')
    }
  }

  const handleToggleOutletAvailability = async (idx, val) => {
    const targetRow = outletAssignmentRows[idx]
    if (!targetRow) return

    setOutletAssignmentRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, isAvailable: val } : r))
    )

    try {
      if (!isDemoMode()) {
        await api.put(`/products/${selectedProduct.id}/outlet-availability`, {
          outlets: [
            {
              outletId: targetRow.outletId,
              isAvailable: val,
              priceOverride: targetRow.isOverride ? Number(targetRow.price) : null,
              stockQuantity: Number(targetRow.stockQuantity),
            }
          ]
        })
        await loadProducts()
        await loadProductAvailabilityAndInventory(selectedProduct, outlets)
        await loadProductActivities(selectedProduct)
      }
    } catch (err) {
      console.error('Failed to toggle outlet availability:', err)
      setOutletAssignmentRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, isAvailable: !val } : r))
      )
      alert('Failed to save outlet availability update.')
    }
  }

  const handleOutletVisibilityChange = async (idx, val) => {
    const targetRow = outletAssignmentRows[idx]
    if (!targetRow) return

    setOutletAssignmentRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, visibility: val } : r))
    )

    try {
      if (!isDemoMode()) {
        await api.put(`/products/${selectedProduct.id}/outlet-availability`, {
          outlets: [
            {
              outletId: targetRow.outletId,
              isAvailable: targetRow.isAvailable,
              priceOverride: targetRow.isOverride ? Number(targetRow.price) : null,
              stockQuantity: Number(targetRow.stockQuantity),
              status: val === 'Hide' ? 'inactive' : 'active',
            }
          ]
        })
        await loadProducts()
        await loadProductAvailabilityAndInventory(selectedProduct, outlets)
        await loadProductActivities(selectedProduct)
      }
    } catch (err) {
      console.error('Failed to change outlet visibility:', err)
      setOutletAssignmentRows((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, visibility: val === 'Hide' ? 'Show' : 'Hide' } : r))
      )
      alert('Failed to save outlet visibility update.')
    }
  }

  // Add Product Drawer State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadFile = await createProductImageUpload(file)
    const localUrl = URL.createObjectURL(uploadFile)
    setPhotoPreview(localUrl)

    if (isDemoMode()) {
      return
    }

    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const res = await api.post('/products/images/upload', formData)
      const fileData = res.data && res.data.data ? res.data.data : res.data
      const fileUrl = fileData.url || `/public-files/${fileData.storedName || fileData.stored_name}`
      setPhotoPreview(fileUrl)
    } catch (err) {
      console.error('Failed to upload product image:', err)
      alert('Failed to upload image. Please try again.')
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const [addName, setAddName] = useState('')
  const [addSku, setAddSku] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [productCategories, setProductCategories] = useState(['Minuman', 'Makanan', 'Signature'])
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [addPrice, setAddPrice] = useState('')
  const [addCost, setAddCost] = useState('')
  const [addTax, setAddTax] = useState('No Tax')
  const [addTags, setAddTags] = useState('')
  const [addStatus, setAddStatus] = useState('Active')
  const [addAvailability, setAddAvailability] = useState('Always available')
  const [addTrackStock, setAddTrackStock] = useState(true)
  const [addInitialStock, setAddInitialStock] = useState('')
  const [addLowStockAlert, setAddLowStockAlert] = useState('10')
  const [addSelectedOutlets, setAddSelectedOutlets] = useState([])
  const [outletSearchQuery, setOutletSearchQuery] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)

  useEffect(() => {
    if (isAddProductOpen && outlets.length > 0 && !isEditMode) {
      setAddSelectedOutlets(outlets.map(o => o.id))
    }
  }, [isAddProductOpen, outlets, isEditMode])

  const addProductCategory = () => {
    const normalized = newCategoryName.trim()
    if (!normalized) return
    setProductCategories((current) => current.some((item) => item.toLowerCase() === normalized.toLowerCase()) ? current : [...current, normalized])
    setAddCategory(normalized)
    setNewCategoryName('')
  }

  const removeProductCategory = (category) => {
    setProductCategories((current) => current.filter((item) => item !== category))
    if (addCategory === category) setAddCategory('')
  }

  const handleOpenAddProduct = () => {
    setIsEditMode(false)
    setEditingProductId(null)
    setAddName('')
    setAddSku('')
    setAddCategory('')
    setAddDescription('')
    setAddPrice('')
    setAddCost('')
    setAddTax('No Tax')
    setAddTags('')
    setAddStatus('Active')
    setAddAvailability('Always available')
    setAddTrackStock(true)
    setAddInitialStock('')
    setPhotoPreview(null)
    setAddSelectedOutlets(outlets.map(o => o.id))
    setIsAddProductOpen(true)
  }

  const handleEditProduct = (product) => {
    setIsEditMode(true)
    setEditingProductId(product.id || product._id)
    setAddName(product.name || '')
    setAddSku(product.sku || '')
    setAddCategory(product.category || '')
    setAddDescription(product.description || '')
    setAddPrice(product.price || '')
    setAddCost(product.cost || '')
    setAddTax(product.tax || 'No Tax')
    setAddTags(Array.isArray(product.tags) ? product.tags.join(', ') : '')
    setAddStatus(product.status || 'Active')
    setAddAvailability(product.metadata?.availability || 'Always available')
    setAddTrackStock(product.stockTracking ?? true)
    setAddInitialStock(product.stock || '')
    setPhotoPreview(product.image || null)
    
    // Extract assigned outlets if exists
    let selectedOutlets = []
    if (Array.isArray(product.metadata?.outlets)) {
      selectedOutlets = product.metadata.outlets
    } else if (product.metadata?.outlets) {
      selectedOutlets = [product.metadata.outlets]
    } else if (product.outlets) {
      selectedOutlets = outlets.slice(0, Number(product.outlets) || 1).map(o => o.id)
    } else {
      selectedOutlets = outlets.map(o => o.id)
    }
    setAddSelectedOutlets(selectedOutlets)
    setIsAddProductOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!addName.trim()) {
      alert('Product Name is required')
      return
    }

    try {
      const payload = {
        name: addName,
        sku: addSku || `SKU-SEL-00${products.length + 1}`,
        basePrice: Number(addPrice) || 0,
        costPrice: Number(addCost) || 0,
        stockTracking: addTrackStock,
        stockQuantity: Number(addInitialStock) || 0,
        isActive: addStatus === 'Active',
        status: addStatus === 'Active' ? 'active' : 'inactive',
        description: addDescription,
        thumbnailUrl: photoPreview || '',
        tags: addTags ? addTags.split(',').map(t => t.trim()) : [],
        metadata: {
          category: addCategory || 'Signature',
          tax: addTax,
          availability: addAvailability,
          outlets: addSelectedOutlets,
        }
      }

      if (!isDemoMode()) {
        if (isEditMode) {
          await api.put(`/products/${editingProductId}`, payload)
        } else {
          await api.post('/products', payload)
        }
      } else {
        // Mock save product in demo mode
        if (isEditMode) {
          const updatedFields = {
            name: addName,
            sku: addSku,
            category: addCategory,
            price: Number(addPrice) || 0,
            cost: Number(addCost) || 0,
            stock: Number(addInitialStock) || 0,
            stockState: (Number(addInitialStock) || 0) > 10 ? 'In Stock' : ((Number(addInitialStock) || 0) > 0 ? 'Low Stock' : 'Out of Stock'),
            status: addStatus,
            description: addDescription,
            tags: addTags ? addTags.split(',').map(t => t.trim()) : [],
            tax: addTax,
            outlets: addSelectedOutlets.length,
          }

          setProducts(prev => prev.map(p => (p.id === editingProductId || p._id === editingProductId) ? {
            ...p,
            ...updatedFields,
            image: photoPreview || p.image,
            sku: addSku || p.sku,
            category: addCategory || p.category,
          } : p))

          if (!demoProductsList) {
            demoProductsList = dummyProducts.map(p => ({ ...p }))
          }
          demoProductsList = demoProductsList.map(p => (p.id === editingProductId || p._id === editingProductId) ? {
            ...p,
            ...updatedFields,
            image: photoPreview || p.image,
            sku: addSku || p.sku,
            category: addCategory || p.category,
          } : p)

          setSelectedProduct(prev => {
            if (prev && (prev.id === editingProductId || prev._id === editingProductId)) {
              return {
                ...prev,
                ...updatedFields,
                image: photoPreview || prev.image,
                sku: addSku || prev.sku,
                category: addCategory || prev.category,
              }
            }
            return prev
          })
        } else {
          const mockNewProduct = {
            id: products.length + 1,
            _id: String(products.length + 1),
            name: addName,
            sku: addSku || `SKU-SEL-00${products.length + 1}`,
            image: photoPreview || '/images/products/salty-caramel.png',
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
          if (!demoProductsList) {
            demoProductsList = dummyProducts.map(p => ({ ...p }))
          }
          demoProductsList = [mockNewProduct, ...demoProductsList]
        }
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
      setPhotoPreview(null)
      setIsAddProductOpen(false)
      setIsEditMode(false)
      setEditingProductId(null)
      alert(isEditMode ? `Product updated successfully!` : `Product "${payload.name}" added successfully!`)
      loadProducts()
    } catch (err) {
      console.error("Failed to save product:", err)
      const errorMsg = err.response?.data?.error?.message || err.message || 'Unknown error'
      alert("Failed to save product: " + errorMsg)
    }
  }

  const handleUpdateProduct = async (productId, updates) => {
    try {
      if (isDemoMode()) {
        // Mock update in demo mode
        setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, ...updates } : p))
        setSelectedProduct(prev => (prev && (prev.id === productId || prev._id === productId)) ? { ...prev, ...updates } : prev)
      } else {
        const res = await api.put(`/products/${productId}`, updates)
        const updatedRaw = res.data && res.data.data ? res.data.data : res.data
        // Refresh products list
        await loadProducts()
        // Update selected product state
        setSelectedProduct(prev => {
          if (!prev) return null
          const basePrice = updatedRaw.basePrice ?? updatedRaw.base_price ?? updatedRaw.price ?? prev.price
          const costPrice = updatedRaw.costPrice ?? updatedRaw.cost_price ?? updatedRaw.cost ?? prev.cost
          const stockQuantity = updatedRaw.stockQuantity ?? updatedRaw.stock_quantity ?? updatedRaw.stock ?? prev.stock
          const isActive = updatedRaw.isActive ?? updatedRaw.is_active ?? (updatedRaw.status === 'active' || updatedRaw.status === 'Active' || prev.status === 'Active')
          const thumbnailUrl = resolveProductImage(updatedRaw.name ?? prev.name, updatedRaw.thumbnailUrl ?? updatedRaw.thumbnail_url ?? updatedRaw.image ?? prev.image)
          const taxLabel = updatedRaw.taxLabel ?? updatedRaw.tax_label ?? updatedRaw.tax ?? prev.tax

          return {
            ...prev,
            ...updates,
            name: updatedRaw.name ?? prev.name,
            sku: updatedRaw.sku ?? prev.sku,
            image: thumbnailUrl,
            price: basePrice,
            cost: costPrice,
            stock: stockQuantity,
            status: isActive ? 'Active' : 'Inactive',
            description: updatedRaw.description ?? prev.description,
            tags: updatedRaw.tags ?? prev.tags,
            tax: taxLabel,
          }
        })
      }
    } catch (err) {
      console.error("Failed to update product:", err)
      const errorMsg = err.response?.data?.error?.message || err.message || 'Unknown error'
      alert("Failed to update product: " + errorMsg)
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
    loadModifiers()
    loadOutlets()
  }, [])

  const findProductForOrderItem = (itemName, productsList) => {
    const cleanItem = itemName.toLowerCase().trim()
    for (const p of productsList) {
      const cleanProd = p.name.toLowerCase().trim()
      if (cleanItem === cleanProd || cleanProd.includes(cleanItem) || cleanItem.includes(cleanProd)) {
        return p
      }
    }
    // Hardcoded mappings for variations in mocks
    if (cleanItem.includes('sally') || cleanItem.includes('caramel')) {
      return productsList.find(p => p.sku === 'SKU-SEL-001' || p.name.toLowerCase().includes('caramel'))
    }
    if (cleanItem.includes('aren') || cleanItem.includes('gula')) {
      return productsList.find(p => p.sku === 'SKU-SEL-002' || p.name.toLowerCase().includes('aren'))
    }
    if (cleanItem.includes('lemon') || cleanItem.includes('es teh')) {
      return productsList.find(p => p.sku === 'SKU-SEL-004' || p.name.toLowerCase().includes('lemon'))
    }
    if (cleanItem.includes('thai') || cleanItem.includes('teh')) {
      return productsList.find(p => p.sku === 'SKU-SEL-006' || p.name.toLowerCase().includes('thai') || p.name.toLowerCase().includes('teh'))
    }
    return null
  }

  const fetchAndNormalizeOrders = async () => {
    if (isDemoMode()) {
      const mockList = [
        {
          _id: 'order-1028',
          status: 'preparing',
          outlet: 'Samarinda',
          itemsList: [
            { name: 'Sally Caramel', qty: 1, price: 26000 },
            { name: 'Kopi Susu Gula Aren', qty: 1, price: 14000 },
          ],
          total: 38000,
          paymentStatus: 'Paid',
          createdAt: '2025-05-16T10:21:00Z',
        },
        {
          _id: 'order-1027',
          status: 'new',
          outlet: 'Tenggarong',
          itemsList: [
            { name: 'Es Teh Lemon', qty: 2, price: 15000 },
            { name: 'Kopi Susu Gula Aren', qty: 1, price: 22000 },
          ],
          total: 52000,
          paymentStatus: 'Paid',
          createdAt: '2025-05-16T10:19:00Z',
        },
        {
          _id: 'order-1026',
          status: 'ready',
          outlet: 'Bontang',
          itemsList: [
            { name: 'Sally Caramel', qty: 1, price: 24000 },
          ],
          total: 24000,
          paymentStatus: 'Unpaid',
          createdAt: '2025-05-16T10:12:00Z',
        },
        {
          _id: 'order-1025',
          status: 'preparing',
          outlet: 'Samarinda',
          itemsList: [
            { name: 'Es Teh Lemon', qty: 2, price: 15000 },
            { name: 'Sally Caramel', qty: 2, price: 23000 },
          ],
          total: 76000,
          paymentStatus: 'Paid',
          createdAt: '2025-05-16T10:08:00Z',
        },
        {
          _id: 'order-1024',
          status: 'completed',
          outlet: 'Balikpapan',
          itemsList: [
            { name: 'Es Teh Lemon', qty: 1, price: 15000 },
            { name: 'Kopi Susu Gula Aren', qty: 1, price: 16000 },
          ],
          total: 31000,
          paymentStatus: 'Paid',
          createdAt: '2025-05-16T09:58:00Z',
        },
        {
          _id: 'order-1023',
          status: 'completed',
          outlet: 'Tenggarong',
          itemsList: [
            { name: 'Kopi Susu Gula Aren', qty: 1, price: 18000 },
          ],
          total: 18000,
          paymentStatus: 'Paid',
          createdAt: '2025-05-16T09:45:00Z',
        },
        {
          _id: 'order-1022',
          status: 'cancelled',
          outlet: 'Bontang',
          itemsList: [
            { name: 'Es Teh', qty: 2, price: 12000 },
            { name: 'Lemon Tea', qty: 1, price: 5000 },
          ],
          total: 29000,
          paymentStatus: 'Unpaid',
          createdAt: '2025-05-16T09:32:00Z',
        },
      ]
      return mockList
    }

    try {
      const res = await api.get('/orders', { params: getOrderQueryParams(getSessionUser()) })
      const rawOrders = Array.isArray(res.data)
        ? res.data
        : res.data && Array.isArray(res.data.data)
          ? res.data.data
          : []

      const normalizedOrders = rawOrders.map((order) => ({
        ...order,
        _id: order._id || order.id,
        id: order.id || order._id,
      }))

      // Fetch agents
      const agentIds = [
        ...new Set(normalizedOrders.map((o) => o.agentId).filter(Boolean)),
      ]
      const agentMap = {}
      for (const agentId of agentIds) {
        try {
          const agentRes = await api.get(`/agents/${agentId}`)
          agentMap[agentId] = agentRes.data
        } catch (err) {
          console.error('Failed to load agent:', agentId)
        }
      }

      // Map to standard shape
      const mappedOrders = normalizedOrders.map((order) => {
        const agent = agentMap[order.agentId]
        
        let priceInfo = null
        if (agent && agent.salesForms) {
          const salesForm = agent.salesForms.find((f) => f.name === order.formName)
          if (salesForm && salesForm.products && salesForm.products.length > 0) {
            const formData = order.formData || {}
            const itemNameKey = Object.keys(formData).find(
              (k) => k.toLowerCase().includes('item') && k.toLowerCase().includes('name')
            )
            const quantityKey = Object.keys(formData).find(
              (k) => k.toLowerCase() === 'quantity' || k.toLowerCase() === 'qty'
            )
            if (itemNameKey && quantityKey) {
              const itemName = formData[itemNameKey]
              const quantity = parseInt(formData[quantityKey]) || 1
              const product = salesForm.products.find(
                (p) => p.name.toLowerCase() === itemName.toLowerCase()
              )
              if (product) {
                priceInfo = {
                  itemName: product.name,
                  quantity,
                  unitPrice: product.price || 0,
                  subtotal: (product.price || 0) * quantity,
                }
              }
            }
          }
        }

        let itemsListResolved = []
        if (Array.isArray(order.items) && order.items.length > 0) {
          itemsListResolved = order.items.map((item) => ({
            name: item.name || item.productNameSnapshot || 'Item',
            qty: item.quantity || 1,
            variant: item.metadata?.variant || '',
            price: item.unitPrice || 0,
          }))
        } else if (priceInfo) {
          itemsListResolved.push({
            name: priceInfo.itemName,
            qty: priceInfo.quantity,
            variant: 'Default Variant',
            price: priceInfo.unitPrice,
          })
        } else {
          const entries = Object.entries(order.formData || {})
          const itemNameEntry = entries.find(([key]) => key.toLowerCase().includes('item') && key.toLowerCase().includes('name'))
          const qtyEntry = entries.find(([key]) => key.toLowerCase() === 'qty' || key.toLowerCase() === 'quantity')
          if (itemNameEntry) {
            itemsListResolved.push({
              name: itemNameEntry[1],
              qty: qtyEntry ? parseInt(qtyEntry[1]) || 1 : 1,
              variant: 'Standard',
              price: 15000,
            })
          }
        }

        const outletName = (order.outlet && typeof order.outlet === 'object' ? order.outlet.name : null) ||
          (order.outlet && typeof order.outlet === 'string' ? order.outlet : null) ||
          order.formData?.outlet || 'Samarinda'

        return {
          _id: order._id,
          status: order.status,
          outlet: outletName,
          itemsList: itemsListResolved,
          paymentStatus: order.paymentStatus || 'Unpaid',
          createdAt: order.createdAt,
        }
      })
      return mappedOrders
    } catch (err) {
      console.error('Failed to fetch and normalize orders:', err)
      return []
    }
  }

  const aggregateSalesData = (mappedProducts, ordersList) => {
    const now = new Date()

    return mappedProducts.map((product) => {
      const productOrdersThisMonth = []
      const productOrdersLastMonth = []
      const outletSalesMap = {}

      ordersList.forEach((order) => {
        if (order.status === 'cancelled') return

        const orderDate = new Date(order.createdAt)
        const isMockOrder = orderDate.getFullYear() === 2025 && orderDate.getMonth() === 4

        let period = null
        
        if (isMockOrder) {
          period = 'thisMonth'
        } else if (orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth()) {
          period = 'thisMonth'
        } else if (
          orderDate.getFullYear() === (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()) &&
          orderDate.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1)
        ) {
          period = 'lastMonth'
        }

        if (!period) return

        order.itemsList.forEach((item) => {
          const matchedProduct = findProductForOrderItem(item.name, mappedProducts)
          if (matchedProduct && matchedProduct.sku === product.sku) {
            const itemTotal = (item.price || product.price) * (item.qty || 1)
            const itemQty = item.qty || 1

            if (period === 'thisMonth') {
              productOrdersThisMonth.push({
                createdAt: order.createdAt,
                itemTotal,
                itemQty,
                outlet: order.outlet,
              })

              const outlet = order.outlet || 'Unknown'
              if (!outletSalesMap[outlet]) {
                outletSalesMap[outlet] = { revenue: 0, quantity: 0 }
              }
              outletSalesMap[outlet].revenue += itemTotal
              outletSalesMap[outlet].quantity += itemQty
            } else if (period === 'lastMonth') {
              productOrdersLastMonth.push({
                itemTotal,
                itemQty,
              })
            }
          }
        })
      })

      const totalSales = productOrdersThisMonth.reduce((sum, o) => sum + o.itemTotal, 0)
      const totalSold = productOrdersThisMonth.reduce((sum, o) => sum + o.itemQty, 0)
      const lastMonthSales = productOrdersLastMonth.reduce((sum, o) => sum + o.itemTotal, 0)

      let salesChange = product.salesChange || 0
      if (lastMonthSales > 0) {
        salesChange = Math.round(((totalSales - lastMonthSales) / lastMonthSales) * 100)
      } else if (totalSales > 0 && !isDemoMode()) {
        salesChange = 100
      }

      let trend = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      if (productOrdersThisMonth.length > 0) {
        productOrdersThisMonth.forEach((o) => {
          const d = new Date(o.createdAt)
          const day = d.getDate()
          const idx = Math.min(11, Math.floor((day - 1) / 31 * 12))
          trend[idx] += o.itemTotal
        })
      } else {
        const defaultTrendPattern = [0.1, 0.12, 0.15, 0.14, 0.16, 0.18, 0.17, 0.19, 0.22, 0.25, 0.28, 0.3]
        trend = defaultTrendPattern.map(val => Math.round(val * (product.price * 5)))
      }

      let bestPerformingOutlet = null
      let topOutletName = 'No Outlet'
      let topOutletRevenue = 0
      let topOutletQty = 0

      Object.entries(outletSalesMap).forEach(([name, data]) => {
        if (data.revenue > topOutletRevenue) {
          topOutletRevenue = data.revenue
          topOutletQty = data.quantity
          topOutletName = name
        }
      })

      if (topOutletRevenue > 0) {
        bestPerformingOutlet = {
          name: topOutletName,
          revenue: topOutletRevenue,
          quantity: topOutletQty,
        }
      }

      const outletContributions = Object.entries(outletSalesMap)
        .map(([name, data]) => {
          const pct = totalSales > 0 ? Math.round((data.revenue / totalSales) * 100) : 0
          return {
            name,
            amount: data.revenue,
            pct,
          }
        })
        .sort((a, b) => b.amount - a.amount)

      return {
        ...product,
        salesMonth: totalSales,
        salesChange,
        totalSold,
        trend,
        bestPerformingOutlet,
        outletContributions,
      }
    })
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      let mappedProducts = []

      if (isDemoMode()) {
        if (!demoProductsList) {
          demoProductsList = dummyProducts.map(p => ({ ...p }))
        }
        mappedProducts = demoProductsList.map(p => ({ ...p }))
      } else {
        const res = await api.get('/products')
        const rawProducts = Array.isArray(res.data)
          ? res.data
          : res.data && Array.isArray(res.data.data)
            ? res.data.data
            : []

        mappedProducts = rawProducts.map((item, idx) => {
          const basePrice = item.basePrice ?? item.base_price ?? item.price ?? 0
          const costPrice = item.costPrice ?? item.cost_price ?? item.cost ?? 0
          const stockQuantity = item.stockQuantity ?? item.stock_quantity ?? item.stock ?? 0
          const isActive = item.isActive ?? item.is_active ?? (item.status === 'active' || item.status === 'Active' || item.status === true)
          const thumbnailUrl = resolveProductImage(item.name, item.thumbnailUrl ?? item.thumbnail_url ?? item.image ?? '/images/products/salty-caramel.png')
          const taxLabel = item.taxLabel ?? item.tax_label ?? item.tax ?? item.metadata?.tax ?? 'No Tax'
          const outletCount = Number(item.outletCount ?? item.outlet_count ?? item.outlets ?? item.outletsCount ?? item.outlets_count ?? item.availabilityCount ?? item.availability_count ?? (Array.isArray(item.outletAvailability) ? item.outletAvailability.length : 0))

          return {
            id: item.id || item._id,
            _id: item.id || item._id,
            name: item.name,
            sku: item.sku || `SKU-SEL-00${idx + 1}`,
            image: thumbnailUrl,
            category: item.metadata?.category || item.category || 'Minuman',
            outlets: outletCount || 0,
            price: basePrice,
            cost: costPrice,
            stock: stockQuantity,
            stockState: stockQuantity > 10 ? 'In Stock' : (stockQuantity > 0 ? 'Low Stock' : 'Out of Stock'),
            status: isActive ? 'Active' : 'Inactive',
            salesMonth: item.salesMonth || 0,
            salesChange: item.salesChange || 0,
            totalSold: item.totalSold || 0,
            description: item.description || '',
            tags: item.tags || [],
            tax: taxLabel,
            trend: item.trend || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            inventorySummary: item.inventorySummary || {
              total: stockQuantity,
              lowStock: 0,
              outOfStock: 0,
            },
            modifierGroups: item.modifierGroups || item.modifier_groups || item.metadata?.modifierGroups || item.metadata?.modifier_groups || item.metadata?.modifiers?.map((group) => group.name).filter(Boolean) || [],
          }
        })
      }

      // Fetch and normalize orders
      const ordersList = await fetchAndNormalizeOrders()

      // Aggregate sales metrics dynamically from ordersList
      const aggregated = aggregateSalesData(mappedProducts, ordersList)
      setProducts(aggregated)
    } catch (err) {
      console.error('Failed to load products and sales data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadModifiers = async () => {
    try {
      if (isDemoMode()) {
        setModifiers(dummyModifiers)
        return
      }
      const res = await api.get('/products/modifiers')
      const rawModifiers = Array.isArray(res.data)
        ? res.data
        : res.data && Array.isArray(res.data.data)
          ? res.data.data
          : []
      setModifiers(rawModifiers)
    } catch (err) {
      console.error('Failed to load product modifiers:', err)
      setModifiers([])
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
          } else {
            if (!demoProductsList) {
              demoProductsList = dummyProducts.map(item => ({ ...item }))
            }
            demoProductsList = demoProductsList.map(item => 
              item.sku === p.sku ? { ...item, status: 'Inactive' } : item
            )
          }
        }
        alert(`Successfully archived ${productsToArchive.length} products.`)
        setSelectedSKUs([])
      } else {
        if (!isDemoMode()) {
          await api.delete(`/products/${archiveTarget.id}`)
        } else {
          if (!demoProductsList) {
            demoProductsList = dummyProducts.map(item => ({ ...item }))
          }
          demoProductsList = demoProductsList.map(item => 
            (item.id === archiveTarget.id || item._id === archiveTarget.id)
              ? { ...item, status: 'Inactive' }
              : item
          )
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

  const handleDelete = async () => {
    try {
      if (!isDemoMode()) {
        await api.delete(`/products/${deleteTarget.id}`)
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
        if (!demoProductsList) {
          demoProductsList = dummyProducts.map(item => ({ ...item }))
        }
        demoProductsList = demoProductsList.filter(p => p.id !== deleteTarget.id)
      }
      alert(`Product "${deleteTarget.name}" deleted successfully.`)
      setIsDeleteConfirmOpen(false)
      setDeleteTarget(null)
      if (!isDemoMode()) {
        loadProducts()
      }
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete product.')
    }
  }

  const handleOpenAssignOutlets = async (product) => {
    setOutletAssignmentProduct(product)
    setBackupAssignmentRows(JSON.parse(JSON.stringify(outletAssignmentRows)))
    setIsAssignOutletsOpen(true)

    try {
      if (!isDemoMode()) {
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
            isOverride: match ? match.price !== product.price : false,
            visibility: match && match.visibility ? match.visibility : 'Show',
          }
        })
        setOutletAssignmentRows(rows)
      }
    } catch (err) {
      console.error('Failed to load availability:', err)
    }
  }

  const handleCancelAssignOutlets = () => {
    setOutletAssignmentRows(backupAssignmentRows)
    setIsAssignOutletsOpen(false)
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
              priceOverride: r.isOverride ? Number(r.price) : null,
              stockQuantity: Number(r.stockQuantity),
              status: r.visibility === 'Hide' ? 'inactive' : 'active',
            })),
          }
        )
      }
      setIsAssignOutletsOpen(false)
      alert(`Outlet availability saved for "${outletAssignmentProduct.name}".`)
      await loadProducts()
      if (selectedProduct && (selectedProduct.id === outletAssignmentProduct.id || selectedProduct._id === outletAssignmentProduct.id)) {
        await loadProductAvailabilityAndInventory(selectedProduct, outlets)
        await loadProductActivities(selectedProduct)
      }
    } catch (err) {
      console.error('Failed to save outlet assignment:', err)
      alert('Failed to save outlet assignment.')
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      if (!selectedProduct) {
        setSelectedProduct(products[0])
      } else {
        const updated = products.find((p) => p.sku === selectedProduct.sku || p.id === selectedProduct.id)
        if (updated) {
          setSelectedProduct(updated)
        }
      }
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

  const mapLogToActivity = (log) => {
    const formatDate = (dateStr) => {
      try {
        const date = new Date(dateStr)
        const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' }
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true }
        const formattedDate = date.toLocaleDateString('en-US', optionsDate)
        const formattedTime = date.toLocaleTimeString('en-US', optionsTime)
        return `${formattedDate} • ${formattedTime}`
      } catch (e) {
        return dateStr
      }
    }

    const actorName = log.actor?.name || 'System'
    const getInitials = (name) => {
      if (!name) return 'SYS'
      const parts = name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    const avatar = getInitials(actorName)

    let title = 'Activity Logged'
    let icon = <Plus size={11} />
    let iconBg = 'bg-slate-50 text-slate-600 border-slate-100'
    let details = null
    let badge = null
    let badgeBg = null

    switch (log.action) {
      case 'product.create':
        title = 'Product Created'
        icon = <Plus size={11} />
        iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-100'
        details = `Created with SKU ${log.details?.sku || 'N/A'}`
        break
      case 'product.update':
        title = 'Product Edited'
        icon = <Edit3 size={11} />
        iconBg = 'bg-indigo-50 text-indigo-600 border-indigo-100'
        details = log.details?.fields ? `Updated ${log.details.fields.join(', ')}` : 'Updated product details'
        break
      case 'product.price_change':
        title = 'Price Changed'
        icon = <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        iconBg = 'bg-amber-50 text-amber-600 border-amber-100'
        details = `${money(log.details?.oldPrice)} → ${money(log.details?.newPrice)}`
        break
      case 'stock.adjust': {
        title = 'Stock Adjusted'
        icon = <Warehouse size={11} />
        iconBg = 'bg-blue-50 text-blue-600 border-blue-100'
        
        const change = log.details?.quantityChange ?? 0
        const unit = 'cups'
        const changeStr = change > 0 ? `+${change} ${unit}` : `${change} ${unit}`
        
        const oldQty = log.details?.oldQuantity ?? 0
        const newQty = log.details?.newQuantity ?? 0
        
        const outletSuffix = log.outlet?.name ? ` at ${log.outlet.name}` : ''
        details = `${oldQty} ${unit} → ${newQty} ${unit}${outletSuffix}`
        badge = changeStr
        badgeBg = change > 0 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
          : 'bg-rose-50 text-rose-600 border-rose-100'
        break
      }
      case 'product.outlet_availability_change':
        title = 'Outlet Availability Changed'
        icon = <Store size={11} />
        iconBg = 'bg-purple-50 text-purple-600 border-purple-100'
        
        if (log.details?.outlets && Array.isArray(log.details.outlets)) {
          const outletChanges = log.details.outlets.map(o => {
            const outletName = outlets.find(item => item.id === o.outletId)?.name || `Outlet #${o.outletId}`
            return `${outletName} (${o.isAvailable ? 'Available' : 'Unavailable'})`
          })
          details = `Updated outlets: ${outletChanges.join(', ')}`
        } else {
          details = 'Outlet availability updated'
        }
        break
      case 'product.tags_update': {
        title = 'Tags Updated'
        icon = <Bookmark size={11} />
        iconBg = 'bg-rose-50 text-rose-600 border-rose-100'
        const newTags = log.details?.newTags || []
        details = newTags.length > 0 ? `Tags: ${newTags.join(', ')}` : 'Cleared tags'
        break
      }
      case 'product.status_change': {
        title = 'Status Changed'
        icon = <RefreshCw size={11} />
        iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-100'
        const oldStatus = log.details?.oldStatus || 'Inactive'
        const newStatus = log.details?.newStatus || 'Active'
        details = `${oldStatus} → ${newStatus}`
        badge = newStatus
        badgeBg = newStatus === 'Active'
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
          : 'bg-rose-50 text-rose-600 border-rose-100'
        break
      }
      case 'product.delete':
        title = 'Product Deleted'
        icon = <Trash2 size={11} />
        iconBg = 'bg-rose-50 text-rose-600 border-rose-100'
        details = `Deleted product ${log.details?.name || ''}`
        break
      default:
        title = log.action ? log.action.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Action Logged'
        icon = <Plus size={11} />
        iconBg = 'bg-slate-50 text-slate-600 border-slate-100'
        details = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)
        break
    }

    return {
      title,
      actor: actorName,
      time: formatDate(log.created_at || log.createdAt),
      icon,
      iconBg,
      details,
      badge,
      badgeBg,
      avatar
    }
  }

  const filteredActivities = useMemo(() => {
    if (activityTypeFilter === 'all') return productActivities
    return productActivities.filter(act => act.action === activityTypeFilter)
  }, [productActivities, activityTypeFilter])

  const mappedActivities = useMemo(() => {
    if (productActivities.length === 0) {
      // Mock logs for fallback / demo mode
      const mockLogs = [
        {
          title: 'Product Created',
          actor: 'Ahmad Danial',
          time: 'May 29, 2025 • 09:12 AM',
          icon: <Plus size={11} />,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          details: null,
          avatar: 'AD',
          type: 'product.create'
        },
        {
          title: 'Product Edited',
          actor: 'Siti Nur Aisyah',
          time: 'May 29, 2025 • 09:35 AM',
          icon: <Edit3 size={11} />,
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          details: 'Updated Description, Category',
          avatar: 'SA',
          type: 'product.update'
        },
        {
          title: 'Price Changed',
          actor: 'Ahmad Danial',
          time: 'May 29, 2025 • 09:47 AM',
          icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          details: 'Rp11.000 → Rp12.000',
          avatar: 'AD',
          type: 'product.price_change'
        },
        {
          title: 'Stock Adjusted',
          actor: 'Siti Nur Aisyah',
          time: 'May 29, 2025 • 10:03 AM',
          icon: <Warehouse size={11} />,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
          details: '20 cups → 24 cups',
          badge: '+4 cups',
          badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          avatar: 'SA',
          type: 'stock.adjust'
        },
        {
          title: 'Outlet Availability Changed',
          actor: 'Ahmad Danial',
          time: 'May 29, 2025 • 10:15 AM',
          icon: <Store size={11} />,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
          details: 'Added to 2 outlets: Setia Alam, Bangsar',
          avatar: 'AD',
          type: 'product.outlet_availability_change'
        },
        {
          title: 'Tags Updated',
          actor: 'Siti Nur Aisyah',
          time: 'May 29, 2025 • 10:22 AM',
          icon: <Bookmark size={11} />,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          details: 'Added tags: Teh, Favorite',
          avatar: 'SA',
          type: 'product.tags_update'
        },
        {
          title: 'Status Changed',
          actor: 'Ahmad Danial',
          time: 'May 29, 2025 • 10:28 AM',
          icon: <RefreshCw size={11} />,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          details: 'Inactive → Active',
          badge: 'Active',
          badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          avatar: 'AD',
          type: 'product.status_change'
        },
        {
          title: 'Product Exported',
          actor: 'Ahmad Danial',
          time: 'May 29, 2025 • 10:30 AM',
          icon: <Download size={11} />,
          iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
          details: 'Exported to CSV',
          avatar: 'AD',
          type: 'product.export'
        }
      ]
      
      if (activityTypeFilter === 'all') return mockLogs
      return mockLogs.filter(act => act.type === activityTypeFilter)
    }

    return filteredActivities.map(mapLogToActivity)
  }, [productActivities, filteredActivities, activityTypeFilter, outlets])

  const displayedActivities = useMemo(() => {
    return mappedActivities.slice(0, activitiesLimit)
  }, [mappedActivities, activitiesLimit])

  const dateRangeLabel = useMemo(() => {
    const list = productActivities.length > 0 ? filteredActivities : mappedActivities
    if (!list || list.length === 0) return 'All-time'
    try {
      const dates = list.map(a => {
        const val = a.created_at || a.createdAt || a.time || Date.now()
        if (typeof val === 'string' && val.includes('•')) {
          return new Date(val.split(' • ')[0])
        }
        return new Date(val)
      }).filter(d => !isNaN(d.getTime()))

      if (dates.length === 0) return 'May 1, 2025 - May 29, 2025'
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))
      const options = { month: 'short', day: 'numeric', year: 'numeric' }
      return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`
    } catch (e) {
      return 'May 1, 2025 - May 29, 2025'
    }
  }, [productActivities, filteredActivities, mappedActivities])

  const handleLoadMoreActivities = () => {
    const newLimit = activitiesLimit + 10
    setActivitiesLimit(newLimit)
    loadProductActivities(selectedProduct, newLimit)
  }

  const parseNumber = (val) => {
    if (val === undefined || val === null) return 0
    if (typeof val === 'number') return val
    const str = String(val).trim()
    if (!str) return 0
    let clean = str.replace(/[Rp\s]/gi, '')
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(/,/g, '.')
    } else if (clean.includes(',')) {
      const parts = clean.split(',')
      if (parts[1] && parts[1].length === 3) {
        clean = clean.replace(/,/g, '')
      } else {
        clean = clean.replace(/,/g, '.')
      }
    } else if (clean.includes('.')) {
      const parts = clean.split('.')
      if (parts.length === 2 && parts[1].length === 3) {
        clean = clean.replace(/\./g, '')
      }
    }
    return Number(clean) || 0
  }

  const parseImportFile = (data) => {
    if (!data || data.length < 2) return []

    const headers = data[0].map(h => String(h).trim().toLowerCase())
    
    const findColumnIndex = (aliases) => {
      return headers.findIndex(h => aliases.includes(h))
    }

    const nameIdx = findColumnIndex(['name', 'nama', 'product name', 'nama produk', 'title'])
    const skuIdx = findColumnIndex(['sku', 'product code', 'kode', 'kode produk', 'item code'])
    const catIdx = findColumnIndex(['category', 'kategori', 'tipe', 'category name'])
    const descIdx = findColumnIndex(['description', 'deskripsi', 'keterangan', 'desc'])
    const priceIdx = findColumnIndex(['price', 'harga', 'harga jual', 'base price', 'jual'])
    const costIdx = findColumnIndex(['cost', 'harga beli', 'cost price', 'modal', 'beli'])
    const stockIdx = findColumnIndex(['stock', 'stok', 'initial stock', 'jumlah', 'quantity', 'qty'])
    const statusIdx = findColumnIndex(['status', 'aktif', 'active', 'isactive', 'is active'])
    const tagsIdx = findColumnIndex(['tags', 'tag', 'label'])

    if (nameIdx === -1) {
      alert("Invalid template: 'Name' or 'Nama' column is required.")
      return []
    }

    const parsed = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0 || !row[nameIdx]) continue

      const name = String(row[nameIdx]).trim()
      const sku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : `SKU-IMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : 'Minuman'
      const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : ''
      const price = priceIdx !== -1 && row[priceIdx] ? parseNumber(row[priceIdx]) : 0
      const cost = costIdx !== -1 && row[costIdx] ? parseNumber(row[costIdx]) : 0
      const stock = stockIdx !== -1 && row[stockIdx] ? parseNumber(row[stockIdx]) : 0
      const status = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim().toLowerCase() : 'active'
      const tags = tagsIdx !== -1 && row[tagsIdx] ? String(row[tagsIdx]).split(',').map(t => t.trim()).filter(Boolean) : []

      parsed.push({
        name,
        sku,
        category,
        description,
        basePrice: price,
        costPrice: cost,
        stockQuantity: stock,
        isActive: ['active', 'aktif', 'true', '1', 'yes'].includes(status),
        tags,
        stockTracking: true,
      })
    }
    return parsed
  }

  const processFile = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
        
        const parsed = parseImportFile(data)
        if (parsed.length > 0) {
          setImportProductsList(parsed)
          setImportStatusText(`Found ${parsed.length} products to import.`)
        } else {
          setImportProductsList([])
          setImportStatusText('No valid products found in the file.')
        }
      } catch (err) {
        console.error('Failed to parse file:', err)
        alert('Failed to parse file. Make sure it is a valid CSV or Excel file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false)
    setImportProductsList([])
    setImportProgress(0)
    setImportStatusText('')
    setImportErrors([])
    setIsImporting(false)
  }

  const handleDownloadTemplate = () => {
    const headers = ['Name', 'SKU', 'Category', 'Description', 'Price', 'Cost', 'Stock', 'Status', 'Tags']
    const sampleRows = [
      ['Salty Caramel', 'SKU-SEL-001', 'Signature', 'Espresso with milk and caramel', '24000', '8500', '100', 'active', 'Best Seller, Premium'],
      ['Matcha Latte', 'SKU-SEL-003', 'Non Coffee', 'Creamy green tea latte', '22000', '9000', '50', 'active', 'Premium']
    ]
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'kalis_products_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExecuteImport = async () => {
    if (importProductsList.length === 0) return

    setIsImporting(true)
    setImportProgress(0)
    setImportErrors([])
    setImportStatusText('Starting batch import...')

    const list = [...importProductsList]
    const total = list.length
    let succeeded = 0
    let failed = 0
    const errors = []

    const batchSize = 5
    for (let i = 0; i < total; i += batchSize) {
      const batch = list.slice(i, i + batchSize)
      setImportStatusText(`Importing products ${i + 1} to ${Math.min(i + batchSize, total)} of ${total}...`)
      
      const promises = batch.map(async (item) => {
        try {
          if (isDemoMode()) {
            await new Promise(resolve => setTimeout(resolve, 300))
            const mockNew = {
              id: products.length + succeeded + 1,
              _id: String(products.length + succeeded + 1),
              name: item.name,
              sku: item.sku,
              category: item.category,
              description: item.description,
              price: item.basePrice,
              cost: item.costPrice,
              stock: item.stockQuantity,
              status: item.isActive ? 'Active' : 'Inactive',
              image: '/images/products/salty-caramel.png',
              outlets: outlets.length,
              salesMonth: 0,
              salesChange: 0,
              totalSold: 0,
              tags: item.tags || [],
              tax: 'No Tax',
              trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              inventorySummary: { total: item.stockQuantity, lowStock: 0, outOfStock: 0 }
            }
            setProducts(prev => [mockNew, ...prev])
            if (!demoProductsList) {
              demoProductsList = dummyProducts.map(p => ({ ...p }))
            }
            demoProductsList = [mockNew, ...demoProductsList]
          } else {
            await api.post('/products', {
              ...item,
              outlets: outlets.map(o => o.id),
            })
          }
          succeeded++
        } catch (err) {
          failed++
          errors.push({
            name: item.name,
            sku: item.sku,
            message: err.response?.data?.error?.message || err.message || 'Unknown error'
          })
        }
      })

      await Promise.all(promises)
      setImportProgress(Math.round(((i + batch.length) / total) * 100))
    }

    setIsImporting(false)
    setImportStatusText(`Import completed: ${succeeded} succeeded, ${failed} failed.`)
    setImportErrors(errors)
    
    await loadProducts()

    if (failed === 0) {
      alert(`Successfully imported all ${succeeded} products!`)
      setIsImportModalOpen(false)
      setImportProductsList([])
    } else {
      alert(`Import finished with errors: ${succeeded} succeeded, ${failed} failed.`)
    }
  }

  return (
    <div className='flex flex-1 overflow-hidden bg-[#F6F8FB] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)] text-[#11182E]'>
      <main
        className={cx(
          'flex-1 flex flex-col min-w-0 p-4 pt-3 overflow-hidden transition-[padding] duration-200 motion-reduce:transition-none',
          (isDetailOpen || isModifierDetailOpen) ? 'xl:pr-[576px]' : 'xl:pr-4'
        )}
      >
        <div className='flex min-h-0 w-full flex-1 flex-col overflow-hidden'>
          <header className='-mx-1 shrink-0 flex flex-col gap-3 overflow-visible px-1 pt-1 pb-1 lg:flex-row lg:items-start lg:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold tracking-tight text-[#11182E]'>
                {mainTab === 'products' ? 'Products' : 'Modifiers'}
              </h1>
            </div>
            <div className='flex flex-wrap items-center justify-end gap-2.5 overflow-visible xl:flex-nowrap'>
              {mainTab === 'products' ? (
                <>
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
                    onClick={() => setIsImportModalOpen(true)}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8] cursor-pointer'
                  >
                    <UploadCloud size={14} />
                    Import
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setExportScope('all')
                      setIsExportModalOpen(true)
                    }}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8] cursor-pointer'
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setMainTab('modifiers')
                    }}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8] cursor-pointer'
                  >
                    Add Modifiers
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={handleOpenAddProduct}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#F43F70] px-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(244,63,112,0.24)] transition hover:bg-[#e62e63]'
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </>
              ) : (
                <>
                  <button
                    type='button'
                    onClick={() => setIsImportModalOpen(true)}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8] cursor-pointer'
                  >
                    <UploadCloud size={14} />
                    Import
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setExportScope('all')
                      setIsExportModalOpen(true)
                    }}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#D6DCE8] bg-white px-4 text-base font-bold text-[#11182E] shadow-sm transition hover:border-[#C8D0DF] hover:bg-[#F2F4F8] cursor-pointer'
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setAddModifierStep(1)
                      setNewModifierType('Single Choice')
                      setNewModifierName('')
                      setNewModifierDesc('')
                      setNewModifierMaxOptions('1')
                      setNewModifierOutletScope('All Outlets')
                      setIsAddModifierGroupOpen(true)
                    }}
                    className='inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#FF1F6D] px-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(255,31,109,0.24)] transition hover:bg-[#e0155b] cursor-pointer'
                  >
                    <Plus size={16} />
                    Add Modifier Group
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Main Tabs (Products vs Modifiers) */}
          <div className='flex border-b border-[#E1E6EF] gap-8 mt-1 mb-2 shrink-0'>
            <button
              type='button'
              onClick={() => setMainTab('products')}
              className={cx(
                'pb-3 text-base font-extrabold cursor-pointer relative transition duration-150 flex items-center',
                mainTab === 'products' ? 'text-[#F43F70]' : 'text-[#667085] hover:text-[#11182E]'
              )}
            >
              <span>Products</span>
              <span
                className={cx(
                  'ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold transition duration-150',
                  mainTab === 'products' ? 'bg-[#FDF2F5] text-[#F43F70]' : 'bg-[#F2F4F8] text-[#667085]'
                )}
              >
                {products.length}
              </span>
              {mainTab === 'products' && (
                <div className='absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F43F70] rounded-full' />
              )}
            </button>
            <button
              type='button'
              onClick={() => setMainTab('modifiers')}
              className={cx(
                'pb-3 text-base font-extrabold cursor-pointer relative transition duration-150 flex items-center',
                mainTab === 'modifiers' ? 'text-[#F43F70]' : 'text-[#667085] hover:text-[#11182E]'
              )}
            >
              <span>Modifiers</span>
              <span
                className={cx(
                  'ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold transition duration-150',
                  mainTab === 'modifiers' ? 'bg-[#FDF2F5] text-[#F43F70]' : 'bg-[#F2F4F8] text-[#667085]'
                )}
              >
                12
              </span>
              {mainTab === 'modifiers' && (
                <div className='absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F43F70] rounded-full' />
              )}
            </button>
          </div>

          <p className='text-sm text-[#667085] shrink-0 mt-0.5 mb-2'>
            {mainTab === 'products' ? 'Manage all products across your outlets.' : 'Manage all product modifier groups across your outlets.'}
          </p>

          {mainTab === 'products' && (
            <>
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
                        className='border-b border-[#F2F4F8] px-3 py-4.5'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type='checkbox'
                          checked={selectedSKUs.includes(item.sku)}
                          onChange={() => toggleSelectSKU(item.sku)}
                          className='h-4 w-4 rounded border-[#D0D5DD] text-[#F43F70] focus:ring-[#F43F70] cursor-pointer'
                        />
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
                        <div className='flex items-center gap-3'>
                          <ProductImage
                            src={item.image}
                            name={item.name}
                            className='h-9 w-9 rounded-lg'
                          />
                          <div className='min-w-0 flex flex-col justify-center gap-1.5'>
                            <p className='truncate text-sm font-extrabold text-[#11182E] m-0 p-0 leading-none'>
                              {item.name}
                            </p>
                            <p className='text-xs text-[#667085] m-0 p-0 leading-none'>
                              {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
                        <span
                          className={cx(
                            'rounded-md px-2 py-1 text-[11px] font-bold',
                            categoryTone[item.category]
                          )}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-sm font-semibold text-[#11182E]'>
                        {item.outlets} outlets
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-sm font-bold text-[#11182E]'>
                        {money(item.price)}
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
                        <div className='flex flex-col gap-1.5 justify-center'>
                          <p className='text-sm font-extrabold text-[#11182E] m-0 p-0 leading-none'>
                            {item.stock}
                          </p>
                          <p
                            className={cx(
                              'text-xs font-bold m-0 p-0 leading-none',
                              stockTone[item.stockState]
                            )}
                          >
                            {item.stockState}
                          </p>
                        </div>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
                        <span
                          className={cx(
                            'rounded-md px-2 py-1 text-[11px] font-bold',
                            statusTone[item.status]
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
                        <div className='flex flex-col gap-1.5 justify-center'>
                          <p className='text-sm font-bold text-[#11182E] m-0 p-0 leading-none'>
                            {money(item.salesMonth)}
                          </p>
                          <div className='flex items-center m-0 p-0 leading-none'>
                            <Trend value={item.salesChange} />
                          </div>
                        </div>
                      </td>
                      <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
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
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Eye size={13.5} className='text-slate-400' />
                                  View details
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    alert(`Edit product: ${item.name}`)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Edit3 size={13.5} className='text-slate-400' />
                                  Edit product
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    alert(`Duplicate product: ${item.name}`)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Copy size={13.5} className='text-slate-400' />
                                  Duplicate
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    alert(`Manage inventory for: ${item.name}`)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Warehouse size={13.5} className='text-slate-400' />
                                  Manage inventory
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    handleOpenAssignOutlets(item)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Store size={13.5} className='text-slate-400' />
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
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Archive size={13.5} className='text-[#F43F70]' />
                                  Archive
                                </button>
                                <button
                                  type='button'
                                  onClick={() => {
                                    setDeleteTarget(item)
                                    setIsDeleteConfirmOpen(true)
                                    setOpenDropdownId(null)
                                  }}
                                  className='w-full border-0 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer text-left font-semibold'
                                >
                                  <Trash2 size={13.5} className='text-[#F43F70]' />
                                  Delete
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
          </>
          )}

          {mainTab === 'modifiers' && (
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              {/* Modifier Metrics */}
              <section className='mt-3 shrink-0 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <MetricCard
                  icon={Box}
                  label='Total Modifier Groups'
                  value={modifiers.length}
                  change={9}
                  tone='violet'
                />
                <MetricCard
                  icon={Shield}
                  label='Active Groups'
                  value={modifiers.filter(m => m.status === 'Active').length}
                  change={25}
                  tone='green'
                />
                <MetricCard
                  icon={Sliders}
                  label='Total Options'
                  value={modifiers.reduce((sum, m) => sum + m.options.length, 0)}
                  change={12}
                  tone='orange'
                />
                <MetricCard
                  icon={Link}
                  label='Linked Products'
                  value={modifiers.reduce((sum, m) => sum + (m.productsCount || 0), 0)}
                  change={18}
                  tone='brand'
                />
              </section>

              {/* Modifier Filters */}
              <section className='mt-3 shrink-0 grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1.35fr_.95fr_.95fr_.95fr_.95fr_auto] relative'>
                <label className='relative block min-w-0'>
                  <span className='sr-only'>Search modifier</span>
                  <Search
                    size={15}
                    className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]'
                  />
                  <input
                    type='search'
                    value={modifierSearch}
                    onChange={(e) => setModifierSearch(e.target.value)}
                    placeholder='Search modifier group, option, product...'
                    className='h-9 w-full rounded-lg border border-[#E1E6EF] bg-white pl-9 pr-3 text-sm text-[#11182E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF1F6D] focus:ring-4 focus:ring-[#FF1F6D]/10 font-medium'
                  />
                </label>
                <FilterSelect
                  label='Outlets'
                  value={modifierOutletFilter}
                  onChange={setModifierOutletFilter}
                  options={['All Outlets']}
                />
                <FilterSelect
                  label='Types'
                  value={modifierTypeFilter}
                  onChange={setModifierTypeFilter}
                  options={['All Types', 'Optional', 'Required']}
                />
                <FilterSelect
                  label='Status'
                  value={modifierStatusFilter}
                  onChange={setModifierStatusFilter}
                  options={['All Status', 'Active', 'Inactive']}
                />
                <FilterSelect
                  label='Selection Rule'
                  value={modifierRuleFilter}
                  onChange={setModifierRuleFilter}
                  options={['Selection Rule', 'Single-select', 'Multi-select']}
                />
                <button
                  type='button'
                  className='inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#D6DCE8] bg-white px-3 text-sm font-bold text-[#11182E] hover:bg-[#F2F4F8] cursor-pointer'
                >
                  <Filter size={14} />
                  <span>More Filters</span>
                </button>
              </section>

              {/* Sort and summary row */}
              <div className='mt-2.5 shrink-0 flex items-center justify-between text-sm text-[#667085] px-1'>
                <div className='flex items-center gap-2'>
                  <span>
                    Showing:{' '}
                    <strong className='text-[#11182E]'>
                      1 to {filteredModifiers.length} of {filteredModifiers.length} modifier groups
                    </strong>
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='whitespace-nowrap text-sm font-medium text-[#667085]'>
                    Sort by:
                  </span>
                  <div className='w-36'>
                    <FilterSelect
                      label='Sort modifiers'
                      value={modifierSortBy}
                      onChange={setModifierSortBy}
                      options={['Newest First', 'Oldest First']}
                    />
                  </div>
                </div>
              </div>

              {/* Modifier Group Table */}
              <section className='mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E1E6EF] bg-white shadow-[0_8px_30px_rgba(17,24,46,0.03)]'>
                <div className='min-h-0 flex-1 overflow-auto'>
                  <table className='w-full min-w-[980px] border-separate border-spacing-0'>
                    <thead className='bg-[#FCFDFE]'>
                      <tr className='text-left text-sm font-semibold text-[#667085]'>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5 w-12'>
                          <input type='checkbox' className='h-4 w-4 rounded border-[#D0D5DD] text-[#F43F70]' />
                        </th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Modifier Group</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Type</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Selection Rule</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Options</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Linked Products</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Status</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5'>Updated At</th>
                        <th className='border-b border-[#E1E6EF] px-3 py-2.5 text-right w-28'>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModifiers.map((mod) => {
                        const iconData = getModifierIcon(mod.name);
                        return (
                          <tr key={mod.id} className='cursor-pointer transition hover:bg-[#FCF8FB]' onClick={() => {
                            setSelectedModifier(mod);
                            setActiveModifierDetailTab('Overview');
                            setIsModifierDetailOpen(true);
                            setIsDetailOpen(false); // close product detail sidebar if open
                          }}>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5' onClick={(e) => e.stopPropagation()}>
                              <input type='checkbox' className='h-4 w-4 rounded border-[#D0D5DD] text-[#F43F70]' />
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 font-bold text-[#11182E]'>
                              <div className='flex items-center gap-3'>
                                <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0', iconData.bg)}>
                                  {iconData.icon}
                                </div>
                                <div className='flex flex-col min-w-0'>
                                  <span className='font-bold text-sm text-[#11182E] leading-tight truncate'>{mod.name}</span>
                                  <span className='font-medium text-xs text-[#98A2B3] mt-0.5 leading-none'>{mod.code}</span>
                                </div>
                              </div>
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-sm'>
                              <span className={cx(
                                'rounded-lg px-2.5 py-1 text-[11px] font-bold border',
                                mod.type === 'Required'
                                  ? 'bg-[#FFF1F2] text-[#DC3545] border-[#FEE2E2]'
                                  : 'bg-[#F5F3FF] text-[#6956E8] border-[#EDE9FE]'
                              )}>
                                {mod.type}
                              </span>
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-sm font-semibold text-[#475467]'>
                              {mod.selectionRule}
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-sm font-semibold text-[#475467]'>
                              {mod.options.length} options
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-sm font-bold text-[#FF1F6D]'>
                              {mod.productsCount || 0} products
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5'>
                              <span className={cx(
                                'rounded-lg px-2.5 py-1 text-[11px] font-bold border',
                                mod.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              )}>
                                {mod.status}
                              </span>
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-xs font-semibold text-[#667085]'>
                              {mod.updatedAt}
                            </td>
                            <td className='border-b border-[#F2F4F8] px-3 py-4.5 text-right' onClick={(e) => e.stopPropagation()}>
                              <div className='flex items-center justify-end gap-1.5'>
                                <button
                                  type='button'
                                  onClick={() => {
                                    setSelectedModifier(mod);
                                    setActiveModifierDetailTab('Overview');
                                    setIsModifierDetailOpen(true);
                                    setIsDetailOpen(false);
                                  }}
                                  className='bg-white hover:bg-[#F2F4F8] border border-[#E1E6EF] text-xs font-bold px-3 py-1.5 rounded-lg text-[#11182E] shadow-sm transition duration-150 cursor-pointer'
                                >
                                  View
                                </button>
                                <button
                                  type='button'
                                  className='grid h-8 w-8 place-items-center rounded-lg border border-[#E1E6EF] text-[#667085] hover:bg-[#F6F8FB] hover:text-[#11182E] transition cursor-pointer'
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
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
            outletAvailability={outletAssignmentRows}
            onUpdateProduct={handleUpdateProduct}
            onEditClick={handleEditProduct}
            onAdjustStockClick={() => {
              if (outletInventory && outletInventory.length > 0) {
                setAdjustStockOutlet(outletInventory[0].outletId || outletInventory[0].outlet)
              }
              setAdjustStockType('add')
              setAdjustStockQuantity('10')
              setAdjustStockReasonSelect('Stock received')
              setAdjustStockReasonText('Received from supplier.')
              setIsAdjustStockOpen(true)
            }}
            onAssignOutletsClick={() => handleOpenAssignOutlets(selectedProduct)}
            onToggleOutletAvailability={handleToggleOutletAvailability}
            onOutletVisibilityChange={handleOutletVisibilityChange}
            productActivities={productActivities}
            isLoadingActivities={isLoadingActivities}
            activityTypeFilter={activityTypeFilter}
            setActivityTypeFilter={setActivityTypeFilter}
            totalActivities={totalActivities}
            displayedActivities={displayedActivities}
            dateRangeLabel={dateRangeLabel}
            handleLoadMoreActivities={handleLoadMoreActivities}
            mappedActivities={mappedActivities}
          />
        </div>
      )}

      {isModifierDetailOpen && selectedModifier && (
        <div className='fixed inset-y-0 right-0 z-[80] hidden xl:block w-[560px] h-[100dvh] bg-white border-l border-[#E1E6EF] overflow-hidden shadow-[-4px_0_15px_rgba(17,24,46,0.03)]'>
          <ModifierDetailPanel
            modifier={selectedModifier}
            onClose={() => setIsModifierDetailOpen(false)}
            activeTab={activeModifierDetailTab}
            setActiveTab={setActiveModifierDetailTab}
            products={products}
            onUpdateModifier={(updatedMod) => {
              setModifiers(prev => prev.map(m => m.id === updatedMod.id ? updatedMod : m))
              setSelectedModifier(updatedMod)
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
            outletAvailability={outletAssignmentRows}
            onUpdateProduct={handleUpdateProduct}
            onEditClick={handleEditProduct}
            onAdjustStockClick={() => {
              if (outletInventory && outletInventory.length > 0) {
                setAdjustStockOutlet(outletInventory[0].outletId || outletInventory[0].outlet)
              }
              setAdjustStockType('add')
              setAdjustStockQuantity('10')
              setAdjustStockReasonSelect('Stock received')
              setAdjustStockReasonText('Received from supplier.')
              setIsAdjustStockOpen(true)
            }}
            onAssignOutletsClick={() => handleOpenAssignOutlets(selectedProduct)}
            onToggleOutletAvailability={handleToggleOutletAvailability}
            onOutletVisibilityChange={handleOutletVisibilityChange}
            productActivities={productActivities}
            isLoadingActivities={isLoadingActivities}
            activityTypeFilter={activityTypeFilter}
            setActivityTypeFilter={setActivityTypeFilter}
            totalActivities={totalActivities}
            displayedActivities={displayedActivities}
            dateRangeLabel={dateRangeLabel}
            handleLoadMoreActivities={handleLoadMoreActivities}
            mappedActivities={mappedActivities}
          />
        </div>
      )}

      {isModifierDetailOpen && selectedModifier && (
        <div className='xl:hidden'>
          <button
            type='button'
            onClick={() => setIsModifierDetailOpen(false)}
            className='fixed inset-0 z-40 bg-[#11182E]/40 backdrop-blur-[2px]'
          />
          <ModifierDetailPanel
            modifier={selectedModifier}
            mobile
            onClose={() => setIsModifierDetailOpen(false)}
            activeTab={activeModifierDetailTab}
            setActiveTab={setActiveModifierDetailTab}
            products={products}
            onUpdateModifier={(updatedMod) => {
              setModifiers(prev => prev.map(m => m.id === updatedMod.id ? updatedMod : m))
              setSelectedModifier(updatedMod)
            }}
          />
        </div>
      )}

      {/* 3-STEP ADD MODIFIER GROUP MODAL */}
      {isAddModifierGroupOpen && createPortal(
        <div className='fixed inset-0 z-[120] flex items-center justify-center bg-[#11182E]/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200'>
          <div className='w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4.5 border-b border-slate-100'>
              <h3 className='text-lg font-extrabold text-[#11182E]'>Add Modifier Group</h3>
              <button
                type='button'
                onClick={() => setIsAddModifierGroupOpen(false)}
                className='w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-650 cursor-pointer'
              >
                <X size={16} />
              </button>
            </div>

            {/* Step 1 */}
            {addModifierStep === 1 && (
              <div className='p-6 space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-bold text-[#FF1F6D] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md'>Step 1 of 3</span>
                  <span className='text-xs font-semibold text-slate-400'>Tipe Grup</span>
                </div>
                <div>
                  <p className='text-xs text-[#667085] leading-relaxed mb-3.5'>Buat grup modifier baru untuk digunakan di produk. Pilih apakah customer boleh pilih satu atau beberapa modifier.</p>
                  
                  <div className='grid gap-3.5'>
                    <label className={cx(
                      'flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-xs',
                      newModifierType === 'Single Choice'
                        ? 'border-[#7f56d9] bg-[#fdfcff] shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    )}>
                      <input
                        type='radio'
                        name='modifierType'
                        value='Single Choice'
                        checked={newModifierType === 'Single Choice'}
                        onChange={() => setNewModifierType('Single Choice')}
                        className='sr-only'
                      />
                      <div className={cx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                        newModifierType === 'Single Choice'
                          ? 'border-[#7f56d9] bg-[#7f56d9] text-white'
                          : 'border-slate-300 bg-white'
                      )}>
                        {newModifierType === 'Single Choice' && <span className='w-2.5 h-2.5 rounded-full bg-white' />}
                      </div>
                      <div className='min-w-0'>
                        <h4 className='m-0 text-sm font-extrabold text-[#11182E]'>Single Choice</h4>
                        <p className='m-0 mt-0.5 text-xs text-[#667085] leading-relaxed'>Customer hanya bisa memilih 1 modifier</p>
                      </div>
                    </label>

                    <label className={cx(
                      'flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-xs',
                      newModifierType === 'Multi Choice'
                        ? 'border-[#7f56d9] bg-[#fdfcff] shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    )}>
                      <input
                        type='radio'
                        name='modifierType'
                        value='Multi Choice'
                        checked={newModifierType === 'Multi Choice'}
                        onChange={() => setNewModifierType('Multi Choice')}
                        className='sr-only'
                      />
                      <div className={cx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                        newModifierType === 'Multi Choice'
                          ? 'border-[#7f56d9] bg-[#7f56d9] text-white'
                          : 'border-slate-300 bg-white'
                      )}>
                        {newModifierType === 'Multi Choice' && <span className='w-2.5 h-2.5 rounded-full bg-white' />}
                      </div>
                      <div className='min-w-0'>
                        <h4 className='m-0 text-sm font-extrabold text-[#11182E]'>Multi Choice</h4>
                        <p className='m-0 mt-0.5 text-xs text-[#667085] leading-relaxed'>Customer bisa memilih lebih dari 1 modifier</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-slate-100'>
                  <button
                    type='button'
                    onClick={() => setIsAddModifierGroupOpen(false)}
                    className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={() => setAddModifierStep(2)}
                    className='px-5 py-2.5 bg-[#7F56D9] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#693cb8] transition cursor-pointer'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {addModifierStep === 2 && (
              <div className='p-6 space-y-4.5'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-bold text-[#FF1F6D] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md'>Step 2 of 3</span>
                  <span className='text-xs font-semibold text-slate-400'>Nama & Deskripsi</span>
                </div>

                <div className='space-y-3.5'>
                  <div>
                    <label className='block text-xs font-bold text-slate-650 mb-1.5'>
                      Nama Grup <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={newModifierName}
                      onChange={(e) => setNewModifierName(e.target.value)}
                      placeholder='Contoh: Extra Cheese'
                      className='w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f56d9]/20 focus:border-[#7f56d9] text-xs text-slate-700 font-bold transition-all'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-650 mb-1.5'>
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={newModifierDesc}
                      onChange={(e) => setNewModifierDesc(e.target.value)}
                      placeholder='Contoh: Pilih tambahan keju sesuai selera'
                      className='w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f56d9]/20 focus:border-[#7f56d9] text-xs text-slate-700 font-bold transition-all resize-none'
                    />
                  </div>

                  {newModifierType === 'Multi Choice' && (
                    <div>
                      <label className='block text-xs font-bold text-slate-650 mb-1.5'>
                        Maksimum Pilihan <span className='text-rose-500'>*</span>
                      </label>
                      <select
                        value={newModifierMaxOptions}
                        onChange={(e) => setNewModifierMaxOptions(e.target.value)}
                        className='w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f56d9]/20 focus:border-[#7f56d9] text-xs text-slate-700 font-bold transition-all cursor-pointer'
                      >
                        <option value='2'>2</option>
                        <option value='3'>3</option>
                        <option value='4'>4</option>
                        <option value='5'>5</option>
                        <option value='10'>10</option>
                      </select>
                      <span className='block mt-1 text-[10px] text-slate-400 font-semibold leading-relaxed'>Maksimal jumlah modifier yang bisa dipilih customer</span>
                    </div>
                  )}
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-slate-100'>
                  <button
                    type='button'
                    onClick={() => setAddModifierStep(1)}
                    className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer'
                  >
                    Back
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      if (!newModifierName.trim()) {
                        alert('Nama grup modifier wajib diisi!')
                        return
                      }
                      setAddModifierStep(3)
                    }}
                    className='px-5 py-2.5 bg-[#7F56D9] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#693cb8] transition cursor-pointer'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {addModifierStep === 3 && (
              <div className='p-6 space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-bold text-[#FF1F6D] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md'>Step 3 of 3</span>
                  <span className='text-xs font-semibold text-slate-400'>Outlet Scope</span>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-650 mb-1.5'>
                    Pilih Outlet <span className='text-rose-500'>*</span>
                  </label>
                  <p className='text-[10px] text-slate-400 font-semibold leading-relaxed mb-3.5'>Pilih outlet yang dapat menggunakan grup modifier ini.</p>
                  
                  <div className='grid gap-3.5'>
                    <label className={cx(
                      'flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-xs',
                      newModifierOutletScope === 'All Outlets'
                        ? 'border-[#7f56d9] bg-[#fdfcff] shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    )}>
                      <input
                        type='radio'
                        name='outletScope'
                        value='All Outlets'
                        checked={newModifierOutletScope === 'All Outlets'}
                        onChange={() => setNewModifierOutletScope('All Outlets')}
                        className='sr-only'
                      />
                      <div className={cx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                        newModifierOutletScope === 'All Outlets'
                          ? 'border-[#7f56d9] bg-[#7f56d9] text-white'
                          : 'border-slate-300 bg-white'
                      )}>
                        {newModifierOutletScope === 'All Outlets' && <span className='w-2.5 h-2.5 rounded-full bg-white' />}
                      </div>
                      <div className='min-w-0'>
                        <h4 className='m-0 text-sm font-extrabold text-[#11182E]'>All Outlets</h4>
                        <p className='m-0 mt-0.5 text-xs text-[#667085] leading-relaxed'>Tersedia di semua outlet</p>
                      </div>
                    </label>

                    <label className={cx(
                      'flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-xs',
                      newModifierOutletScope === 'Select Outlets'
                        ? 'border-[#7f56d9] bg-[#fdfcff] shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    )}>
                      <input
                        type='radio'
                        name='outletScope'
                        value='Select Outlets'
                        checked={newModifierOutletScope === 'Select Outlets'}
                        onChange={() => setNewModifierOutletScope('Select Outlets')}
                        className='sr-only'
                      />
                      <div className={cx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                        newModifierOutletScope === 'Select Outlets'
                          ? 'border-[#7f56d9] bg-[#7f56d9] text-white'
                          : 'border-slate-300 bg-white'
                      )}>
                        {newModifierOutletScope === 'Select Outlets' && <span className='w-2.5 h-2.5 rounded-full bg-white' />}
                      </div>
                      <div className='min-w-0'>
                        <h4 className='m-0 text-sm font-extrabold text-[#11182E]'>Select Outlets</h4>
                        <p className='m-0 mt-0.5 text-xs text-[#667085] leading-relaxed'>Pilih outlet tertentu</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-slate-100'>
                  <button
                    type='button'
                    onClick={() => setAddModifierStep(2)}
                    className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer'
                  >
                    Back
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      const newGroup = {
                        id: Date.now(),
                        name: newModifierName,
                        code: 'mod-' + newModifierName.toLowerCase().replace(/\s+/g, '-').slice(0, 8) + '-' + Math.floor(Math.random() * 100),
                        type: 'Optional',
                        selectionRule: newModifierType === 'Single Choice' ? 'Single-select' : `Multi-select (max ${newModifierMaxOptions})`,
                        minSelection: newModifierType === 'Single Choice' ? 1 : 0,
                        maxSelection: newModifierType === 'Single Choice' ? 1 : parseInt(newModifierMaxOptions) || 2,
                        outletScope: newModifierOutletScope,
                        description: newModifierDesc,
                        tags: ['Add-on'],
                        options: [
                          { name: 'Option 1', price: 5000 },
                          { name: 'Option 2', price: 3000 }
                        ],
                        productsCount: 0,
                        categoriesCount: 0,
                        requiredInCheckout: newModifierType === 'Single Choice',
                        status: 'Active',
                        updatedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      }
                      setModifiers(prev => [newGroup, ...prev])
                      setIsAddModifierGroupOpen(false)
                      setToastMessage(`Modifier group "${newModifierName}" berhasil dibuat.`)
                    }}
                    className='px-5 py-2.5 bg-[#7F56D9] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#693cb8] transition cursor-pointer'
                  >
                    Create Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* SUCCESS TOAST NOTIFICATION */}
      {toastMessage && createPortal(
        <div className='fixed bottom-5 right-5 z-[200] flex items-center gap-3.5 bg-white border border-slate-100 rounded-2xl shadow-xl px-5 py-4 animate-in slide-in-from-bottom-5 duration-350'>
          <div className='w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0'>
            <svg className='w-4.5 h-4.5' fill='none' stroke='currentColor' strokeWidth='3.5' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
            </svg>
          </div>
          <div className='flex flex-col min-w-0 pr-2'>
            <span className='text-xs font-black text-[#11182E] leading-tight'>Modifier group created!</span>
            <span className='text-[11px] font-semibold text-[#667085] mt-0.5 leading-none'>{toastMessage}</span>
          </div>
          <button
            type='button'
            onClick={() => setToastMessage(null)}
            className='p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-650 rounded-full cursor-pointer shrink-0'
          >
            <X size={14} />
          </button>
        </div>,
        document.getElementById('modal-root') || document.body
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

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && createPortal(
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#11182E]/40 backdrop-blur-[4px] animate-in fade-in duration-150'>
          <div className='bg-white rounded-3xl w-full max-w-[850px] shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <header className='px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 relative'>
              <div>
                <h3 className='text-base font-extrabold text-[#11182E] leading-none flex items-center gap-2.5'>
                  <span>{isEditMode ? 'Edit Product' : 'Add Product'}</span>
                  <span className='text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider'>
                    {isEditMode ? 'Modify details' : 'Create new product'}
                  </span>
                </h3>
                <p className='m-0 mt-1.5 text-xs text-slate-400 font-semibold leading-none'>
                  {isEditMode
                    ? 'Modify the details of this product below.'
                    : 'Fill in the details below to add a new product to your catalog.'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => {
                  setIsAddProductOpen(false)
                  setIsEditMode(false)
                  setEditingProductId(null)
                  setPhotoPreview(null)
                }}
                className='p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer'
              >
                <X size={15} />
              </button>
            </header>

            {/* Scrollable Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveProduct()
              }}
              className='flex-1 overflow-y-auto min-h-0 bg-slate-50/40 p-6 space-y-6'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Column 1: Product Info */}
                <div className='space-y-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm'>
                  <h4 className='text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5'>
                    Product Info
                  </h4>

                  {/* Image & Main fields side-by-side */}
                  <div className='flex gap-4 items-start'>
                    {/* Image Upload Box */}
                    <div className='flex flex-col shrink-0'>
                      <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                        Product Image
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className='w-[110px] h-[110px] border-2 border-dashed border-slate-200 hover:border-[#FF1F6D] rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-rose-50/5 group relative overflow-hidden'
                      >
                        {uploadingPhoto ? (
                          <div className='flex flex-col items-center justify-center gap-1 text-[10px] text-slate-400'>
                            <RefreshCw size={16} className='animate-spin text-[#FF1F6D]' />
                            <span className='font-bold text-slate-600 animate-pulse'>Uploading</span>
                          </div>
                        ) : photoPreview ? (
                          <div className='w-full h-full relative group/img'>
                            <img src={photoPreview} alt='Preview' className='w-full h-full object-cover rounded-xl' />
                            <div className='absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold uppercase'>
                              <Camera size={14} className='mb-0.5' />
                              Ganti
                            </div>
                          </div>
                        ) : (
                          <>
                            <UploadCloud size={18} className='text-slate-400 group-hover:text-[#FF1F6D] transition-colors mb-0.5' />
                            <span className='text-[10px] font-bold text-slate-700 group-hover:text-[#FF1F6D] transition-colors'>Upload image</span>
                            <span className='text-[8px] text-slate-400 font-semibold leading-tight mt-0.5'>Max 2MB</span>
                          </>
                        )}
                      </div>
                      <input
                        type='file'
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                        accept='image/*'
                      />
                    </div>

                    {/* Primary inputs */}
                    <div className='flex-1 space-y-3.5'>
                      <div>
                        <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                          Product Name <span className='text-[#FF1F6D]'>*</span>
                        </label>
                        <input
                          type='text'
                          required
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                          placeholder='e.g., Teh Tarik Vanilla'
                          className='h-10 w-full rounded-xl border border-[#E1E6EF] bg-white px-3.5 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold'
                        />
                      </div>

                      <div>
                        <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                          SKU <span className='text-[#FF1F6D]'>*</span>
                        </label>
                        <input
                          type='text'
                          required
                          value={addSku}
                          onChange={(e) => setAddSku(e.target.value)}
                          placeholder='e.g., SKU-SEL-007'
                          className='h-10 w-full rounded-xl border border-[#E1E6EF] bg-white px-3.5 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <div className='mb-1.5 flex h-5 items-center justify-between gap-2'>
                        <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none'>
                          Category <span className='text-[#FF1F6D]'>*</span>
                        </label>
                        <button
                          type='button'
                          onClick={() => setIsCategoryManagerOpen(true)}
                          className='inline-flex h-5 items-center rounded-lg border border-[#FFE0EC] bg-[#FFF7FA] px-2.5 text-[10px] font-black leading-none text-[#FF1F6D] hover:bg-[#FFEAF2] transition'
                        >
                          Manage
                        </button>
                      </div>
                      <div className='relative'>
                        <select
                          value={addCategory}
                          onChange={(e) => setAddCategory(e.target.value)}
                          className='h-10 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white pl-3.5 pr-8 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold cursor-pointer'
                        >
                          <option value=''>Select Category</option>
                          {productCategories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                      </div>
                    </div>

                    <div>
                      <label className='mb-1.5 flex h-5 items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none'>
                        Status
                      </label>
                      <div className='relative'>
                        <select
                          value={addStatus}
                          onChange={(e) => setAddStatus(e.target.value)}
                          className='h-10 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white pl-3.5 pr-8 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold cursor-pointer'
                        >
                          <option value='Active'>Active</option>
                          <option value='Inactive'>Inactive</option>
                        </select>
                        <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Description
                    </label>
                    <textarea
                      rows={6}
                      maxLength={500}
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                      placeholder='Describe the product flavor, ingredients, etc...'
                      className='w-full rounded-xl border border-[#E1E6EF] bg-white p-3.5 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-semibold resize-none'
                    />
                    <div className='text-right text-[9px] text-slate-400 font-bold mt-1.5'>
                      {addDescription.length}/500
                    </div>
                  </div>

                  <div>
                    <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                      Tags (Comma separated)
                    </label>
                    <input
                      type='text'
                      value={addTags}
                      onChange={(e) => setAddTags(e.target.value)}
                      placeholder='e.g., sweet, iced, favorite'
                      className='h-10 w-full rounded-xl border border-[#E1E6EF] bg-white px-3.5 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold'
                    />
                  </div>
                </div>

                {/* Column 2: Pricing & Inventory */}
                <div className='space-y-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm'>
                  <h4 className='text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5'>
                    Pricing & Inventory
                  </h4>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                        Price <span className='text-[#FF1F6D]'>*</span>
                      </label>
                      <div className='flex items-center bg-white border border-[#E1E6EF] rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/10 focus-within:border-[#FF1F6D] overflow-hidden'>
                        <span className='text-xs font-bold text-slate-400 bg-slate-50 border-r border-slate-150 px-3 py-2.5 shrink-0 select-none'>
                          Rp
                        </span>
                        <input
                          type='number'
                          required
                          value={addPrice}
                          onChange={(e) => setAddPrice(e.target.value)}
                          placeholder='0'
                          className='w-full px-3 py-2 bg-transparent text-xs text-[#11182E] border-none outline-none focus:outline-none focus:ring-0 font-bold'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                        Cost Price
                      </label>
                      <div className='flex items-center bg-white border border-[#E1E6EF] rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/10 focus-within:border-[#FF1F6D] overflow-hidden'>
                        <span className='text-xs font-bold text-slate-400 bg-slate-50 border-r border-slate-150 px-3 py-2.5 shrink-0 select-none'>
                          Rp
                        </span>
                        <input
                          type='number'
                          value={addCost}
                          onChange={(e) => setAddCost(e.target.value)}
                          placeholder='0'
                          className='w-full px-3 py-2 bg-transparent text-xs text-[#11182E] border-none outline-none focus:outline-none focus:ring-0 font-bold'
                        />
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                        Tax Rate
                      </label>
                      <div className='relative'>
                        <select
                          value={addTax}
                          onChange={(e) => setAddTax(e.target.value)}
                          className='h-10 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white pl-3.5 pr-8 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold cursor-pointer'
                        >
                          <option value='No Tax'>No Tax</option>
                          <option value='PPN 11%'>PPN 11%</option>
                        </select>
                        <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                      </div>
                    </div>

                    <div>
                      <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                        Availability
                      </label>
                      <div className='relative'>
                        <select
                          value={addAvailability}
                          onChange={(e) => setAddAvailability(e.target.value)}
                          className='h-10 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white pl-3.5 pr-8 text-xs text-[#11182E] outline-none transition focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10 font-bold cursor-pointer'
                        >
                          <option value='Always available'>Always available</option>
                          <option value='Custom availability'>Custom availability</option>
                        </select>
                        <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                      </div>
                    </div>
                  </div>

                  {/* Stock tracking section */}
                  <div className='border-t border-slate-100 pt-3.5 space-y-3.5'>
                    <div className='flex items-center justify-between'>
                      <span className='text-[11px] font-extrabold text-slate-500 uppercase tracking-wider'>Track Stock Settings</span>
                      <label className='flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors select-none'>
                        <input
                          type='checkbox'
                          checked={addTrackStock}
                          onChange={(e) => setAddTrackStock(e.target.checked)}
                          className='rounded border-slate-350 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4.5 h-4.5 cursor-pointer'
                        />
                        <span>Enable Tracking</span>
                      </label>
                    </div>

                    {addTrackStock && (
                      <div className='grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-150'>
                        <div>
                          <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                            Initial Stock Level
                          </label>
                          <div className='flex items-center bg-white border border-[#E1E6EF] rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/10 focus-within:border-[#FF1F6D] overflow-hidden'>
                            <input
                              type='number'
                              value={addInitialStock}
                              onChange={(e) => setAddInitialStock(e.target.value)}
                              placeholder='0'
                              className='w-full px-3.5 py-2.5 bg-transparent text-xs text-[#11182E] border-none outline-none focus:outline-none focus:ring-0 font-bold'
                            />
                            <span className='text-xs font-bold text-slate-400 bg-slate-50 border-l border-slate-150 px-3 py-2 shrink-0 select-none'>
                              cups
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className='block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'>
                            Low Stock Limit
                          </label>
                          <div className='flex items-center bg-white border border-[#E1E6EF] rounded-xl focus-within:ring-2 focus-within:ring-[#FF1F6D]/10 focus-within:border-[#FF1F6D] overflow-hidden'>
                            <input
                              type='number'
                              value={addLowStockAlert}
                              onChange={(e) => setAddLowStockAlert(e.target.value)}
                              placeholder='10'
                              className='w-full px-3.5 py-2.5 bg-transparent text-xs text-[#11182E] border-none outline-none focus:outline-none focus:ring-0 font-bold'
                            />
                            <span className='text-xs font-bold text-slate-400 bg-slate-50 border-l border-slate-150 px-3 py-2 shrink-0 select-none'>
                              cups
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outlet Assignment preview grid */}
                  <div className='border-t border-slate-100 pt-3.5 space-y-2.5'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-baseline gap-1.5'>
                        <span className='text-[10px] font-extrabold text-slate-500 uppercase tracking-wider'>Outlet Assignment</span>
                        <span className='text-[9px] font-bold text-slate-400'>
                          ({addSelectedOutlets.length} of {outlets.length} selected)
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          if (addSelectedOutlets.length === outlets.length) {
                            setAddSelectedOutlets([])
                          } else {
                            setAddSelectedOutlets(outlets.map(o => o.id))
                          }
                        }}
                        className='text-[10px] font-extrabold text-[#FF1F6D] hover:text-[#e0155b] border-none bg-transparent cursor-pointer'
                      >
                        {addSelectedOutlets.length === outlets.length ? 'CLEAR ALL' : 'SELECT ALL'}
                      </button>
                    </div>

                    {/* Search bar inside Outlet Assignment */}
                    <div className='relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-[#FF1F6D]/10 focus-within:border-[#FF1F6D] transition-all'>
                      <Search size={12} className='text-slate-400 mr-2 shrink-0' />
                      <input
                        type='text'
                        value={outletSearchQuery}
                        onChange={(e) => setOutletSearchQuery(e.target.value)}
                        placeholder='Search outlets...'
                        className='w-full bg-transparent text-xs text-[#11182E] outline-none border-none p-0 focus:ring-0 font-semibold'
                      />
                      {outletSearchQuery && (
                        <button
                          type='button'
                          onClick={() => setOutletSearchQuery('')}
                          className='p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent'
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>

                    {/* Scrollable list */}
                    <div className='h-[200px] overflow-y-auto border border-slate-200/60 rounded-2xl p-2.5 bg-slate-50/30 space-y-1.5 scrollbar-thin pr-1.5'>
                      {outlets.filter(o => o.name.toLowerCase().includes(outletSearchQuery.toLowerCase())).length > 0 ? (
                        outlets
                          .filter(o => o.name.toLowerCase().includes(outletSearchQuery.toLowerCase()))
                          .map((outlet) => (
                            <label
                              key={outlet.id}
                              className={`border rounded-xl px-3.5 py-2 flex items-center justify-between bg-white cursor-pointer hover:border-[#FF1F6D]/50 hover:bg-rose-50/5 transition-all ${
                                addSelectedOutlets.includes(outlet.id) ? 'border-[#FF1F6D]/30 bg-rose-50/5 shadow-sm' : 'border-slate-200'
                              }`}
                            >
                              <div className='flex items-center gap-2.5 min-w-0'>
                                <input
                                  type='checkbox'
                                  checked={addSelectedOutlets.includes(outlet.id)}
                                  onChange={() => {
                                    setAddSelectedOutlets((prev) =>
                                      prev.includes(outlet.id)
                                        ? prev.filter((id) => id !== outlet.id)
                                        : [...prev, outlet.id]
                                    )
                                  }}
                                  className='rounded border-slate-350 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4.5 h-4.5 cursor-pointer shrink-0'
                                />
                                <div className='min-w-0'>
                                  <div className='font-bold text-slate-800 text-xs truncate leading-tight'>
                                    {outlet.name}
                                  </div>
                                  {outlet.city && (
                                    <div className='text-[10px] text-slate-400 font-bold mt-0.5 leading-none'>
                                      {outlet.city}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {addSelectedOutlets.includes(outlet.id) && (
                                <span className='text-[9px] font-extrabold text-[#FF1F6D] bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider'>
                                  Assigned
                                </span>
                              )}
                            </label>
                          ))
                      ) : (
                        <div className='text-center py-6 text-xs text-slate-400 font-semibold'>
                          No outlets match &quot;{outletSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <footer className='px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0'>
              <button
                type='button'
                onClick={() => {
                  setIsAddProductOpen(false)
                  setPhotoPreview(null)
                }}
                className='px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-sm font-semibold cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSaveProduct}
                className='px-5 py-2.5 bg-[#FF1F6D] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition font-semibold cursor-pointer'
              >
                {isEditMode ? 'Update Product' : 'Save Product'}
              </button>
            </footer>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {isCategoryManagerOpen && createPortal(
        <div className='fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]'>
          <div className='w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl'>
            <header className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
              <div>
                <p className='m-0 text-[11px] font-black uppercase tracking-wider text-[#FF1F6D]'>Product Categories</p>
                <h3 className='m-0 mt-1 text-xl font-black text-[#11182E]'>Manage Category Types</h3>
                <p className='m-0 mt-1 text-xs font-semibold text-slate-400'>Tambah atau hapus tipe kategori untuk dropdown product.</p>
              </div>
              <button type='button' onClick={() => setIsCategoryManagerOpen(false)} className='grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50'>
                <X size={16} />
              </button>
            </header>

            <div className='space-y-4 px-5 py-5'>
              <div className='rounded-2xl border border-[#FFE0EC] bg-[#FFF7FA] p-3'>
                <label className='block text-[10px] font-black uppercase tracking-wider text-[#FF1F6D]'>New Category</label>
                <div className='mt-2 flex gap-2'>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addProductCategory() } }}
                    placeholder='e.g. Coffee, Pastry, Signature'
                    className='h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#11182E] outline-none focus:border-[#FF1F6D] focus:ring-2 focus:ring-[#FF1F6D]/10'
                  />
                  <button type='button' onClick={addProductCategory} className='rounded-xl bg-[#FF1F6D] px-4 text-sm font-black text-white shadow-lg shadow-pink-100'>Add</button>
                </div>
              </div>

              <div className='space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-[11px] font-black uppercase tracking-wider text-slate-400'>Available Categories</span>
                  <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500'>{productCategories.length}</span>
                </div>
                {productCategories.map((category) => (
                  <div key={category} className='flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm'>
                    <div className='flex items-center gap-3'>
                      <div className='grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-sm font-black text-violet-700'>{category.slice(0, 1)}</div>
                      <div>
                        <div className='text-sm font-black text-[#11182E]'>{category}</div>
                        <div className='text-[10px] font-semibold text-slate-400'>{addCategory === category ? 'Currently selected' : 'Available option'}</div>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => removeProductCategory(category)}
                      className='rounded-xl border border-rose-100 bg-white px-3 py-1.5 text-xs font-black text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40'
                      disabled={productCategories.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <footer className='flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4'>
              <button type='button' onClick={() => setIsCategoryManagerOpen(false)} className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600'>Done</button>
            </footer>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* 3. ASSIGN OUTLETS MODAL */}
      {isAssignOutletsOpen && outletAssignmentProduct && createPortal(
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in'>
          <div className='bg-white rounded-2xl w-full max-w-[760px] shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up'>
            <header className='px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0'>
              <div>
                <h3 className='text-base font-extrabold text-slate-900'>Assign to Outlets</h3>
                <p className='text-xs text-slate-400 font-semibold mt-0.5'>
                  Configure product availability and custom pricing overrides.
                </p>
              </div>
              <button
                onClick={handleCancelAssignOutlets}
                className='p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all cursor-pointer'
              >
                <X size={16} />
              </button>
            </header>

            <div className='p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 flex-1 min-h-0 bg-slate-50/30'>
              {/* Left Column (Select Outlets) */}
              <div className='flex flex-col h-full min-h-0 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm'>
                <label className='block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5'>
                  Select Outlets
                </label>
                
                {/* Search Outlets Input */}
                <div className='relative mb-3 shrink-0'>
                  <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400'>
                    <Search size={13} />
                  </span>
                  <input
                    type='text'
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    placeholder='Search outlets...'
                    className='w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#FF1F6D] text-xs text-slate-700 transition-all font-semibold'
                  />
                </div>

                {/* Select All Checkbox */}
                <div className='py-2 border-b border-slate-100 flex items-center gap-2.5 shrink-0'>
                  <input
                    type='checkbox'
                    checked={
                      outletAssignmentRows.length > 0 &&
                      outletAssignmentRows.every((r) => r.isAvailable)
                    }
                    onChange={(e) => {
                      const val = e.target.checked
                      setOutletAssignmentRows((prev) =>
                        prev.map((r) => ({ ...r, isAvailable: val }))
                      )
                    }}
                    className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4.5 h-4.5 cursor-pointer'
                  />
                  <span className='text-xs font-bold text-slate-800'>Select All</span>
                </div>

                {/* List of checkboxes */}
                <div className='flex-1 overflow-y-auto mt-2 pr-1 space-y-2 max-h-[220px] md:max-h-none'>
                  {outletAssignmentRows
                    .filter((row) =>
                      row.outletName.toLowerCase().includes(assignSearchQuery.toLowerCase())
                    )
                    .map((row) => {
                      return (
                        <label
                          key={row.outletId}
                          className='flex items-center gap-2.5 py-1 cursor-pointer select-none group'
                        >
                          <input
                            type='checkbox'
                            checked={row.isAvailable}
                            onChange={(e) => {
                              const val = e.target.checked
                              setOutletAssignmentRows((prev) =>
                                prev.map((r) =>
                                  r.outletId === row.outletId ? { ...r, isAvailable: val } : r
                                )
                              )
                            }}
                            className='rounded border-slate-300 text-[#FF1F6D] focus:ring-[#FF1F6D] w-4 h-4 cursor-pointer'
                          />
                          <span className='text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors'>
                            {row.outletName}
                          </span>
                        </label>
                      )
                    })}
                </div>

                {/* Count of selected */}
                <div className='mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0'>
                  {outletAssignmentRows.filter((r) => r.isAvailable).length} outlets selected
                </div>
              </div>

              {/* Right Column */}
              <div className='space-y-4 min-h-0 flex flex-col h-full'>
                <div className='bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm shrink-0 space-y-3.5'>
                  <h4 className='text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2'>
                    Bulk Settings
                  </h4>
                  
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {/* Toggle 1: Default Availability */}
                    <div className='flex items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
                      <div>
                        <div className='text-xs font-bold text-slate-800'>Set default availability</div>
                        <div className='text-[10px] font-semibold text-slate-400 mt-0.5'>
                          {bulkAvailability ? 'Available in outlets' : 'Unavailable'}
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          const val = !bulkAvailability
                          setBulkAvailability(val)
                          // Apply to checked outlets
                          setOutletAssignmentRows((prev) =>
                            prev.map((r) => (r.isAvailable ? { ...r, isAvailable: val } : r))
                          )
                        }}
                        className={cx(
                          'relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          bulkAvailability ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      >
                        <span
                          className={cx(
                            'pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            bulkAvailability ? 'translate-x-4.5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>

                    {/* Toggle 2: Use Default Price */}
                    <div className='flex items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
                      <div>
                        <div className='text-xs font-bold text-slate-800'>Use default price</div>
                        <div className='text-[10px] font-semibold text-slate-400 mt-0.5'>
                          {money(outletAssignmentProduct.price)}
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          const val = !bulkUseDefaultPrice
                          setBulkUseDefaultPrice(val)
                          if (val) {
                            // Reset checked outlets' prices to default
                            setOutletAssignmentRows((prev) =>
                              prev.map((r) =>
                                r.isAvailable ? { ...r, price: outletAssignmentProduct.price, isOverride: false } : r
                              )
                            )
                          }
                        }}
                        className={cx(
                          'relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          bulkUseDefaultPrice ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      >
                        <span
                          className={cx(
                            'pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            bulkUseDefaultPrice ? 'translate-x-4.5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown 3: Stock Visibility */}
                  <div className='flex items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100'>
                    <div>
                      <div className='text-xs font-bold text-slate-800'>Stock visibility</div>
                      <div className='text-[10px] font-semibold text-slate-400 mt-0.5'>
                        Visibility state of inventory count
                      </div>
                    </div>
                    <select
                      value={bulkVisibility}
                      onChange={(e) => {
                        const val = e.target.value
                        setBulkVisibility(val)
                        // Apply to checked outlets
                        setOutletAssignmentRows((prev) =>
                          prev.map((r) => (r.isAvailable ? { ...r, visibility: val } : r))
                        )
                      }}
                      className='bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer'
                    >
                      <option value='Show'>Show stock</option>
                      <option value='Hide'>Hide stock</option>
                    </select>
                  </div>
                </div>

                {/* Price Override (Optional) */}
                <div className='bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex-1 min-h-[160px] flex flex-col'>
                  <div className='shrink-0'>
                    <h4 className='text-[11px] font-extrabold text-slate-500 uppercase tracking-wider'>
                      Price Override (Optional)
                    </h4>
                    <p className='text-[10px] text-slate-400 font-semibold mt-0.5 border-b border-slate-100 pb-2.5'>
                      Set custom prices for specific outlets
                    </p>
                  </div>

                  {/* List of checked outlets */}
                  <div className='flex-1 overflow-y-auto min-h-0 pr-1 mt-2 space-y-3 divide-y divide-slate-100/70'>
                    {outletAssignmentRows.filter((r) => r.isAvailable).length === 0 ? (
                      <div className='h-full flex items-center justify-center text-slate-400 text-xs font-semibold py-8'>
                        No outlets selected. Check outlets in the list to configure overrides.
                      </div>
                    ) : (
                      outletAssignmentRows
                        .filter((row) => row.isAvailable)
                        .map((row) => {
                          // Find index in main list
                          const mainIdx = outletAssignmentRows.findIndex((r) => r.outletId === row.outletId)
                          
                          return (
                            <div
                              key={row.outletId}
                              className='pt-3 first:pt-0 flex items-center justify-between gap-4 font-semibold text-slate-700'
                            >
                              <span className='text-xs font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs'>
                                {row.outletName}
                              </span>
                              
                              <div className='flex items-center gap-2 shrink-0'>
                                {/* Price Input Field */}
                                <div className='flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-[#FF1F6D]/20 focus-within:border-[#FF1F6D]'>
                                  <span className='text-[10px] text-slate-400 mr-1 font-bold'>Rp</span>
                                  <input
                                    type='number'
                                    value={row.price}
                                    onChange={(e) => {
                                      const val = Number(e.target.value) || 0
                                      setOutletAssignmentRows((prev) =>
                                        prev.map((r, i) =>
                                          i === mainIdx
                                            ? {
                                                ...r,
                                                price: val,
                                                isOverride: val !== outletAssignmentProduct.price,
                                              }
                                            : r
                                        )
                                      )
                                    }}
                                    className='w-16 bg-transparent text-xs text-slate-700 outline-none font-bold text-right'
                                  />
                                </div>

                                {/* Dropdown status default/override */}
                                <select
                                  value={row.isOverride ? 'override' : 'default'}
                                  onChange={(e) => {
                                    const isOverride = e.target.value === 'override'
                                    setOutletAssignmentRows((prev) =>
                                      prev.map((r, i) =>
                                        i === mainIdx
                                          ? {
                                              ...r,
                                              isOverride,
                                              price: isOverride ? r.price : outletAssignmentProduct.price,
                                            }
                                          : r
                                      )
                                    )
                                  }}
                                  className={cx(
                                    'border rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer focus:outline-none',
                                    row.isOverride
                                      ? 'bg-orange-50 border-orange-100 text-orange-600'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                  )}
                                >
                                  <option value='default'>Default</option>
                                  <option value='override'>Override</option>
                                </select>
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <footer className='px-6 py-4.5 border-t border-slate-100 bg-white flex items-center justify-end gap-3 rounded-b-2xl shrink-0'>
              <button
                onClick={handleCancelAssignOutlets}
                className='px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutletAssignment}
                className='px-5 py-2.5 bg-[#FF1F6D] text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-[#e0155b] transition-all cursor-pointer'
              >
                Assign {outletAssignmentRows.filter((r) => r.isAvailable).length} Outlets
              </button>
            </footer>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* 4. ARCHIVE CONFIRMATION MODAL */}
      {isArchiveConfirmOpen && archiveTarget && createPortal(
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
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
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* 4.5 DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && deleteTarget && createPortal(
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
          <div className='bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border border-slate-100 flex flex-col'>
            <div className='p-6 text-center flex flex-col items-center gap-4.5'>
              <span className='grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 border border-rose-100/50 text-[#FF1F6D]'>
                <Trash2 size={28} />
              </span>
              <div>
                <h3 className='text-base font-extrabold text-slate-900'>
                  Delete Confirmation
                </h3>
                <p className='text-slate-500 text-xs font-semibold mt-2 leading-relaxed'>
                  Are you sure you want to delete product &quot;{deleteTarget.name}&quot;? This action cannot be undone.
                </p>
              </div>
            </div>

            <footer className='px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-3 rounded-b-2xl'>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false)
                  setDeleteTarget(null)
                }}
                className='px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className='px-5 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200/50 hover:bg-rose-700 transition-all'
              >
                Yes, Delete
              </button>
            </footer>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* 5. EXPORT MODAL */}
      {isExportModalOpen && createPortal(
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
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

            <div className='p-6 overflow-y-auto overflow-x-hidden space-y-6 flex-1 min-h-0 text-slate-700 text-sm'>
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
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* ADJUST STOCK MODAL */}
      {isAdjustStockOpen && createPortal(
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]'>
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
                          <option key={item.outlet} value={item.outletId || item.outlet}>
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
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* 6. IMPORT MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onFileDrop={handleFileDrop}
        onFileChange={handleFileChange}
        onDownloadTemplate={handleDownloadTemplate}
        onExecuteImport={handleExecuteImport}
        onClearProducts={() => setImportProductsList([])}
        isImporting={isImporting}
        importProductsList={importProductsList}
        importErrors={importErrors}
        importProgress={importProgress}
        importStatusText={importStatusText}
        money={money}
      />
    </div>
  )
}
