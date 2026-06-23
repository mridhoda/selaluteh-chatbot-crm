import { useMemo, useState, useEffect } from 'react'
import api from '../../../shared/api/httpClient'
import { isDemoMode } from '../../../mocks/demoState'
import kalisStorefront from '../../../assets/kalis_storefront.jpg'
import rinaAvatar from '../../../assets/rina_avatar.jpg'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Globe2,
  Info,
  Layers,
  List,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Store,
  User,
  Users,
  X,
  Zap,
  Instagram,
  Sparkles,
  Activity,
  Check,
  Copy,
  Sliders,
  Calendar,
  Beaker,
} from 'lucide-react'

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  brand: '#F43F70',
  navy: '#11182E',
  violet: '#6956E8',
  green: '#16A34A',
  orange: '#EA7200',
  red: '#DC3545',
  blue: '#2563EB',
  gray50: '#F6F8FB',
  gray100: '#F2F4F8',
  gray200: '#E1E6EF',
  gray500: '#98A2B3',
  gray700: '#667085',
}

/* ─── Dummy data ───────────────────────────────────────────── */
const dummyOutlets = [
  {
    id: 1,
    name: 'Samarinda Central',
    city: 'Samarinda',
    region: 'Kalimantan Timur',
    address: 'Jl. Jenderal Sudirman No. 45, Samarinda Ulu',
    postalCode: '75123',
    manager: 'Rina Pratiwi',
    phone: '0812-3456-7890',
    status: 'Active',
    image: kalisStorefront,
    managerAvatar: rinaAvatar,
    channels: ['WhatsApp', 'Telegram'],
    orders: 42,
    orderChange: 16,
    revenue: 8920000,
    revenueChange: 14,
    rating: 4.8,
    reviews: 128,
    staff: 12,
    sync: '10:15 AM',
    syncState: 'online',
    avgPrep: 18,
    prepChange: -2,
    orderTrend: [
      22, 43, 29, 54, 28, 21, 55, 30, 25, 38, 20, 40, 30, 50, 30, 50, 42,
    ],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Mon - Fri', '08:00 - 22:00'],
      ['Saturday', '08:00 - 23:00'],
      ['Sunday', '08:00 - 22:00'],
    ],
    activity: [
      ['printer', 'Printer offline', '2 min ago'],
      ['sync', 'Menu sync completed', '15 min ago'],
      ['staff', 'New staff invited', '1 hour ago'],
      ['price', 'Price updated (12 items)', '3 hours ago'],
      ['promo', 'Promotions published', '5 hours ago'],
    ],
  },
  {
    id: 2,
    name: 'Tenggarong Riverside',
    city: 'Tenggarong',
    region: 'Kalimantan Timur',
    address: 'Jl. Wolter Monginsidi No. 88',
    postalCode: '75511',
    manager: 'Dewi Lestari',
    phone: '0813-2345-6789',
    status: 'Needs Attention',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 25,
    orderChange: -8,
    revenue: 4350000,
    revenueChange: -4,
    rating: 4.2,
    reviews: 76,
    staff: 8,
    sync: 'Yesterday',
    syncState: 'warning',
    avgPrep: 24,
    prepChange: 3,
    orderTrend: [
      14, 20, 18, 29, 23, 17, 31, 22, 25, 19, 26, 23, 17, 22, 20, 24, 25,
    ],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Mon – Fri', '09:00 – 21:00'],
      ['Saturday', '09:00 – 22:00'],
      ['Sunday', '09:00 – 21:00'],
    ],
    activity: [
      ['warning', 'POS sync delayed', '4 min ago'],
      ['warning', 'Two products unavailable', '24 min ago'],
      ['success', 'Staff shift updated', '1 hour ago'],
    ],
  },
  {
    id: 3,
    name: 'Balikpapan Plaza',
    city: 'Balikpapan',
    region: 'Kalimantan Timur',
    address: 'Balikpapan Plaza Lt. 2, Jl. Ahmad Yani',
    postalCode: '76114',
    manager: 'Budi Santoso',
    phone: '0852-6677-8899',
    status: 'Active',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 56,
    orderChange: 22,
    revenue: 11540000,
    revenueChange: 18,
    rating: 4.7,
    reviews: 203,
    staff: 15,
    sync: '9:48 AM',
    syncState: 'online',
    avgPrep: 16,
    prepChange: -3,
    orderTrend: [
      33, 46, 42, 65, 50, 48, 70, 60, 56, 62, 55, 68, 71, 60, 63, 57, 56,
    ],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Mon – Fri', '08:00 – 22:00'],
      ['Saturday', '08:00 – 23:00'],
      ['Sunday', '08:00 – 22:00'],
    ],
    activity: [
      ['success', 'Daily opening completed', '10 min ago'],
      ['info', 'Stock count submitted', '40 min ago'],
    ],
  },
  {
    id: 4,
    name: 'Bontang Point',
    city: 'Bontang',
    region: 'Kalimantan Timur',
    address: 'Jl. Ahmad Yani No. 12',
    postalCode: '75313',
    manager: 'Andi Wijaya',
    phone: '0811-2233-4455',
    status: 'Coming Soon',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 0,
    orderChange: 0,
    revenue: 0,
    revenueChange: 0,
    rating: null,
    reviews: 0,
    staff: 6,
    sync: '2 days ago',
    syncState: 'info',
    avgPrep: 0,
    prepChange: 0,
    orderTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Opening target', 'July 2026'],
      ['Training', 'In progress'],
    ],
    activity: [
      ['info', 'Staff onboarding started', '1 day ago'],
      ['success', 'Outlet profile completed', '2 days ago'],
    ],
  },
  {
    id: 5,
    name: 'Sangatta Square',
    city: 'Sangatta',
    region: 'Kalimantan Timur',
    address: 'Sangatta Square, Kutai Timur',
    postalCode: '75611',
    manager: 'Nina Marlina',
    phone: '0813-5566-7788',
    status: 'Needs Attention',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 18,
    orderChange: -12,
    revenue: 2810000,
    revenueChange: -6,
    rating: 3.9,
    reviews: 54,
    staff: 7,
    sync: 'Yesterday',
    syncState: 'warning',
    avgPrep: 28,
    prepChange: 6,
    orderTrend: [
      21, 24, 20, 26, 22, 18, 17, 19, 18, 20, 17, 16, 18, 19, 17, 18, 18,
    ],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Mon – Fri', '09:00 – 21:00'],
      ['Saturday', '09:00 – 22:00'],
      ['Sunday', '09:00 – 21:00'],
    ],
    activity: [
      ['warning', 'Rating dropped below 4.0', '25 min ago'],
      ['warning', 'Inventory needs review', '1 hour ago'],
    ],
  },
  {
    id: 6,
    name: 'Berau Town Center',
    city: 'Tanjung Redeb',
    region: 'Kalimantan Timur',
    address: 'Berau Town Center',
    postalCode: '77311',
    manager: 'Fajar Rahman',
    phone: '0812-4477-6655',
    status: 'Active',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 31,
    orderChange: 10,
    revenue: 5620000,
    revenueChange: 8,
    rating: 4.6,
    reviews: 112,
    staff: 9,
    sync: '10:02 AM',
    syncState: 'online',
    avgPrep: 19,
    prepChange: -1,
    orderTrend: [
      18, 23, 25, 33, 28, 24, 37, 34, 31, 29, 33, 36, 30, 32, 31, 29, 31,
    ],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Mon – Fri', '08:00 – 22:00'],
      ['Saturday', '08:00 – 23:00'],
      ['Sunday', '08:00 – 22:00'],
    ],
    activity: [
      ['success', 'Menu sync completed', '9 min ago'],
      ['info', 'Promotion scheduled', '50 min ago'],
    ],
  },
  {
    id: 7,
    name: 'Tarakan Harbor',
    city: 'Tarakan',
    region: 'Kalimantan Utara',
    address: 'Kawasan Pelabuhan Tarakan, Kalimantan Utara',
    postalCode: '77111',
    manager: 'Siti Aminah',
    phone: '0812-9988-7766',
    status: 'Paused',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 5,
    orderChange: -20,
    revenue: 760000,
    revenueChange: -15,
    rating: 4.0,
    reviews: 21,
    staff: 4,
    sync: '3 days ago',
    syncState: 'offline',
    avgPrep: 31,
    prepChange: 8,
    orderTrend: [12, 10, 8, 9, 6, 5, 5, 4, 5, 5, 4, 6, 5, 4, 5, 5, 5],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Status', 'Temporarily paused'],
      ['Review date', '20 Jun 2026'],
    ],
    activity: [
      ['warning', 'Outlet paused by administrator', '3 days ago'],
      ['info', 'Maintenance checklist created', '3 days ago'],
    ],
  },
  {
    id: 8,
    name: 'Nunukan Center',
    city: 'Nunukan',
    region: 'Kalimantan Utara',
    address: 'Jl. Tien Soeharto No. 7',
    postalCode: '77481',
    manager: 'Rudi Hartono',
    phone: '0813-7711-8899',
    status: 'Coming Soon',
    image: kalisStorefront,
    managerAvatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80',
    channels: ['WhatsApp', 'Telegram'],
    orders: 0,
    orderChange: 0,
    revenue: 0,
    revenueChange: 0,
    rating: null,
    reviews: 0,
    staff: 5,
    sync: '4 days ago',
    syncState: 'info',
    avgPrep: 0,
    prepChange: 0,
    orderTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    trendLabels: [
      'May 9',
      'May 10',
      'May 11',
      'May 12',
      'May 13',
      'May 14',
      'May 15',
    ],
    hours: [
      ['Opening target', 'August 2026'],
      ['Recruitment', 'In progress'],
    ],
    activity: [
      ['info', 'Manager account created', '2 days ago'],
      ['success', 'Address verified', '4 days ago'],
    ],
  },
]

/* ─── Status styles ────────────────────────────────────────── */
const statusStyles = {
  Active: {
    badge: 'bg-[#ECFDF5] text-[#15803D]',
    dot: 'bg-[#16A34A]',
  },
  'Needs Attention': {
    badge: 'bg-[#FFF1F2] text-[#DC3545]',
    dot: 'bg-[#DC3545]',
  },
  'Coming Soon': {
    badge: 'bg-[#F5F3FF] text-[#6956E8]',
    dot: 'bg-[#6956E8]',
  },
  Paused: {
    badge: 'bg-[#FFF7E8] text-[#EA7200]',
    dot: 'bg-[#EA7200]',
  },
}

/* ─── Helpers ──────────────────────────────────────────────── */
function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function money(value) {
  if (!value) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, '')
}

/* ─── Micro-components ─────────────────────────────────────── */
function Trend({ value, suffix = '%', inverse = false }) {
  if (!value || value === 0)
    return <span className='text-xs font-semibold text-[#98A2B3]'>—</span>
  const pos = value > 0
  const isGood = inverse ? !pos : pos
  return (
    <span
      className={cx(
        'inline-flex items-center gap-0.5 text-xs font-bold',
        isGood ? 'text-[#16A34A]' : 'text-[#DC3545]'
      )}
    >
      {pos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(value)}
      {suffix}
    </span>
  )
}

function OutletImage({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div
        className={cx(
          'grid place-items-center overflow-hidden bg-[linear-gradient(135deg,#11182E_0%,#6956E8_55%,#F43F70_100%)] select-none shrink-0',
          className
        )}
      >
        <div className='text-center text-white flex flex-col items-center'>
          <Store size={22} className='mx-auto' />
          <span className='mt-1 line-clamp-2 text-[9px] font-semibold leading-tight max-w-[80px] text-center'>
            {name}
          </span>
        </div>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      className={cx('object-cover shrink-0', className)}
      onError={() => setFailed(true)}
    />
  )
}

function StatusBadge({ status }) {
  const style = statusStyles[status] ?? statusStyles.Active
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold',
        style.badge
      )}
    >
      {status}
    </span>
  )
}

function ChannelIcon({ channel, withLabel = false }) {
  const map = {
    WhatsApp: {
      icon: MessageCircle,
      bgLight: 'bg-emerald-50 text-emerald-600',
      bgSolid: 'bg-[#16A34A] text-white',
      label: 'WhatsApp',
    },
    Telegram: {
      icon: Send,
      bgLight: 'bg-sky-50 text-sky-600',
      bgSolid: 'bg-[#2563EB] text-white',
      label: 'Telegram',
    },
    Website: {
      icon: Globe2,
      bgLight: 'bg-violet-50 text-violet-600',
      bgSolid: 'bg-[#6956E8] text-white',
      label: 'Website',
    },
    POS: {
      icon: ShoppingBag,
      bgLight: 'bg-slate-100 text-slate-600',
      bgSolid: 'bg-[#667085] text-white',
      label: 'POS System',
    },
  }

  if (channel === 'POS' && !withLabel) {
    return (
      <span className='inline-flex h-5 items-center justify-center rounded-md bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600 shrink-0 select-none'>
        POS
      </span>
    )
  }

  const current = map[channel] ?? map.Website
  const Icon = current.icon

  if (withLabel) {
    return (
      <div className='flex items-center gap-1.5'>
        <span
          className={cx(
            'inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0',
            current.bgSolid
          )}
        >
          <Icon size={11} strokeWidth={2.5} />
        </span>
        <div className='min-w-0'>
          <p className='m-0 text-xs font-bold text-[#11182E] leading-tight'>
            {current.label}
          </p>
          <p className='m-0 text-[10px] text-[#16A34A] font-semibold mt-0.5'>
            Connected
          </p>
        </div>
      </div>
    )
  }

  return (
    <span
      className={cx(
        'inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0',
        current.bgLight
      )}
      title={channel}
    >
      <Icon size={12} strokeWidth={2.5} />
    </span>
  )
}

function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className='relative min-w-0'>
      <span className='sr-only'>{label}</span>
      {Icon && (
        <Icon
          size={14}
          className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]'
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-10 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white pr-9 text-sm font-bold text-[#11182E] outline-none transition focus:border-[#F43F70] focus:ring-2 focus:ring-[#F43F70]/10',
          Icon ? 'pl-9' : 'pl-3.5'
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]'
      />
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, change, tone }) {
  const tones = {
    green: { icon: 'bg-[#ECFDF5] text-[#15803D]' },
    brand: { icon: 'bg-[#FFF1F2] text-[#DC3545]' },
    violet: { icon: 'bg-[#F5F3FF] text-[#6956E8]' },
    orange: { icon: 'bg-[#FFF7E8] text-[#EA7200]' },
  }
  return (
    <article className='rounded-2xl border border-[#E1E6EF] bg-white p-3.5 shadow-[0_2px_12px_rgba(17,24,46,0.04)] flex items-center gap-3.5'>
      <span
        className={cx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-full',
          tones[tone].icon
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

/* ─── CardMetric: stats row inside outlet card ─────────────── */
function CardMetric({ label, value, trend, detail, dot, star }) {
  const dotClass = {
    online: 'bg-[#16A34A]',
    warning: 'bg-[#EA7200]',
    offline: 'bg-[#DC3545]',
    info: 'bg-[#6956E8]',
  }
  return (
    <div className='min-w-0 px-2.5 first:pl-0 last:pr-0'>
      <p className='m-0 truncate text-[11px] font-semibold text-[#98A2B3]'>
        {label}
      </p>
      <div className='mt-0.5 flex min-w-0 items-center gap-1 flex-wrap'>
        <span className='truncate text-xs font-extrabold text-[#11182E]'>
          {value}
        </span>
        {star && (
          <span className='text-amber-500 font-bold text-xs select-none'>
            ★
          </span>
        )}
        {typeof trend === 'number' && trend !== 0 && <Trend value={trend} />}
        {detail && (
          <span className='text-[11px] font-semibold text-[#98A2B3]'>
            {detail}
          </span>
        )}
        {dot && (
          <span
            className={cx(
              'h-1.5 w-1.5 shrink-0 rounded-full ml-0.5',
              dotClass[dot]
            )}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Outlet card (grid item) ──────────────────────────────── */
function OutletCard({ outlet, selected, onSelect }) {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onSelect(outlet)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(outlet)
        }
      }}
      className={cx(
        'w-full min-w-0 box-border rounded-2xl border p-3 text-left transition-all duration-150 outline-none cursor-pointer',
        'hover:border-[#F43F70]/40 hover:shadow-[0_8px_28px_rgba(17,24,46,0.07)]',
        selected
          ? 'border-[#F43F70] bg-[#FFF5F7]/30 shadow-[0_0_0_1px_#F43F70,0_4px_20px_rgba(244,63,112,0.06)]'
          : 'border-[#E1E6EF] bg-white shadow-[0_2px_8px_rgba(17,24,46,0.03)]'
      )}
    >
      {/* Top: image + info + actions */}
      <div className='flex gap-3'>
        <OutletImage
          src={outlet.image}
          name={outlet.name}
          className='h-[60px] w-[72px] rounded-xl border border-[#E1E6EF]'
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <h3 className='m-0 truncate text-sm font-bold text-[#11182E] tracking-tight'>
                {outlet.name}
              </h3>
              <p className='m-0 mt-0.5 truncate text-xs text-[#667085] font-semibold'>
                {outlet.city}, {outlet.region}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-1.5'>
              <StatusBadge status={outlet.status} />
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className='grid h-7 w-7 place-items-center rounded-lg text-[#98A2B3] hover:bg-[#F2F4F8] hover:text-[#667085] transition-colors'
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Channel icons + manager */}
          <div className='mt-1.5 flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1'>
              {outlet.channels.map((ch) => (
                <ChannelIcon key={ch} channel={ch} />
              ))}
            </div>
            <span className='h-3 w-px bg-[#E1E6EF]' />
            <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085]'>
              <img
                src={
                  outlet.managerAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(outlet.manager)}&background=11182e&color=ffffff&size=32`
                }
                alt={outlet.manager}
                className='h-4.5 w-4.5 rounded-full object-cover shrink-0 border border-[#E1E6EF]'
              />
              {outlet.manager}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className='mt-2.5 grid grid-cols-5 divide-x divide-[#E1E6EF] border-t border-[#E1E6EF] pt-2.5'>
        <CardMetric
          label="Today's Orders"
          value={outlet.orders}
          trend={outlet.orderChange}
        />
        <CardMetric
          label='Revenue'
          value={money(outlet.revenue)}
          trend={outlet.revenueChange}
        />
        <CardMetric
          label='Rating'
          value={outlet.rating ? `${outlet.rating}` : '—'}
          detail={outlet.reviews ? `(${outlet.reviews})` : ''}
          star={!!outlet.rating}
        />
        <CardMetric label='Staff' value={outlet.staff} />
        <CardMetric
          label='Last Sync'
          value={outlet.sync}
          dot={outlet.syncState}
        />
      </div>
    </div>
  )
}

/* ─── Mini SVG line chart ──────────────────────────────────── */
function MiniLineChart({ values, labels }) {
  const data = values.slice(-7)
  const W = 380
  const H = 145
  const PAD_T = 20
  const PAD_B = 25
  const PAD_L = 32 // Fit Y-axis text
  const PAD_R = 20

  const max = 80
  const min = 0
  const range = max - min

  const pts = data.map((v, i) => {
    const x = PAD_L + (i / 6) * (W - PAD_L - PAD_R)
    const y = H - PAD_B - ((v - min) / range) * (H - PAD_T - PAD_B)
    return { x, y, val: v }
  })

  const pathD = pts
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')
  const areaD =
    pts.length > 0
      ? `${pathD} L ${pts[pts.length - 1].x} ${H - PAD_B} L ${pts[0].x} ${H - PAD_B} Z`
      : ''
  const lastPt = pts[pts.length - 1]

  const yTicks = [80, 60, 40, 20, 0]

  return (
    <div className='mt-4 overflow-hidden rounded-xl bg-white py-2'>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className='w-full h-auto'
        role='img'
        aria-label='Order trend'
      >
        <defs>
          <linearGradient id='chartAreaGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#6956E8' stopOpacity='0.12' />
            <stop offset='100%' stopColor='#6956E8' stopOpacity='0.00' />
          </linearGradient>
        </defs>

        {yTicks.map((val) => {
          const ratio = (val - min) / range
          const y = H - PAD_B - ratio * (H - PAD_T - PAD_B)
          return (
            <g key={val}>
              <text
                x={PAD_L - 8}
                y={y + 3.5}
                fill='#98A2B3'
                fontSize='9.5'
                fontWeight='600'
                textAnchor='end'
              >
                {val}
              </text>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke='#E1E6EF'
                strokeWidth='0.8'
                strokeDasharray='4 4'
              />
            </g>
          )
        })}

        {areaD && <path d={areaD} fill='url(#chartAreaGradient)' />}

        <path
          d={pathD}
          fill='none'
          stroke={C.violet}
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />

        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r='4.5'
            fill='white'
            stroke={C.violet}
            strokeWidth='2.5'
          />
        ))}

        {lastPt && (
          <g>
            <rect
              x={lastPt.x - 12}
              y={lastPt.y - 25}
              width='24'
              height='16'
              rx='8'
              fill={C.violet}
            />
            <text
              x={lastPt.x}
              y={lastPt.y - 14}
              fill='white'
              fontSize='10'
              fontWeight='bold'
              textAnchor='middle'
            >
              {lastPt.val}
            </text>
            <path
              d={`M ${lastPt.x - 3} ${lastPt.y - 9} L ${lastPt.x + 3} ${lastPt.y - 9} L ${lastPt.x} ${lastPt.y - 5} Z`}
              fill={C.violet}
            />
          </g>
        )}

        {labels.map((lbl, i) => {
          const x = PAD_L + (i / 6) * (W - PAD_L - PAD_R)
          return (
            <text
              key={lbl}
              x={x}
              y={H - 6}
              fill='#98A2B3'
              fontSize='9.5'
              fontWeight='600'
              textAnchor='middle'
            >
              {lbl}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Activity icon ────────────────────────────────────────── */
function ActivityIcon({ type }) {
  const map = {
    printer: { icon: AlertTriangle, className: 'bg-red-50 text-[#DC3545]' },
    sync: { icon: CheckCircle2, className: 'bg-emerald-50 text-[#16A34A]' },
    staff: { icon: User, className: 'bg-purple-50 text-[#6956E8]' },
    price: { icon: Info, className: 'bg-blue-50 text-[#2563EB]' },
    promo: { icon: Megaphone, className: 'bg-amber-50 text-[#EA7200]' },
  }
  const cur = map[type] ?? map.price
  const Icon = cur.icon
  return (
    <span
      className={cx(
        'grid h-6 w-6 shrink-0 place-items-center rounded-full',
        cur.className
      )}
    >
      <Icon size={13} />
    </span>
  )
}

function DetailMetric({ label, value, trend, suffix = '%', inverse = false }) {
  return (
    <article className='rounded-2xl border border-[#E1E6EF] bg-white px-2 py-3 shadow-[0_1px_3px_rgba(17,24,46,0.02)]'>
      <p className='m-0 text-xs font-bold text-[#667085] leading-none'>
        {label}
      </p>
      <p
        className='m-0 mt-2 text-sm font-extrabold text-[#11182E] tracking-tight leading-none whitespace-nowrap'
        title={value}
      >
        {value}
      </p>
      <div className='mt-2.5 flex items-center leading-none'>
        <Trend value={trend} suffix={suffix} inverse={inverse} />
      </div>
    </article>
  )
}

/* ─── Right Detail Panel ───────────────────────────────────── */
function DetailPanel({ outlet, onClose, mobile = false, onManageChannels }) {
  if (!outlet) {
    return (
      <aside className='h-full bg-white flex flex-col items-center justify-center text-center p-6 text-[#667085] relative'>
        <div className='absolute top-4 right-4'>
          <button
            type='button'
            onClick={onClose}
            className='grid h-8 w-8 place-items-center text-[#98A2B3] transition hover:text-[#11182E]'
            title='Hide outlet details'
          >
            <X size={18} />
          </button>
        </div>
        <div className='flex flex-col items-center gap-2'>
          <div className='w-12 h-12 rounded-full bg-[#F6F8FB] flex items-center justify-center text-[#667085] mb-2 border border-dashed border-[#E1E6EF] text-lg'>
            🏪
          </div>
          <div className='text-sm font-semibold text-[#11182E]'>
            No Outlet Selected
          </div>
          <div className='text-xs text-[#667085] max-w-[240px]'>
            Click on any outlet in the table to view its full details here.
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
          ? 'fixed inset-y-0 right-0 z-50 w-full max-w-[420px] shadow-2xl'
          : 'h-full overflow-hidden'
      )}
    >
      {/* Sticky Header */}
      <header className='shrink-0 bg-white z-10'>
        {/* Name + status + close */}
        <div className='flex items-center justify-between gap-3 px-6 pt-5 pb-1'>
          <div className='flex items-center gap-2 min-w-0'>
            <h2 className='truncate text-lg font-bold text-[#11182E] tracking-tight'>
              {outlet.name}
            </h2>
            <StatusBadge status={outlet.status} />
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close detail panel'
            className='grid h-8 w-8 shrink-0 place-items-center text-[#98A2B3] transition hover:text-[#11182E]'
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Scrollable body */}
      <div className='min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6 space-y-4'>
        {/* Image + manager + address block */}
        <div className='grid grid-cols-[105px_1fr] gap-5'>
          <OutletImage
            src={outlet.image}
            name={outlet.name}
            className='h-[105px] w-[105px] rounded-2xl border border-[#E1E6EF] shadow-[0_1px_3px_rgba(17,24,46,0.04)]'
          />
          <div className='min-w-0 space-y-2.5'>
            <div>
              <p className='m-0 mb-1.5 text-xs font-bold text-[#667085]'>
                Outlet Manager
              </p>
              <div className='flex items-center gap-3'>
                <img
                  src={
                    outlet.managerAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(outlet.manager)}&background=11182e&color=ffffff&size=48`
                  }
                  alt={outlet.manager}
                  className='h-8 w-8 rounded-full object-cover shrink-0 border border-[#E1E6EF]'
                />
                <div className='min-w-0'>
                  <p className='m-0 truncate text-sm font-bold text-[#11182E] leading-tight'>
                    {outlet.manager}
                  </p>
                  <p className='m-0 text-xs text-[#667085] mt-0.5 font-semibold flex items-center gap-1'>
                    <Phone size={11} className='text-[#98A2B3]' />
                    {outlet.phone}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className='m-0 mb-1.5 text-xs font-bold text-[#667085]'>
                Address
              </p>
              <div className='flex items-start gap-2'>
                <MapPin size={13} className='mt-0.5 shrink-0 text-[#98A2B3]' />
                <p className='m-0 text-xs leading-relaxed text-[#667085] font-semibold flex-1 min-w-0'>
                  {outlet.address}, {outlet.city}, {outlet.region}{' '}
                  {outlet.postalCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected channels */}
        <section className='border-t border-b border-[#F2F4F8] py-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-bold text-[#11182E]'>
              Connected Channels
            </h3>
            <button
              type='button'
              onClick={() => onManageChannels(outlet)}
              className='text-xs font-bold text-[#6956E8] hover:underline'
            >
              Manage
            </button>
          </div>
          <div className='mt-3 flex items-center gap-6'>
            {outlet.channels.map((ch) => (
              <ChannelIcon key={ch} channel={ch} withLabel />
            ))}
          </div>
        </section>

        {/* 3-metric grid */}
        <div className='grid grid-cols-3 gap-3'>
          <DetailMetric
            label="Today's Orders"
            value={outlet.orders}
            trend={outlet.orderChange}
          />
          <DetailMetric
            label='Revenue (Today)'
            value={money(outlet.revenue)}
            trend={outlet.revenueChange}
          />
          <DetailMetric
            label='Avg. Prep Time'
            value={outlet.avgPrep ? `${outlet.avgPrep} min` : '—'}
            trend={outlet.prepChange}
            suffix=' min'
            inverse={true}
          />
        </div>

        {/* Chart */}
        <section>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-extrabold text-[#11182E] tracking-tight'>
                Orders (Last 7 Days)
              </h3>
            </div>
            <button
              type='button'
              className='inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#E1E6EF] px-3 text-xs font-semibold text-[#11182E] hover:bg-[#F6F8FB] transition-colors'
            >
              Orders <ChevronDown size={13} />
            </button>
          </div>
          <MiniLineChart
            values={outlet.orderTrend}
            labels={outlet.trendLabels}
          />
        </section>

        {/* Operating hours + Activity side-by-side */}
        <div className='grid grid-cols-[43%_57%] gap-3'>
          <section className='rounded-2xl border border-[#E1E6EF] p-2 bg-white shadow-[0_1px_3px_rgba(17,24,46,0.02)] flex flex-col justify-between'>
            <div>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-extrabold text-[#11182E] tracking-tight'>
                  Operating Hours
                </h3>
                <button
                  type='button'
                  className='text-xs font-bold text-[#6956E8] hover:underline'
                >
                  Edit
                </button>
              </div>
              <div className='mt-3.5 space-y-2'>
                {outlet.hours.map(([day, time]) => (
                  <div
                    key={day}
                    className='flex items-center justify-between gap-1 text-xs tracking-tight'
                  >
                    <span className='text-[#667085] font-semibold'>{day}</span>
                    <span className='font-bold text-[#11182E] whitespace-nowrap'>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className='rounded-2xl border border-[#E1E6EF] p-2 bg-white shadow-[0_1px_3px_rgba(17,24,46,0.02)]'>
            <h3 className='text-sm font-extrabold text-[#11182E] tracking-tight'>
              Recent Activity
            </h3>
            <div className='mt-3.5 space-y-2.5'>
              {outlet.activity.slice(0, 5).map(([type, label, time]) => (
                <div
                  key={`${label}-${time}`}
                  className='flex items-center justify-between gap-1 text-xs'
                >
                  <div className='flex items-center gap-1 min-w-0'>
                    <ActivityIcon type={type} />
                    <span className='font-bold text-[#11182E] text-xs tracking-tight truncate'>
                      {label}
                    </span>
                  </div>
                  <span className='text-[#98A2B3] shrink-0 font-semibold text-[10px] whitespace-nowrap'>
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Action buttons */}
        <div className='grid grid-cols-3 gap-2.5 border-t border-[#E1E6EF] pt-4'>
          <button
            type='button'
            className='inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#F43F70] px-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(244,63,112,0.22)] transition hover:bg-[#e62e63] active:scale-[0.98]'
          >
            View Details <ExternalLink size={14} />
          </button>
          <button
            type='button'
            className='inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#D6DCE8] bg-white px-2 text-sm font-bold text-[#11182E] transition hover:bg-[#F2F4F8] active:scale-[0.98]'
          >
            <Edit3 size={14} /> Edit Outlet
          </button>
          <button
            type='button'
            className='inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#6956E8] px-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(105,86,232,0.22)] transition hover:bg-[#5e49da] active:scale-[0.98]'
          >
            <List size={14} /> Open Orders
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function OutletsPage() {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All Regions')
  const [status, setStatus] = useState('All Statuses')
  const [channel, setChannel] = useState('All Channels')
  const [activeTab, setActiveTab] = useState('All')
  const [sort, setSort] = useState('Default')
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOutlet, setSelectedOutlet] = useState(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(true)

  // Manage Connected Channels Modal states
  const [isManageChannelsOpen, setIsManageChannelsOpen] = useState(false)
  const [outletForChannels, setOutletForChannels] = useState(null)
  const [activeChannelsTab, setActiveChannelsTab] = useState('Connected Channels')
  const [isInstagramHealthy, setIsInstagramHealthy] = useState(false)
  const [channelStates, setChannelStates] = useState({
    whatsapp: true,
    telegram: true,
    website: true,
    instagram: true,
    tokopedia: false,
    shopee: false,
  })

  // Channel Settings states
  const [channelSettings, setChannelSettings] = useState({
    whatsapp: {
      enabled: true,
      acceptChats: true,
      acceptOrders: true,
      aiHandling: 'default',
      humanTeam: 'cs_team',
      outsideHours: 'auto_reply_human',
      fallbackMessage: 'Terima kasih! Kami telah menerima pesan Anda. Tim kami akan segera membantu.',
    },
    telegram: {
      enabled: true,
      acceptChats: true,
      acceptOrders: true,
      aiHandling: 'disabled',
      humanTeam: 'cs_team',
      outsideHours: 'auto_reply_human',
      fallbackMessage: 'Terima kasih! Kami akan membalas pesan Anda saat jam operasional.',
    },
    website: {
      enabled: true,
      acceptChats: true,
      acceptOrders: true,
      aiHandling: 'override',
      humanTeam: 'website_team',
      outsideHours: 'auto_reply_human',
      fallbackMessage: "Thanks! We've received your message and will get back to you shortly.",
    }
  })

  const [pickupDay, setPickupDay] = useState('Every day')
  const [pickupStart, setPickupStart] = useState('09:00')
  const [pickupEnd, setPickupEnd] = useState('21:00')

  const [orderDay, setOrderDay] = useState('Every day')
  const [orderStart, setOrderStart] = useState('09:00')
  const [orderEnd, setOrderEnd] = useState('20:45')

  // Webhooks tab states
  const [webhookChannel, setWebhookChannel] = useState('All Channels')
  const [webhookStatus, setWebhookStatus] = useState('All Statuses')
  const [webhookEventType, setWebhookEventType] = useState('All Event Types')
  const [webhookTimeRange, setWebhookTimeRange] = useState('Last 24 Hours')
  const [webhookSearch, setWebhookSearch] = useState('')

  // Activity Log tab states
  const [activityChannel, setActivityChannel] = useState('All Channels')
  const [activityActor, setActivityActor] = useState('All Actors')
  const [activityType, setActivityType] = useState('All Types')
  const [activitySearch, setActivitySearch] = useState('')
  const [selectedActivity, setSelectedActivity] = useState(0)

  useEffect(() => {
    loadOutlets()
  }, [])

  const loadOutlets = async () => {
    setLoading(true)
    try {
      if (isDemoMode()) {
        setOutlets(dummyOutlets)
      } else {
        const res = await api.get('/outlets')
        const rawOutlets = Array.isArray(res.data)
          ? res.data
          : res.data && Array.isArray(res.data.data)
            ? res.data.data
            : []

        const mappedOutlets = rawOutlets.map((o, idx) => ({
          id: o.id || o._id,
          _id: o.id || o._id,
          name: o.name,
          city: o.city || 'Makassar',
          region: o.region || 'Sulawesi',
          status:
            o.status === 'active'
              ? 'Active'
              : o.status === 'needs_attention'
                ? 'Needs Attention'
                : o.status === 'coming_soon'
                  ? 'Coming Soon'
                  : 'Paused',
          manager: o.manager || 'Agus',
          orders: o.orders || 0,
          revenue: o.revenue || 0,
          rating: o.rating || 4.5,
          staff: o.staff || 5,
          sync: o.updated_at
            ? new Date(o.updated_at).toLocaleTimeString()
            : 'Just now',
          image: o.image || `/images/outlets/outlet-${(idx % 4) + 1}.png`,
          channels: o.channels || ['whatsapp', 'telegram'],
          address: o.address || '-',
          phone: o.phone || '-',
          salesTrend: o.salesTrend || [0, 0, 0, 0, 0, 0],
          reconciliationStatus: o.reconciliationStatus || 'Reconciled',
          discrepancyCount: o.discrepancyCount || 0,
          hours:
            o.opening_hours && Object.keys(o.opening_hours).length > 0
              ? Object.entries(o.opening_hours)
              : [
                  ['Mon - Fri', '08:00 - 22:00'],
                  ['Saturday', '08:00 - 23:00'],
                  ['Sunday', '08:00 - 22:00'],
                ],
          activity: o.activity || [
            ['sync', 'Menu sync completed', '15 min ago'],
            ['printer', 'Printer online', 'Just now'],
          ],
          orderTrend: o.orderTrend || [
            22, 43, 29, 54, 28, 21, 55, 30, 25, 38, 20, 40, 30, 50, 30, 50, 42,
          ],
          trendLabels: o.trendLabels || [
            'May 9',
            'May 10',
            'May 11',
            'May 12',
            'May 13',
            'May 14',
            'May 15',
          ],
        }))
        setOutlets(mappedOutlets)
      }
    } catch (err) {
      console.error('Failed to load outlets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutlet) {
      setSelectedOutlet(outlets[0])
    }
  }, [outlets])

  const counts = useMemo(
    () => ({
      All: outlets.length,
      Active: outlets.filter((o) => o.status === 'Active').length,
      'Needs Attention': outlets.filter((o) => o.status === 'Needs Attention')
        .length,
      'Coming Soon': outlets.filter((o) => o.status === 'Coming Soon').length,
      Paused: outlets.filter((o) => o.status === 'Paused').length,
    }),
    [outlets]
  )

  const filteredOutlets = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = outlets.filter((o) => {
      if (
        q &&
        !o.name.toLowerCase().includes(q) &&
        !o.city.toLowerCase().includes(q) &&
        !o.manager.toLowerCase().includes(q)
      )
        return false
      if (region !== 'All Regions' && o.region !== region) return false
      if (status !== 'All Statuses' && o.status !== status) return false
      if (channel !== 'All Channels' && !o.channels.includes(channel))
        return false
      if (activeTab !== 'All' && o.status !== activeTab) return false
      return true
    })
    if (sort === 'Default') return result
    return [...result].sort((a, b) => {
      if (sort === 'A–Z') return a.name.localeCompare(b.name)
      if (sort === 'Z–A') return b.name.localeCompare(a.name)
      if (sort === 'Orders') return b.orders - a.orders
      if (sort === 'Revenue') return b.revenue - a.revenue
      return 0
    })
  }, [search, region, status, channel, activeTab, sort, outlets])

  const chooseOutlet = (outlet) => {
    setSelectedOutlet(outlet)
    setIsDetailOpen(true)
    setMobileDetailOpen(true)
  }

  const openManageChannelsModal = (outlet) => {
    const targetOutlet = (outlet && outlet.id) ? outlet : selectedOutlet
    if (!targetOutlet) return
    setOutletForChannels(targetOutlet)
    const channelsList = targetOutlet.channels || []
    
    const hasWhatsapp = channelsList.some(c => c.toLowerCase() === 'whatsapp')
    const hasTelegram = channelsList.some(c => c.toLowerCase() === 'telegram')
    const hasWebsite = channelsList.some(c => c.toLowerCase() === 'website' || c.toLowerCase() === 'online ordering (web)' || c.toLowerCase() === 'online ordering')
    const hasInstagram = channelsList.some(c => c.toLowerCase() === 'instagram')
    const hasTokopedia = channelsList.some(c => c.toLowerCase() === 'tokopedia')
    const hasShopee = channelsList.some(c => c.toLowerCase() === 'shopee')

    setChannelStates({
      whatsapp: hasWhatsapp,
      telegram: hasTelegram,
      website: hasWebsite,
      instagram: hasInstagram,
      tokopedia: hasTokopedia,
      shopee: hasShopee,
    })

    setChannelSettings({
      whatsapp: {
        enabled: hasWhatsapp,
        acceptChats: hasWhatsapp,
        acceptOrders: hasWhatsapp,
        aiHandling: 'default',
        humanTeam: 'cs_team',
        outsideHours: 'auto_reply_human',
        fallbackMessage: 'Terima kasih! Kami telah menerima pesan Anda. Tim kami akan segera membantu.',
      },
      telegram: {
        enabled: hasTelegram,
        acceptChats: hasTelegram,
        acceptOrders: hasTelegram,
        aiHandling: 'disabled',
        humanTeam: 'cs_team',
        outsideHours: 'auto_reply_human',
        fallbackMessage: 'Terima kasih! Kami akan membalas pesan Anda saat jam operasional.',
      },
      website: {
        enabled: hasWebsite,
        acceptChats: hasWebsite,
        acceptOrders: hasWebsite,
        aiHandling: 'override',
        humanTeam: 'website_team',
        outsideHours: 'auto_reply_human',
        fallbackMessage: "Thanks! We've received your message and will get back to you shortly.",
      }
    })

    // Store hours parser (e.g. from outlet hours like "09:00 - 21:00")
    let storeHoursText = "09:00 - 21:00"
    if (targetOutlet.hours && targetOutlet.hours.length > 0) {
      const match = targetOutlet.hours[0]
      if (match && match[1]) {
        storeHoursText = match[1]
      }
    }
    const [hStart, hEnd] = storeHoursText.split(' - ')
    setPickupStart(hStart || '09:00')
    setPickupEnd(hEnd || '21:00')
    setPickupDay('Every day')

    setOrderStart(hStart || '09:00')
    // Set default order close time to be 15 mins before store closes
    if (hEnd) {
      const [h, m] = hEnd.split(':').map(Number)
      let closeMin = m - 15
      let closeHour = h
      if (closeMin < 0) {
        closeMin += 60
        closeHour -= 1
      }
      const formattedClose = `${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`
      setOrderEnd(formattedClose)
    } else {
      setOrderEnd('20:45')
    }
    setOrderDay('Every day')

    setIsInstagramHealthy(targetOutlet.status !== 'Needs Attention')
    setActiveChannelsTab('Connected Channels')
    setIsManageChannelsOpen(true)
  }

  const toggleChannelSetting = (channelKey, settingKey) => {
    setChannelSettings(prev => {
      const nextVal = !prev[channelKey][settingKey]
      const updated = {
        ...prev,
        [channelKey]: {
          ...prev[channelKey],
          [settingKey]: nextVal
        }
      }
      if (settingKey === 'enabled') {
        setChannelStates(prevStates => ({
          ...prevStates,
          [channelKey]: nextVal
        }))
      }
      return updated
    })
  }

  const setChannelDropdownSetting = (channelKey, settingKey, value) => {
    setChannelSettings(prev => ({
      ...prev,
      [channelKey]: {
        ...prev[channelKey],
        [settingKey]: value
      }
    }))
  }

  const setChannelConnected = (channelKey, isConnected) => {
    setChannelStates(prev => ({ ...prev, [channelKey]: isConnected }))
    setChannelSettings(prev => {
      if (prev[channelKey]) {
        return {
          ...prev,
          [channelKey]: {
            ...prev[channelKey],
            enabled: isConnected
          }
        }
      }
      return prev
    })
  }

  const handleSaveChannels = async () => {
    if (!outletForChannels) return

    const updatedChannels = []
    if (channelSettings.whatsapp.enabled) updatedChannels.push('WhatsApp')
    if (channelSettings.telegram.enabled) updatedChannels.push('Telegram')
    if (channelSettings.website.enabled) updatedChannels.push('Website')
    if (channelStates.instagram) updatedChannels.push('Instagram')
    if (channelStates.tokopedia) updatedChannels.push('Tokopedia')
    if (channelStates.shopee) updatedChannels.push('Shopee')

    let newStatus = outletForChannels.status
    if (outletForChannels.status === 'Needs Attention' && (!channelStates.instagram || isInstagramHealthy)) {
      newStatus = 'Active'
    } else if (channelStates.instagram && !isInstagramHealthy) {
      newStatus = 'Needs Attention'
    }

    const updatedOutlet = {
      ...outletForChannels,
      channels: updatedChannels,
      status: newStatus
    }

    setOutlets(prev => prev.map(o => o.id === outletForChannels.id ? updatedOutlet : o))
    
    if (selectedOutlet?.id === outletForChannels.id) {
      setSelectedOutlet(updatedOutlet)
    }

    if (!isDemoMode()) {
      try {
        await api.put(`/outlets/${outletForChannels.id}`, {
          ...outletForChannels,
          channels: updatedChannels.map(c => c.toLowerCase()),
          status: newStatus.toLowerCase().replace(' ', '_')
        })
      } catch (err) {
        console.error('Failed to save channels to server:', err)
      }
    }

    setIsManageChannelsOpen(false)
    setOutletForChannels(null)
  }

  const exportCsv = () => {
    const header = [
      'Outlet',
      'City',
      'Region',
      'Status',
      'Manager',
      'Orders',
      'Revenue',
      'Rating',
      'Staff',
      'Last Sync',
    ]
    const rows = filteredOutlets.map((o) => [
      o.name,
      o.city,
      o.region,
      o.status,
      o.manager,
      o.orders,
      o.revenue,
      o.rating ?? '',
      o.staff,
      o.sync,
    ])
    const csv = [header, ...rows]
      .map((row) =>
        row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kalis-outlets.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='flex flex-1 overflow-hidden bg-[#F6F8FB] text-[#11182E] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)]'>
      {/* Desktop main content list layout */}
      <div
        className={cx(
          'flex-1 min-w-0 h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 transition-[margin] duration-200',
          isDetailOpen ? 'xl:mr-[440px]' : ''
        )}
      >
        <div className='mx-auto max-w-[1300px] pb-12'>
          {/* ── Page Header ── */}
          <header className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-col'>
              <h1 className='m-0 text-3xl font-extrabold tracking-tight text-[#11182E] leading-none'>
                Outlets
              </h1>
              <p className='m-0 mt-1 text-sm text-[#667085] font-semibold leading-none'>
                Manage all connected outlets across your marketplace
              </p>
            </div>
            <div className='flex flex-wrap gap-2 shrink-0'>
              {!isDetailOpen && selectedOutlet && (
                <button
                  type='button'
                  onClick={() => setIsDetailOpen(true)}
                  className='inline-flex h-11 items-center gap-2 rounded-xl border border-[#D6DCE8] bg-white px-3 text-sm font-bold text-[#11182E] transition hover:border-[#F43F70] hover:text-[#F43F70] active:scale-[0.98]'
                  title='Show outlet details'
                >
                  <Info size={16} />
                  <span>{selectedOutlet.name}</span>
                </button>
              )}
              <button
                type='button'
                onClick={exportCsv}
                className='inline-flex h-11 items-center gap-2 rounded-xl border border-[#D6DCE8] bg-white px-4 text-sm font-bold text-[#11182E] transition hover:bg-[#F2F4F8] active:scale-[0.98]'
              >
                <Download size={16} /> Export
              </button>
              <button
                type='button'
                className='inline-flex h-11 items-center gap-2 rounded-xl bg-[#F43F70] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,63,112,0.24)] transition hover:bg-[#e62e63] active:scale-[0.98]'
              >
                <Plus size={18} /> Add Outlet
              </button>
            </div>
          </header>

          {/* ── Filter bar ── */}
          <section className='mt-2 flex flex-col gap-3 lg:flex-row lg:items-center'>
            <div className='flex flex-wrap gap-2.5 flex-1 min-w-0'>
              <div className='w-[160px] shrink-0'>
                <FilterSelect
                  label='Region'
                  value={region}
                  onChange={setRegion}
                  options={[
                    'All Regions',
                    'Kalimantan Timur',
                    'Kalimantan Utara',
                  ]}
                  icon={Globe2}
                />
              </div>
              <div className='w-[160px] shrink-0'>
                <FilterSelect
                  label='Status'
                  value={status}
                  onChange={setStatus}
                  options={[
                    'All Statuses',
                    'Active',
                    'Needs Attention',
                    'Coming Soon',
                    'Paused',
                  ]}
                  icon={MessageCircle}
                />
              </div>
              <div className='w-[160px] shrink-0'>
                <FilterSelect
                  label='Channel'
                  value={channel}
                  onChange={setChannel}
                  options={['All Channels', 'WhatsApp', 'Telegram']}
                  icon={Layers}
                />
              </div>
              <label className='relative flex-1 min-w-[240px]'>
                <span className='sr-only'>Search outlet</span>
                <Search
                  size={16}
                  className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]'
                />
                <input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search outlet name, city, manager...'
                  autoComplete='off'
                  autoCorrect='off'
                  spellCheck={false}
                  className='h-10 w-full rounded-xl border border-[#E1E6EF] bg-white pl-10 pr-4 text-sm text-[#11182E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#F43F70] focus:ring-2 focus:ring-[#F43F70]/10'
                />
              </label>
            </div>
          </section>

          {/* ── Info bar ── */}
          <div className='mt-3 flex items-center justify-between rounded-xl border border-[#E1E6EF] bg-[#F6F8FB]/50 px-4 py-2 text-xs text-[#667085]'>
            <div className='flex flex-wrap items-center gap-2 font-medium'>
              <span>
                Showing:{' '}
                <strong className='text-[#11182E]'>
                  {activeTab === 'All' ? 'All Outlets' : activeTab}
                </strong>
              </span>
              <span className='text-[#D6DCE8]'>•</span>
              <span>
                Region:{' '}
                <strong className='text-[#11182E]'>
                  {region === 'All Regions' ? 'All' : region}
                </strong>
              </span>
              <span className='text-[#D6DCE8]'>•</span>
              <span>Last updated: 10:25 AM</span>
            </div>
            <button
              type='button'
              className='grid h-6 w-6 place-items-center rounded-lg text-[#98A2B3] hover:bg-[#E1E6EF] hover:text-[#667085] transition-colors'
              title='Refresh data'
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* ── Summary cards ── */}
          <section className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <SummaryCard
              icon={Store}
              label='Total Outlets'
              value={counts.All}
              change={12}
              tone='green'
            />
            <SummaryCard
              icon={CheckCircle2}
              label='Active'
              value={counts.Active}
              change={15}
              tone='green'
            />
            <SummaryCard
              icon={AlertTriangle}
              label='Needs Attention'
              value={counts['Needs Attention']}
              change={20}
              tone='brand'
            />
            <SummaryCard
              icon={Clock3}
              label='Coming Soon'
              value={counts['Coming Soon']}
              change={33}
              tone='violet'
            />
          </section>

          {/* ── Tabs + Sort ── */}
          <div className='mt-5 flex items-center justify-between border-b border-[#E1E6EF]'>
            <div className='flex min-w-0 gap-6 overflow-x-auto pb-px'>
              {Object.entries(counts).map(([tab, count]) => {
                const isActive = activeTab === tab
                const badgeStyles = {
                  All: 'bg-[#FFF1F5] text-[#F43F70]',
                  Active: 'bg-[#ECFDF5] text-[#15803D]',
                  'Needs Attention': 'bg-[#FFF1F2] text-[#DC3545]',
                  'Coming Soon': 'bg-[#F5F3FF] text-[#6956E8]',
                  Paused: 'bg-[#FFF7E8] text-[#EA7200]',
                }
                return (
                  <button
                    key={tab}
                    type='button'
                    onClick={() => setActiveTab(tab)}
                    className={cx(
                      'inline-flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-all duration-150 outline-none',
                      isActive
                        ? 'border-[#F43F70] text-[#F43F70]'
                        : 'border-transparent text-[#667085] hover:border-[#E1E6EF] hover:text-[#11182E]'
                    )}
                  >
                    {tab}
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        badgeStyles[tab] || 'bg-[#F2F4F8] text-[#667085]'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className='shrink-0 pb-2 flex items-center gap-1 text-sm text-[#667085] font-semibold'>
              <span className='text-xs font-semibold text-[#98A2B3]'>
                Sort by:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className='bg-transparent text-sm font-bold text-[#11182E] outline-none cursor-pointer hover:text-[#F43F70] transition-colors pr-2'
              >
                <option value='Default'>Default</option>
                <option value='A–Z'>A–Z</option>
                <option value='Z–A'>Z–A</option>
                <option value='Orders'>Orders</option>
                <option value='Revenue'>Revenue</option>
              </select>
            </div>
          </div>

          {/* ── Outlet grid ── */}
          <section className='mt-3'>
            {filteredOutlets.length > 0 ? (
              <div className='grid gap-3 2xl:grid-cols-2'>
                {filteredOutlets.map((o) => (
                  <OutletCard
                    key={o.id}
                    outlet={o}
                    selected={selectedOutlet?.id === o.id}
                    onSelect={chooseOutlet}
                  />
                ))}
              </div>
            ) : (
              <div className='grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-[#D6DCE8] bg-white p-8 text-center'>
                <div>
                  <span className='mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F43F70]/10 text-[#F43F70]'>
                    <Search size={24} />
                  </span>
                  <h2 className='mt-4 text-lg font-bold text-[#11182E]'>
                    No outlets found
                  </h2>
                  <p className='mt-1 text-sm text-[#667085]'>
                    Try changing the filters or search keyword.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── Bottom info ── */}
          <div className='mt-4 flex items-center justify-between text-xs text-[#667085]'>
            <span>
              Showing{' '}
              <strong className='text-[#11182E]'>
                {filteredOutlets.length}
              </strong>{' '}
              of <strong className='text-[#11182E]'>{outlets.length}</strong>{' '}
              outlets
            </span>
            <button
              type='button'
              className='inline-flex items-center gap-1.5 font-semibold hover:text-[#11182E] transition-colors'
            >
              Last updated: 10:25 AM <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop fixed sidebar ── */}
      {isDetailOpen && (
        <div className='fixed inset-y-0 right-0 z-[80] hidden xl:flex flex-col w-[440px] h-[100dvh] bg-white border-l border-[#E1E6EF] overflow-hidden shadow-[-4px_0_18px_rgba(17,24,46,0.04)]'>
          <DetailPanel
            outlet={selectedOutlet}
            onClose={() => setIsDetailOpen(false)}
            onManageChannels={openManageChannelsModal}
          />
        </div>
      )}

      {/* ── Mobile slide-over ── */}
      {mobileDetailOpen && (
        <div className='xl:hidden'>
          <button
            type='button'
            aria-label='Close overlay'
            className='fixed inset-0 z-40 bg-[#11182E]/40 backdrop-blur-[2px]'
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className='fixed inset-y-0 right-0 z-50 w-full max-w-[440px] h-[100dvh] bg-white flex flex-col shadow-2xl'>
            <DetailPanel
              outlet={selectedOutlet}
              mobile
              onClose={() => setMobileDetailOpen(false)}
              onManageChannels={openManageChannelsModal}
            />
          </div>
        </div>
      )}

      {/* ── Manage Connected Channels Modal ── */}
      {isManageChannelsOpen && outletForChannels && (
        <div className='fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150'>
          <div className='bg-white rounded-2xl w-full max-w-[960px] shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <header className='px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 relative'>
              <OutletImage
                src={outletForChannels.image}
                name={outletForChannels.name}
                className='h-14 w-14 rounded-2xl border border-[#E1E6EF] shadow-[0_1px_3px_rgba(17,24,46,0.04)] object-cover shrink-0'
              />
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-base font-extrabold text-[#11182E] truncate'>
                    Manage Connected Channels
                  </h3>
                </div>
                <div className='flex items-center gap-2 mt-0.5'>
                  <span className='text-sm font-bold text-slate-700 truncate'>
                    {outletForChannels.name}
                  </span>
                  <StatusBadge status={outletForChannels.status} />
                </div>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] font-semibold text-slate-400'>
                  <span>{outletForChannels.city}, {outletForChannels.region}</span>
                  <span className='text-slate-200'>•</span>
                  <span>Outlet Manager: {outletForChannels.manager}</span>
                  <span className='text-slate-200'>•</span>
                  <span>{outletForChannels.phone}</span>
                </div>
              </div>
              <button
                type='button'
                onClick={() => {
                  setIsManageChannelsOpen(false)
                  setOutletForChannels(null)
                }}
                className='absolute top-4 right-4 p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition cursor-pointer'
              >
                <X size={16} />
              </button>
            </header>

            {/* Tab Navigation */}
            <div className='px-6 border-b border-slate-100 bg-white shrink-0 flex gap-6'>
              {['Connected Channels', 'Channel Settings', 'Webhooks', 'Activity Log'].map((tab) => (
                <button
                  key={tab}
                  type='button'
                  onClick={() => setActiveChannelsTab(tab)}
                  className={cx(
                    'py-3.5 text-xs font-bold border-b-2 transition-all relative cursor-pointer',
                    activeChannelsTab === tab
                      ? 'border-[#F43F70] text-[#F43F70]'
                      : 'border-transparent text-slate-400 hover:text-[#11182E]'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Body */}
            <div className='p-6 overflow-y-auto space-y-6 flex-1 min-h-0 bg-slate-50/40'>
              {activeChannelsTab === 'Connected Channels' ? (
                <>
                  {/* Context Description */}
                  <p className='text-xs font-semibold text-slate-500'>
                    Connect and manage all sales & communication channels for this outlet.
                  </p>

                  {/* Rows Container */}
                  <div className='bg-white border border-slate-200/80 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden'>
                    {/* 1. WhatsApp Row */}
                    <div className='p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5 min-w-0'>
                        {/* WhatsApp Icon */}
                        <div className='w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16A34A] shrink-0 shadow-sm'>
                          <MessageCircle size={20} />
                        </div>
                        <div className='min-w-0'>
                          <h4 className='text-xs font-bold text-slate-800 leading-tight'>WhatsApp</h4>
                          <p className='text-[10px] text-slate-400 font-semibold mt-0.5'>WhatsApp Business API</p>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
                        <div>
                          <span className={cx(
                            'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            channelStates.whatsapp
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          )}>
                            {channelStates.whatsapp ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>

                        {/* Health Status */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            {channelStates.whatsapp ? (
                              <>
                                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                                <span className='text-[11px] font-bold text-slate-700'>Healthy</span>
                              </>
                            ) : (
                              <span className='text-slate-400 text-xs font-bold'>—</span>
                            )}
                          </div>
                        </div>

                        {/* Last Sync */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Last Sync</span>
                          <span className='block text-[11px] font-bold text-slate-700 mt-0.5'>
                            {channelStates.whatsapp ? '2 min ago' : '—'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                          {channelStates.whatsapp ? (
                            <>
                              <button
                                type='button'
                                onClick={() => alert('Syncing menu...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Sync Menu
                              </button>
                              <button
                                type='button'
                                onClick={() => setChannelConnected('whatsapp', false)}
                                className='h-8 px-3 border border-[#FFEBEF] hover:bg-[#FFEBEF] text-[#F43F70] text-[10px] font-bold rounded-lg transition cursor-pointer'
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button
                              type='button'
                              onClick={() => setChannelConnected('whatsapp', true)}
                              className='h-8 px-4 bg-[#6956E8] hover:bg-[#5b49d3] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                            >
                              Connect
                            </button>
                          )}
                          {channelStates.whatsapp && (
                            <button type='button' className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition cursor-pointer'>
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Telegram Row */}
                    <div className='p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5 min-w-0'>
                        {/* Telegram Icon */}
                        <div className='w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shrink-0 shadow-sm'>
                          <Send size={18} className='text-[#2563EB]' />
                        </div>
                        <div className='min-w-0'>
                          <h4 className='text-xs font-bold text-slate-800 leading-tight'>Telegram</h4>
                          <p className='text-[10px] text-slate-400 font-semibold mt-0.5'>Telegram Bot</p>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
                        <div>
                          <span className={cx(
                            'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            channelStates.telegram
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          )}>
                            {channelStates.telegram ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>

                        {/* Health Status */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            {channelStates.telegram ? (
                              <>
                                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                                <span className='text-[11px] font-bold text-slate-700'>Healthy</span>
                              </>
                            ) : (
                              <span className='text-slate-400 text-xs font-bold'>—</span>
                            )}
                          </div>
                        </div>

                        {/* Last Sync */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Last Sync</span>
                          <span className='block text-[11px] font-bold text-slate-700 mt-0.5'>
                            {channelStates.telegram ? '1 min ago' : '—'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                          {channelStates.telegram ? (
                            <>
                              <button
                                type='button'
                                onClick={() => alert('Syncing menu...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Sync Menu
                              </button>
                              <button
                                type='button'
                                onClick={() => setChannelConnected('telegram', false)}
                                className='h-8 px-3 border border-[#FFEBEF] hover:bg-[#FFEBEF] text-[#F43F70] text-[10px] font-bold rounded-lg transition cursor-pointer'
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button
                              type='button'
                              onClick={() => setChannelConnected('telegram', true)}
                              className='h-8 px-4 bg-[#6956E8] hover:bg-[#5b49d3] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                            >
                              Connect
                            </button>
                          )}
                          {channelStates.telegram && (
                            <button type='button' className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition cursor-pointer'>
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Website Row */}
                    <div className='p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5 min-w-0'>
                        {/* Website Icon */}
                        <div className='w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm'>
                          <Globe2 size={18} className='text-[#6956E8]' />
                        </div>
                        <div className='min-w-0'>
                          <h4 className='text-xs font-bold text-slate-800 leading-tight'>Website</h4>
                          <p className='text-[10px] text-slate-400 font-semibold mt-0.5'>Online Ordering (Web)</p>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
                        <div>
                          <span className={cx(
                            'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            channelStates.website
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          )}>
                            {channelStates.website ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>

                        {/* Health Status */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            {channelStates.website ? (
                              <>
                                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                                <span className='text-[11px] font-bold text-slate-700'>Healthy</span>
                              </>
                            ) : (
                              <span className='text-slate-400 text-xs font-bold'>—</span>
                            )}
                          </div>
                        </div>

                        {/* Last Sync */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Last Sync</span>
                          <span className='block text-[11px] font-bold text-slate-700 mt-0.5'>
                            {channelStates.website ? 'Just now' : '—'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                          {channelStates.website ? (
                            <>
                              <button
                                type='button'
                                onClick={() => alert('Syncing menu...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Sync Menu
                              </button>
                              <button
                                type='button'
                                onClick={() => alert('Syncing orders...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Sync Orders
                              </button>
                            </>
                          ) : (
                            <button
                              type='button'
                              onClick={() => setChannelConnected('website', true)}
                              className='h-8 px-4 bg-[#6956E8] hover:bg-[#5b49d3] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                            >
                              Connect
                            </button>
                          )}
                          {channelStates.website && (
                            <button type='button' className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition cursor-pointer'>
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. Instagram Row */}
                    <div className='flex flex-col divide-y divide-slate-100'>
                      <div className='p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div className='flex items-center gap-3.5 min-w-0'>
                          {/* Instagram Icon */}
                          <div className='w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 shadow-sm'>
                            <Instagram size={18} className='text-rose-500' />
                          </div>
                          <div className='min-w-0'>
                            <h4 className='text-xs font-bold text-slate-800 leading-tight'>Instagram</h4>
                            <p className='text-[10px] text-slate-400 font-semibold mt-0.5'>Instagram Messaging</p>
                          </div>
                        </div>

                        {/* Info & Actions */}
                        <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
                          <div>
                            <span className={cx(
                              'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border',
                              !channelStates.instagram
                                ? 'bg-slate-50 border-slate-200 text-slate-400'
                                : isInstagramHealthy
                                  ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-600'
                                  : 'bg-orange-50 border-orange-200 text-orange-600'
                            )}>
                              {!channelStates.instagram ? 'Not Connected' : isInstagramHealthy ? 'Connected' : 'Pending Setup'}
                            </span>
                          </div>

                          {/* Health Status */}
                          <div className='w-24 shrink-0'>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                            <div className='flex items-center gap-1.5 mt-0.5'>
                              {!channelStates.instagram ? (
                                <span className='text-slate-400 text-xs font-bold'>—</span>
                              ) : isInstagramHealthy ? (
                                <>
                                  <span className='w-2 h-2 rounded-full bg-[#16A34A]' />
                                  <span className='text-[11px] font-bold text-slate-700'>Healthy</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={12} className='text-orange-500 shrink-0' />
                                  <span className='text-[11px] font-bold text-slate-700'>Attention</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Last Sync */}
                          <div className='w-24 shrink-0'>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Last Sync</span>
                            <span className='block text-[11px] font-bold text-slate-700 mt-0.5'>
                              {channelStates.instagram && isInstagramHealthy ? 'Just now' : '—'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className='flex items-center gap-2'>
                            {channelStates.instagram ? (
                              <>
                                <button
                                  type='button'
                                  onClick={() => {
                                    setIsInstagramHealthy(true)
                                    alert('Instagram re-authorized successfully!')
                                  }}
                                  className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                                >
                                  Reconnect
                                </button>
                                <button
                                  type='button'
                                  onClick={() => alert('Testing connection... Connection successful!')}
                                  className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                                >
                                  Test Connection
                                </button>
                              </>
                            ) : (
                              <button
                                type='button'
                                onClick={() => {
                                  setChannelStates(prev => ({ ...prev, instagram: true }))
                                  setIsInstagramHealthy(false)
                                }}
                                className='h-8 px-4 bg-[#6956E8] hover:bg-[#5b49d3] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Connect
                              </button>
                            )}
                            {channelStates.instagram && (
                              <button type='button' className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition cursor-pointer'>
                                <MoreVertical size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Warning notice below Instagram */}
                      {channelStates.instagram && !isInstagramHealthy && (
                        <div className='p-3 bg-[#FFF9F2] border-t border-b border-[#FFE8CC] flex items-center justify-between gap-3 text-xs font-semibold text-amber-800 animate-in fade-in slide-in-from-top-1 duration-200'>
                          <div className='flex items-center gap-2'>
                            <AlertTriangle size={14} className='text-[#EA7200] shrink-0' />
                            <span>Instagram API permission needs to be re-authorized. Some features may not work until reconnect.</span>
                          </div>
                          <button
                            type='button'
                            onClick={() => {
                              setIsInstagramHealthy(true)
                              alert('Instagram API permission has been re-authorized.')
                            }}
                            className='px-3 py-1.5 bg-[#FFF0E0] hover:bg-[#FFE0C0] text-amber-700 text-[10px] font-bold rounded-lg border border-[#FFD5A3] transition cursor-pointer'
                          >
                            Re-authorize
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 5. Tokopedia Row */}
                    <div className='p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5 min-w-0'>
                        {/* Tokopedia Icon */}
                        <div className='w-10 h-10 rounded-full bg-[#E8F8EE] border border-[#D0F1DC] flex items-center justify-center text-[#03AC0E] shrink-0 shadow-sm'>
                          <svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M19 6h-3c0-2.21-1.79-4-4-4S8 3.79 8 6H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm0 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z'/>
                          </svg>
                        </div>
                        <div className='min-w-0'>
                          <h4 className='text-xs font-bold text-slate-800 leading-tight'>Tokopedia</h4>
                          <p className='text-[10px] text-slate-400 font-semibold mt-0.5'>Marketplace Connector</p>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
                        <div>
                          <span className={cx(
                            'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            channelStates.tokopedia
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          )}>
                            {channelStates.tokopedia ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>

                        {/* Health Status */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            {channelStates.tokopedia ? (
                              <>
                                <span className='w-2 h-2 rounded-full bg-[#16A34A]' />
                                <span className='text-[11px] font-bold text-slate-700'>Healthy</span>
                              </>
                            ) : (
                              <span className='text-slate-400 text-xs font-bold'>—</span>
                            )}
                          </div>
                        </div>

                        {/* Last Sync */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Last Sync</span>
                          <span className='block text-[11px] font-bold text-slate-700 mt-0.5'>
                            {channelStates.tokopedia ? 'Just now' : '—'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                          {channelStates.tokopedia ? (
                            <>
                              <button
                                type='button'
                                onClick={() => alert('Syncing inventory...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Sync Inventory
                              </button>
                              <button
                                type='button'
                                onClick={() => setChannelStates(prev => ({ ...prev, tokopedia: false }))}
                                className='h-8 px-3 border border-[#FFEBEF] hover:bg-[#FFEBEF] text-[#F43F70] text-[10px] font-bold rounded-lg transition cursor-pointer'
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type='button'
                                onClick={() => setChannelStates(prev => ({ ...prev, tokopedia: true }))}
                                className='h-8 px-4 bg-[#F43F70] hover:bg-[#e62e63] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Connect
                              </button>
                              <button
                                type='button'
                                onClick={() => alert('Opening integration guide...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Learn More
                              </button>
                            </>
                          )}
                          {channelStates.tokopedia && (
                            <button type='button' className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition cursor-pointer'>
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 6. Shopee Row */}
                    <div className='p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                      <div className='flex items-center gap-3.5 min-w-0'>
                        {/* Shopee Icon */}
                        <div className='w-10 h-10 rounded-full bg-[#FFF0E6] border border-[#FFD9C2] flex items-center justify-center text-[#EE4D2D] shrink-0 shadow-sm'>
                          <svg className='w-6 h-6' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M17.8 7.2h-2c-.3-2.4-2.1-4.2-4.5-4.2s-4.2 1.8-4.5 4.2h-2c-1.1 0-2 .9-2 2v10.5c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V9.2c0-1.1-.9-2-2-2zM11.3 5c1.2 0 2.2.9 2.5 2.2H8.8c.3-1.3 1.3-2.2 2.5-2.2zm4 7.8c-.8.8-2 1.2-3.3 1.2s-2.5-.4-3.3-1.2c-.3-.3-.3-.8 0-1.1s.8-.3 1.1 0c.6.6 1.4.9 2.2.9s1.6-.3 2.2-.9c.3-.3.8-.3 1.1 0s.3.8 0 1.1z'/>
                          </svg>
                        </div>
                        <div className='min-w-0'>
                          <h4 className='text-xs font-bold text-slate-800 leading-tight'>Shopee</h4>
                          <p className='text-[10px] text-slate-400 font-semibold mt-0.5'>Marketplace Connector</p>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
                        <div>
                          <span className={cx(
                            'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            channelStates.shopee
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          )}>
                            {channelStates.shopee ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>

                        {/* Health Status */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            {channelStates.shopee ? (
                              <>
                                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                                <span className='text-[11px] font-bold text-slate-700'>Healthy</span>
                              </>
                            ) : (
                              <span className='text-slate-400 text-xs font-bold'>—</span>
                            )}
                          </div>
                        </div>

                        {/* Last Sync */}
                        <div className='w-24 shrink-0'>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Last Sync</span>
                          <span className='block text-[11px] font-bold text-slate-700 mt-0.5'>
                            {channelStates.shopee ? 'Just now' : '—'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                          {channelStates.shopee ? (
                            <>
                              <button
                                type='button'
                                onClick={() => alert('Syncing inventory...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Sync Inventory
                              </button>
                              <button
                                type='button'
                                onClick={() => setChannelStates(prev => ({ ...prev, shopee: false }))}
                                className='h-8 px-3 border border-[#FFEBEF] hover:bg-[#FFEBEF] text-[#F43F70] text-[10px] font-bold rounded-lg transition cursor-pointer'
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type='button'
                                onClick={() => setChannelStates(prev => ({ ...prev, shopee: true }))}
                                className='h-8 px-4 bg-[#F43F70] hover:bg-[#e62e63] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Connect
                              </button>
                              <button
                                type='button'
                                onClick={() => alert('Opening integration guide...')}
                                className='h-8 px-3 border border-[#E1E6EF] hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer'
                              >
                                Learn More
                              </button>
                            </>
                          )}
                          {channelStates.shopee && (
                            <button type='button' className='p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition cursor-pointer'>
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Integration Health Summary Title */}
                  <div className='pt-2'>
                    <h4 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-wider'>
                      Integration Health Summary
                    </h4>
                  </div>

                  {/* Summary Metrics Grid */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* 1. Connected Channels Card */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5'>
                      <div className='w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-[#6956E8] shrink-0 border border-violet-100'>
                        <Globe2 size={18} className='text-[#6956E8]' />
                      </div>
                      <div>
                        <span className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                          Connected Channels
                        </span>
                        <div className='flex items-baseline gap-1 mt-0.5'>
                          <span className='text-lg font-black text-slate-900'>
                            {Object.values(channelStates).filter(Boolean).length}
                          </span>
                          <span className='text-xs font-semibold text-slate-400'>/ 6</span>
                        </div>
                        <span className='block text-[10px] text-slate-400 font-semibold mt-0.5'>
                          {Math.round((Object.values(channelStates).filter(Boolean).length / 6) * 100)}% connected
                        </span>
                      </div>
                    </div>

                    {/* 2. Healthy Integrations Card */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5'>
                      <div className='w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100'>
                        <CheckCircle2 size={18} className='text-emerald-600' />
                      </div>
                      <div>
                        <span className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                          Healthy Integrations
                        </span>
                        <span className='block text-lg font-black text-slate-900 mt-0.5'>
                          {(channelStates.whatsapp ? 1 : 0) +
                           (channelStates.telegram ? 1 : 0) +
                           (channelStates.website ? 1 : 0) +
                           (channelStates.instagram && isInstagramHealthy ? 1 : 0) +
                           (channelStates.tokopedia ? 1 : 0) +
                           (channelStates.shopee ? 1 : 0)}
                        </span>
                        <span className='block text-[10px] text-slate-400 font-semibold mt-0.5'>
                          All systems operational
                        </span>
                      </div>
                    </div>

                    {/* 3. Needs Attention Card */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5'>
                      <div className='w-9 h-9 rounded-xl bg-[#FFF7E8] flex items-center justify-center text-[#EA7200] shrink-0 border border-amber-100'>
                        <AlertTriangle size={18} className='text-[#EA7200]' />
                      </div>
                      <div>
                        <span className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                          Needs Attention
                        </span>
                        <span className='block text-lg font-black text-slate-900 mt-0.5'>
                          {channelStates.instagram && !isInstagramHealthy ? 1 : 0}
                        </span>
                        <span className='block text-[10px] text-slate-400 font-semibold mt-0.5'>
                          {channelStates.instagram && !isInstagramHealthy ? '1 channel needs action' : 'All channels healthy'}
                        </span>
                      </div>
                    </div>

                    {/* 4. Failed Webhooks Card */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5'>
                      <div className='w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-[#F43F70] shrink-0 border border-rose-100'>
                        <Zap size={18} className='text-[#F43F70]' />
                      </div>
                      <div>
                        <span className='block text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                          Failed Webhooks (24h)
                        </span>
                        <span className='block text-lg font-black text-slate-900 mt-0.5'>
                          0
                        </span>
                        <span className='block text-[10px] text-slate-400 font-semibold mt-0.5'>
                          No failures
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeChannelsTab === 'Channel Settings' ? (
                <>
                  {/* Info bar */}
                  <div className='flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs font-semibold text-blue-800'>
                    <Info size={14} className='text-blue-500 shrink-0 mt-0.5' />
                    <span>Customers will still select their outlet during ordering. These settings control whether this outlet can receive chats and orders from each channel.</span>
                  </div>

                  {/* Per-channel setting rows */}
                  {[
                    {
                      key: 'whatsapp',
                      label: 'WhatsApp',
                      sub: 'WhatsApp Business API',
                      icon: <MessageCircle size={20} className='text-[#16A34A]' />,
                      iconBg: 'bg-emerald-50 border-emerald-100',
                      syncLabel: '2 min ago',
                    },
                    {
                      key: 'telegram',
                      label: 'Telegram',
                      sub: 'Telegram Bot',
                      icon: <Send size={18} className='text-[#2563EB]' />,
                      iconBg: 'bg-sky-50 border-sky-100',
                      syncLabel: '1 min ago',
                    },
                    {
                      key: 'website',
                      label: 'Website',
                      sub: 'Online Ordering (Web)',
                      icon: <Globe2 size={18} className='text-[#6956E8]' />,
                      iconBg: 'bg-indigo-50 border-indigo-100',
                      syncLabel: 'Just now',
                    },
                  ].map(({ key, label, sub, icon, iconBg, syncLabel }) => {
                    const s = channelSettings[key]
                    const isConnected = channelStates[key]
                    const aiOptions = [
                      { value: 'default', label: 'Use workspace default agent', sub: 'SelaluTeh AI Assistant' },
                      { value: 'disabled', label: 'Disable AI', sub: 'Messages go to human team' },
                      { value: 'override', label: 'Override agent', sub: 'SelaluTeh Website Agent' },
                    ]
                    const teamOptions = [
                      { value: 'cs_team', label: 'SelaluTeh CS Team', sub: '3 members' },
                      { value: 'website_team', label: 'Website Support Team', sub: '2 members' },
                      { value: 'sales_team', label: 'Sales Team', sub: '4 members' },
                    ]
                    const hoursOptions = [
                      { value: 'auto_reply_human', label: 'Auto-reply then human', sub: '09:00 – 21:00 WIB' },
                      { value: 'auto_reply_only', label: 'Auto-reply only', sub: 'No human escalation' },
                      { value: 'reject', label: 'Reject messages', sub: 'Outside hours closed' },
                    ]
                    const selectedAi = aiOptions.find(o => o.value === s.aiHandling) || aiOptions[0]
                    const selectedTeam = teamOptions.find(o => o.value === s.humanTeam) || teamOptions[0]
                    const selectedHours = hoursOptions.find(o => o.value === s.outsideHours) || hoursOptions[0]

                    return (
                      <div key={key} className='bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden'>
                        {/* Channel header */}
                        <div className='flex items-center justify-between px-5 py-3.5 border-b border-slate-100'>
                          <div className='flex items-center gap-3'>
                            <div className={cx('w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm', iconBg)}>
                              {icon}
                            </div>
                            <div>
                              <div className='flex items-center gap-2'>
                                <span className='text-sm font-extrabold text-slate-800'>{label}</span>
                                <span className={cx(
                                  'inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border',
                                  isConnected
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                                )}>
                                  {isConnected ? 'Connected' : 'Not Connected'}
                                </span>
                              </div>
                              <span className='text-[10px] text-slate-400 font-semibold'>{sub}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-3'>
                            <div className='text-right hidden sm:block'>
                              <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Health</span>
                              <div className='flex items-center justify-end gap-1 mt-0.5'>
                                {isConnected
                                  ? <><span className='w-2 h-2 rounded-full bg-emerald-500 inline-block' /><span className='text-[11px] font-bold text-slate-700'>Healthy</span></>
                                  : <span className='text-slate-400 text-xs'>—</span>
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Settings grid */}
                        <div className='px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-x-6 gap-y-4 items-start bg-white'>

                          {/* Enabled for Outlet */}
                          <div className='flex flex-col items-center gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center h-12 flex items-end justify-center pb-1 leading-tight select-none'>Enabled for Outlet</span>
                            <button
                              type='button'
                              onClick={() => toggleChannelSetting(key, 'enabled')}
                              className={cx(
                                'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none shrink-0',
                                s.enabled ? 'bg-[#F43F70]' : 'bg-slate-200'
                              )}
                            >
                              <span className={cx(
                                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                                s.enabled ? 'left-5' : 'left-0.5'
                              )} />
                            </button>
                            <span className='text-[9px] font-bold text-slate-500 select-none'>{s.enabled ? 'On' : 'Off'}</span>
                          </div>

                          {/* Accept Chats */}
                          <div className='flex flex-col items-center gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center h-12 flex items-end justify-center pb-1 leading-tight select-none'>Accept Chats</span>
                            <button
                              type='button'
                              onClick={() => toggleChannelSetting(key, 'acceptChats')}
                              className={cx(
                                'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none shrink-0',
                                s.acceptChats ? 'bg-[#F43F70]' : 'bg-slate-200'
                              )}
                            >
                              <span className={cx(
                                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                                s.acceptChats ? 'left-5' : 'left-0.5'
                              )} />
                            </button>
                            <span className='text-[9px] font-bold text-slate-500 select-none'>{s.acceptChats ? 'On' : 'Off'}</span>
                          </div>

                          {/* Accept Orders */}
                          <div className='flex flex-col items-center gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center h-12 flex items-end justify-center pb-1 leading-tight select-none'>Accept Orders</span>
                            <button
                              type='button'
                              onClick={() => toggleChannelSetting(key, 'acceptOrders')}
                              className={cx(
                                'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none shrink-0',
                                s.acceptOrders ? 'bg-[#F43F70]' : 'bg-slate-200'
                              )}
                            >
                              <span className={cx(
                                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                                s.acceptOrders ? 'left-5' : 'left-0.5'
                              )} />
                            </button>
                            <span className='text-[9px] font-bold text-slate-500 select-none'>{s.acceptOrders ? 'On' : 'Off'}</span>
                          </div>

                          {/* AI Handling */}
                          <div className='col-span-2 sm:col-span-1 lg:col-span-2 flex flex-col gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider h-12 flex items-end pb-1 leading-tight select-none'>AI Handling</span>
                            <div className='relative'>
                              <select
                                value={s.aiHandling}
                                onChange={e => setChannelDropdownSetting(key, 'aiHandling', e.target.value)}
                                className='w-full h-8 pl-2.5 pr-7 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6956E8]/30 shadow-sm'
                              >
                                {aiOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <ChevronDown size={12} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            </div>
                            <span className='text-[9px] text-slate-400 font-semibold select-none'>{selectedAi.sub}</span>
                          </div>

                          {/* Human Team */}
                          <div className='col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider h-12 flex items-end pb-1 leading-tight select-none'>Human Team</span>
                            <div className='relative'>
                              <select
                                value={s.humanTeam}
                                onChange={e => setChannelDropdownSetting(key, 'humanTeam', e.target.value)}
                                className='w-full h-8 pl-2.5 pr-7 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6956E8]/30 shadow-sm'
                              >
                                {teamOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <ChevronDown size={12} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            </div>
                            <span className='text-[9px] text-slate-400 font-semibold select-none'>{selectedTeam.sub}</span>
                          </div>

                          {/* Outside-hours Behavior */}
                          <div className='col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider h-12 flex items-end pb-1 leading-tight select-none'>Outside-hours Behavior</span>
                            <div className='relative'>
                              <select
                                value={s.outsideHours}
                                onChange={e => setChannelDropdownSetting(key, 'outsideHours', e.target.value)}
                                className='w-full h-8 pl-2.5 pr-7 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6956E8]/30 shadow-sm'
                              >
                                {hoursOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <ChevronDown size={12} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            </div>
                            <span className='text-[9px] text-slate-400 font-semibold select-none'>{selectedHours.sub}</span>
                          </div>

                          {/* Order Routing */}
                          <div className='col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider h-12 flex items-end pb-1 leading-tight select-none'>Order Routing</span>
                            <div className='flex items-start gap-1.5 select-none'>
                              <Store size={12} className='text-slate-400 shrink-0 mt-0.5' />
                              <span className='text-[10px] font-bold text-slate-700 leading-tight'>Route to this outlet<br/><span className='font-semibold text-slate-400'>{outletForChannels?.name}</span></span>
                            </div>
                          </div>

                          {/* Fallback Message Preview */}
                          <div className='col-span-2 lg:col-span-2 flex flex-col gap-1.5'>
                            <span className='text-[9px] font-bold text-slate-400 uppercase tracking-wider h-12 flex items-end pb-1 leading-tight select-none'>Fallback Message (Preview)</span>
                            <p className='text-[10px] text-slate-600 font-semibold italic leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 select-none'>
                              "{s.fallbackMessage}"
                            </p>
                          </div>

                        </div>
                      </div>
                    )
                  })}

                  {/* Bottom row: Pickup Availability + Order Acceptance Window */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {/* Default Pickup Availability */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4'>
                      <div className='flex items-center gap-2 mb-3'>
                        <div className='w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center'>
                          <Clock3 size={13} className='text-[#6956E8]' />
                        </div>
                        <div>
                          <h4 className='text-xs font-extrabold text-slate-800'>Default Pickup Availability</h4>
                          <p className='text-[10px] text-slate-400 font-semibold'>Controls default availability shown to customers during checkout.</p>
                        </div>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <select
                          value={pickupDay}
                          onChange={e => setPickupDay(e.target.value)}
                          className='h-8 pl-2.5 pr-7 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none relative'
                          style={{ backgroundImage: 'none' }}
                        >
                          {['Every day', 'Weekdays only', 'Weekends only'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={pickupStart} onChange={e => setPickupStart(e.target.value)} className='h-8 px-2.5 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'>
                          {['07:00','08:00','09:00','10:00','11:00'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className='text-[10px] font-bold text-slate-400'>to</span>
                        <select value={pickupEnd} onChange={e => setPickupEnd(e.target.value)} className='h-8 px-2.5 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'>
                          {['20:00','21:00','22:00','23:00'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className='text-[10px] font-bold text-slate-400'>WIB</span>
                        <button type='button' onClick={() => alert('Edit store hours')} className='h-8 px-3 border border-[#E1E6EF] rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer'>
                          Edit Store Hours
                        </button>
                      </div>
                      <p className='text-[10px] text-slate-400 font-semibold mt-2'>Store hours: {pickupStart} – {pickupEnd} WIB, {pickupDay}</p>
                    </div>

                    {/* Order Acceptance Window */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4'>
                      <div className='flex items-center gap-2 mb-3'>
                        <div className='w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center'>
                          <Info size={13} className='text-[#EA7200]' />
                        </div>
                        <div>
                          <h4 className='text-xs font-extrabold text-slate-800'>Order Acceptance Window</h4>
                          <p className='text-[10px] text-slate-400 font-semibold'>Orders outside this window will be rejected automatically.</p>
                        </div>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-[10px] font-bold text-slate-500'>Accept orders</span>
                        <select
                          value={orderDay}
                          onChange={e => setOrderDay(e.target.value)}
                          className='h-8 pl-2.5 pr-7 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'
                          style={{ backgroundImage: 'none' }}
                        >
                          {['Every day', 'Weekdays only', 'Weekends only'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={orderStart} onChange={e => setOrderStart(e.target.value)} className='h-8 px-2.5 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'>
                          {['07:00','08:00','09:00','10:00','11:00'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className='text-[10px] font-bold text-slate-400'>to</span>
                        <select value={orderEnd} onChange={e => setOrderEnd(e.target.value)} className='h-8 px-2.5 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'>
                          {['19:45','20:00','20:45','21:00','22:00'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className='text-[10px] font-bold text-slate-400'>WIB</span>
                        <button type='button' onClick={() => alert('Edit window')} className='h-8 px-3 border border-[#E1E6EF] rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer'>
                          Edit Window
                        </button>
                      </div>
                      <p className='text-[10px] text-slate-400 font-semibold mt-2'>Last order accepted 15 minutes before store closes.</p>
                    </div>
                  </div>

                  {/* Routing Summary */}
                  <div>
                    <div className='flex items-center gap-2 mb-3'>
                      <Users size={14} className='text-slate-400' />
                      <h4 className='text-[10px] font-extrabold text-slate-500 uppercase tracking-wider'>Routing Summary</h4>
                    </div>
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                      {/* Channels Enabled */}
                      <div className='bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0'>
                          <Globe2 size={16} className='text-[#6956E8]' />
                        </div>
                        <div>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight'>Channels Enabled</span>
                          <div className='flex items-baseline gap-0.5 mt-0.5'>
                            <span className='text-lg font-black text-slate-900'>
                              {[channelSettings.whatsapp.enabled, channelSettings.telegram.enabled, channelSettings.website.enabled].filter(Boolean).length}
                            </span>
                            <span className='text-[10px] font-semibold text-slate-400'>/ 3</span>
                          </div>
                          <span className='text-[9px] text-slate-400 font-semibold'>All enabled</span>
                        </div>
                      </div>

                      {/* Chats Accepted */}
                      <div className='bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0'>
                          <MessageCircle size={16} className='text-emerald-600' />
                        </div>
                        <div>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight'>Chats Accepted</span>
                          <div className='flex items-baseline gap-0.5 mt-0.5'>
                            <span className='text-lg font-black text-slate-900'>
                              {[channelSettings.whatsapp.acceptChats, channelSettings.telegram.acceptChats, channelSettings.website.acceptChats].filter(Boolean).length}
                            </span>
                            <span className='text-[10px] font-semibold text-slate-400'>/ 3</span>
                          </div>
                          <span className='text-[9px] text-slate-400 font-semibold'>Across all channels</span>
                        </div>
                      </div>

                      {/* Orders Accepted */}
                      <div className='bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0'>
                          <ShoppingBag size={16} className='text-sky-600' />
                        </div>
                        <div>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight'>Orders Accepted</span>
                          <div className='flex items-baseline gap-0.5 mt-0.5'>
                            <span className='text-lg font-black text-slate-900'>
                              {[channelSettings.whatsapp.acceptOrders, channelSettings.telegram.acceptOrders, channelSettings.website.acceptOrders].filter(Boolean).length}
                            </span>
                            <span className='text-[10px] font-semibold text-slate-400'>/ 3</span>
                          </div>
                          <span className='text-[9px] text-slate-400 font-semibold'>Across all channels</span>
                        </div>
                      </div>

                      {/* AI Handling */}
                      <div className='bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0'>
                          <Sparkles size={16} className='text-[#F43F70]' />
                        </div>
                        <div>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight'>AI Handling</span>
                          <div className='flex items-baseline gap-1 mt-0.5 flex-wrap'>
                            <span className='text-[10px] font-bold text-slate-700'>
                              {[channelSettings.whatsapp, channelSettings.telegram, channelSettings.website].filter(s => s.aiHandling === 'default').length} Default
                            </span>
                            <span className='text-slate-300'>·</span>
                            <span className='text-[10px] font-bold text-slate-700'>
                              {[channelSettings.whatsapp, channelSettings.telegram, channelSettings.website].filter(s => s.aiHandling === 'disabled').length} Disabled
                            </span>
                            <span className='text-slate-300'>·</span>
                            <span className='text-[10px] font-bold text-slate-700'>
                              {[channelSettings.whatsapp, channelSettings.telegram, channelSettings.website].filter(s => s.aiHandling === 'override').length} Override
                            </span>
                          </div>
                          <span className='text-[9px] text-slate-400 font-semibold'>Per-channel configuration</span>
                        </div>
                      </div>

                      {/* Human Teams */}
                      <div className='bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0'>
                          <Users size={16} className='text-[#EA7200]' />
                        </div>
                        <div>
                          <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight'>Human Teams</span>
                          <div className='flex items-baseline gap-0.5 mt-0.5'>
                            <span className='text-lg font-black text-slate-900'>
                              {new Set([channelSettings.whatsapp.humanTeam, channelSettings.telegram.humanTeam, channelSettings.website.humanTeam]).size}
                            </span>
                          </div>
                          <span className='text-[9px] text-slate-400 font-semibold'>5 Active members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeChannelsTab === 'Webhooks' ? (() => {
                const webhookRows = [
                  { channel: 'whatsapp', channelLabel: 'WhatsApp', channelSub: 'WhatsApp Business API', channelIcon: <MessageCircle size={18} className='text-[#16A34A]' />, channelIconBg: 'bg-emerald-50 border-emerald-100', events: [
                    { type: 'incoming_message', status: 'Delivered', time: '2 min ago', ts: 'Today, 10:23:41', code: 200, health: 'Healthy', retry: 0 },
                    { type: 'message_delivered', status: 'Delivered', time: '4 min ago', ts: 'Today, 10:21:12', code: 200, health: 'Healthy', retry: 0 },
                    { type: 'order_created', status: 'Delivered', time: '12 min ago', ts: 'Today, 10:13:05', code: 200, health: 'Healthy', retry: 0 },
                  ]},
                  { channel: 'telegram', channelLabel: 'Telegram', channelSub: 'Telegram Bot', channelIcon: <Send size={16} className='text-[#2563EB]' />, channelIconBg: 'bg-sky-50 border-sky-100', events: [
                    { type: 'incoming_message', status: 'Delivered', time: '8 min ago', ts: 'Today, 10:17:48', code: 200, health: 'Healthy', retry: 0 },
                    { type: 'message_delivered', status: 'Delivered', time: '9 min ago', ts: 'Today, 10:16:34', code: 200, health: 'Healthy', retry: 0 },
                    { type: 'payment_updated', status: 'Delivered', time: '25 min ago', ts: 'Today, 10:00:27', code: 200, health: 'Healthy', retry: 0 },
                  ]},
                  { channel: 'website', channelLabel: 'Website', channelSub: 'Online Ordering (Web)', channelIcon: <Globe2 size={16} className='text-[#6956E8]' />, channelIconBg: 'bg-indigo-50 border-indigo-100', events: [
                    { type: 'order_created', status: 'Delivered', time: '3 min ago', ts: 'Today, 10:22:15', code: 200, health: 'Healthy', retry: 0 },
                    { type: 'sync_completed', status: 'Delivered', time: '15 min ago', ts: 'Today, 10:09:02', code: 200, health: 'Healthy', retry: 0 },
                    { type: 'payment_updated', status: 'Failed', time: '18 min ago', ts: 'Today, 10:06:21', code: 500, health: 'Degraded', retry: 2 },
                  ]},
                ]
                const filterSelect = (val, setter, opts) => (
                  <div className='relative'>
                    <select value={val} onChange={e => setter(e.target.value)} className='h-8 pl-3 pr-8 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={11} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                  </div>
                )
                return (
                  <>
                    {/* Description */}
                    <p className='text-xs font-semibold text-slate-500'>Monitor webhook deliveries and payloads across all connected channels.</p>

                    {/* Filter Bar */}
                    <div className='flex flex-wrap items-center gap-2'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[10px] font-bold text-slate-400'>Channel</span>
                        {filterSelect(webhookChannel, setWebhookChannel, ['All Channels','WhatsApp','Telegram','Website'])}
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[10px] font-bold text-slate-400'>Status</span>
                        {filterSelect(webhookStatus, setWebhookStatus, ['All Statuses','Delivered','Failed','Pending'])}
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[10px] font-bold text-slate-400'>Event Type</span>
                        {filterSelect(webhookEventType, setWebhookEventType, ['All Event Types','incoming_message','message_delivered','order_created','payment_updated','sync_completed'])}
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[10px] font-bold text-slate-400'>Time Range</span>
                        {filterSelect(webhookTimeRange, setWebhookTimeRange, ['Last 24 Hours','Last 7 Days','Last 30 Days'])}
                      </div>
                      <div className='flex-1 min-w-[180px] relative'>
                        <Search size={12} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        <input
                          type='text'
                          placeholder='Search event ID...'
                          value={webhookSearch}
                          onChange={e => setWebhookSearch(e.target.value)}
                          className='w-full h-8 pl-8 pr-3 text-[10px] font-semibold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6956E8]/30'
                        />
                      </div>
                      <button type='button' onClick={() => alert('Refreshing...')} className='h-8 px-3 border border-[#E1E6EF] rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer'>
                        <RefreshCw size={12} /> Refresh
                      </button>
                    </div>

                    {/* Degraded Delivery Alert */}
                    <div className='flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3'>
                      <div className='flex items-center gap-2 text-xs font-semibold text-amber-800'>
                        <AlertTriangle size={14} className='text-amber-500 shrink-0' />
                        <span>Degraded Delivery: 1 connector is experiencing delivery issues. Some events may be delayed or require retry.</span>
                      </div>
                      <button type='button' onClick={() => alert('Viewing issues...')} className='shrink-0 text-[10px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 cursor-pointer'>View Issues</button>
                    </div>

                    {/* Webhook Events Table */}
                    <div className='bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden'>
                      {/* Table header */}
                      <div className='grid grid-cols-[160px_150px_90px_140px_90px_120px_80px_1fr] gap-3 px-4 py-2.5 border-b border-slate-100 bg-[#F8FAFC] select-none'>
                        {['Channel','Event Type','Status','Last Event Time','Response Code','Delivery Health','Retry Count','Action'].map(h => (
                          <span key={h} className='text-[9px] font-extrabold text-slate-400 uppercase tracking-wider'>{h}</span>
                        ))}
                      </div>

                      {/* Rows */}
                      <div className='divide-y divide-slate-100'>
                        {webhookRows.map(({ channel, channelLabel, channelSub, channelIcon, channelIconBg, events }) => {
                          const filteredEvents = events.filter(ev => {
                            if (webhookChannel !== 'All Channels' && webhookChannel !== channelLabel) return false
                            if (webhookStatus !== 'All Statuses' && webhookStatus !== ev.status) return false
                            if (webhookEventType !== 'All Event Types' && webhookEventType !== ev.type) return false
                            if (webhookSearch && !ev.type.includes(webhookSearch.toLowerCase())) return false
                            return true
                          })
                          if (filteredEvents.length === 0) return null
                          return (
                            <div key={channel} className='flex items-stretch divide-x divide-slate-100 min-h-[120px] bg-white'>
                              {/* Left cell: Channel info (merged column) */}
                              <div className='w-[160px] p-4 flex flex-col justify-center items-start shrink-0 bg-white select-none'>
                                <div className='flex items-center gap-2.5'>
                                  <div className={cx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm', channelIconBg)}>
                                    {channelIcon}
                                  </div>
                                  <div className='min-w-0'>
                                    <span className='block text-[10.5px] font-extrabold text-slate-800 truncate leading-tight'>{channelLabel}</span>
                                    <span className='block text-[9px] text-slate-400 font-semibold truncate mt-0.5'>{channelSub}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right side: Event rows */}
                              <div className='flex-1 divide-y divide-slate-50 bg-white'>
                                {filteredEvents.map((ev, i) => (
                                  <div key={i} className='grid grid-cols-[150px_90px_140px_90px_120px_80px_1fr] gap-3 px-4 py-3.5 items-center hover:bg-[#F8FAFC]/50 transition duration-150'>
                                    {/* Event Type */}
                                    <span className='text-[10.5px] font-mono font-bold text-slate-600 truncate'>{ev.type}</span>
                                    {/* Status badge */}
                                    <div>
                                      <span className={cx(
                                        'inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border',
                                        ev.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'
                                      )}>{ev.status}</span>
                                    </div>
                                    {/* Last Event Time */}
                                    <div>
                                      <span className='block text-[10px] font-bold text-slate-700'>{ev.time}</span>
                                      <span className='block text-[9px] text-slate-400 font-semibold mt-0.5'>{ev.ts}</span>
                                    </div>
                                    {/* Response Code */}
                                    <span className={cx('text-[11px] font-extrabold', ev.code === 200 ? 'text-[#16A34A]' : 'text-[#DC3545]')}>{ev.code}</span>
                                    {/* Delivery Health */}
                                    <div className='flex items-center gap-1.5'>
                                      <span className={cx('w-2 h-2 rounded-full shrink-0', ev.health === 'Healthy' ? 'bg-[#16A34A]' : 'bg-[#EA7200]')} />
                                      <span className='text-[10px] font-bold text-slate-700'>{ev.health}</span>
                                    </div>
                                    {/* Retry Count */}
                                    <span className='text-[10px] font-bold text-slate-600 pl-2'>{ev.retry}</span>
                                    {/* Action */}
                                    <div className='flex items-center gap-2 justify-between'>
                                      <div className='flex items-center gap-1.5'>
                                        {ev.status === 'Failed' && (
                                          <button type='button' onClick={() => alert('Retrying failed webhook...')} className='h-7 px-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-[9px] font-extrabold rounded-lg transition cursor-pointer shadow-sm'>
                                            Retry Failed
                                          </button>
                                        )}
                                        <button type='button' onClick={() => alert(`Payload for ${ev.type}:\n{\n  "event": "${ev.type}",\n  "channel": "${channelLabel}",\n  "timestamp": "${ev.ts}",\n  "status": ${ev.code}\n}`)} className='h-7 px-2.5 border border-[#E1E6EF] hover:bg-slate-50 text-slate-600 text-[9px] font-bold rounded-lg transition cursor-pointer bg-white shadow-sm'>
                                          View Payload
                                        </button>
                                      </div>
                                      <ChevronDown size={14} className='text-slate-400 cursor-pointer hover:text-slate-600 shrink-0' />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Bottom: Stats + Actions */}
                    <div className='flex flex-col lg:flex-row items-stretch lg:items-center gap-4'>
                      {/* Stats */}
                      <div className='flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100'>
                        <div className='px-4 py-3.5 flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0'>
                            <Calendar size={14} className='text-[#6956E8]' />
                          </div>
                          <div>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none'>Total Events (24h)</span>
                            <span className='block text-base font-black text-slate-900 mt-1 leading-none'>1,248</span>
                            <span className='block text-[9px] text-[#16A34A] font-bold mt-1 leading-none'>↑ 18% vs yesterday</span>
                          </div>
                        </div>
                        <div className='px-4 py-3.5 flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0'>
                            <AlertTriangle size={14} className='text-[#DC3545]' />
                          </div>
                          <div>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none'>Failed Events (24h)</span>
                            <span className='block text-base font-black text-slate-900 mt-1 leading-none'>7</span>
                            <span className='block text-[9px] text-slate-400 font-semibold mt-1 leading-none'>0.6% failure rate</span>
                          </div>
                        </div>
                        <div className='px-4 py-3.5 flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0'>
                            <Clock3 size={14} className='text-[#2563EB]' />
                          </div>
                          <div>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none'>Avg Response Time (24h)</span>
                            <span className='block text-base font-black text-slate-900 mt-1 leading-none'>268 ms</span>
                            <span className='block text-[9px] text-[#16A34A] font-bold mt-1 leading-none'>↓ 22% vs yesterday</span>
                          </div>
                        </div>
                        <div className='px-4 py-3.5 flex items-center gap-3'>
                          <div className='w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0'>
                            <CheckCircle2 size={14} className='text-[#16A34A]' />
                          </div>
                          <div>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none'>Last Successful Delivery</span>
                            <span className='block text-base font-black text-slate-900 mt-1 leading-none'>2 min ago</span>
                            <span className='block text-[9px] text-slate-400 font-semibold mt-1 leading-none'>Today, 10:23:41</span>
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className='flex gap-2 shrink-0 items-center'>
                        <button type='button' onClick={() => alert('Opening webhook tester...')} className='h-9 px-4 border border-[#E1E6EF] bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer'>
                          <Beaker size={13} className='text-[#6956E8]' /> Test Webhook
                        </button>
                        <button type='button' onClick={() => alert('Retrying 7 failed webhooks...')} className='h-9 px-4 border border-rose-200 bg-rose-50 hover:bg-[#FFEBEF] text-[10px] font-bold text-rose-600 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm'>
                          <RefreshCw size={13} /> Retry Failed
                        </button>
                      </div>
                    </div>
                  </>
                )
              })() : activeChannelsTab === 'Activity Log' ? (() => {
                const activities = [
                  { id: 0, icon: <MessageCircle size={16} className='text-[#16A34A]' />, iconBg: 'bg-emerald-50 border-emerald-100', channel: 'WhatsApp', channelIcon: <MessageCircle size={12} className='text-[#16A34A]' />, title: 'WhatsApp enabled for outlet', actor: 'Rina Pratiwi', actorRole: 'Outlet Manager', actorAvatar: rinaAvatar, sys: false, badge: 'Success', date: 'May 14, 2025', time: '10:32 AM', action: 'Channel Enabled', summary: 'WhatsApp was enabled for this outlet.', prevKey: 'Enabled', prevVal: 'No', prevBadge: 'bg-rose-100 text-rose-600', nextKey: 'Enabled', nextVal: 'Yes', nextBadge: 'bg-emerald-100 text-emerald-700', corr: '8f1c2b6e-7a3d-4e59-9b6f-1e2a9c7d3f44', source: 'KALIS.AI Admin Dashboard', ip: '103.247.12.58', ts: 'May 14, 2025 • 10:32:14 AM (WITA)' },
                  { id: 1, icon: <Send size={15} className='text-[#2563EB]' />, iconBg: 'bg-sky-50 border-sky-100', channel: 'Telegram', channelIcon: <Send size={11} className='text-[#2563EB]' />, title: 'Telegram settings updated', actor: 'Andi Wijaya', actorRole: 'Admin', actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=32&h=32&q=80', sys: false, badge: 'Success', date: 'May 14, 2025', time: '09:51 AM', action: 'Settings Updated', summary: 'Telegram bot settings were updated.', prevKey: 'AI Handling', prevVal: 'Disabled', prevBadge: 'bg-slate-100 text-slate-600', nextKey: 'AI Handling', nextVal: 'Default', nextBadge: 'bg-violet-100 text-violet-700', corr: '3c7a8d2f-1b4e-4c8a-9f2d-5e6b7c8d9e0f', source: 'KALIS.AI Admin Dashboard', ip: '103.247.12.58', ts: 'May 14, 2025 • 09:51:22 AM (WITA)' },
                  { id: 2, icon: <Globe2 size={15} className='text-[#6956E8]' />, iconBg: 'bg-indigo-50 border-indigo-100', channel: 'Website', channelIcon: <Globe2 size={11} className='text-[#6956E8]' />, title: 'Website sync completed', actor: 'SYS', actorRole: 'System', actorAvatar: null, sys: true, badge: 'Success', date: 'May 14, 2025', time: '09:31 AM', action: 'Sync Completed', summary: 'Website menu and order data was synced successfully.', prevKey: 'Sync Status', prevVal: 'Pending', prevBadge: 'bg-amber-100 text-amber-700', nextKey: 'Sync Status', nextVal: 'Completed', nextBadge: 'bg-emerald-100 text-emerald-700', corr: '9d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a', source: 'System Auto-sync', ip: '10.0.0.1', ts: 'May 14, 2025 • 09:31:05 AM (WITA)' },
                  { id: 3, icon: <Zap size={14} className='text-rose-500' />, iconBg: 'bg-rose-50 border-rose-100', channel: 'Website', channelIcon: <Globe2 size={11} className='text-[#6956E8]' />, title: 'Webhook delivery retried successfully', actor: 'SYS', actorRole: 'System', actorAvatar: null, sys: true, badge: 'Success', date: 'May 14, 2025', time: '08:47 AM', action: 'Webhook Retried', summary: 'Failed webhook delivery was retried and succeeded.', prevKey: 'Delivery', prevVal: 'Failed', prevBadge: 'bg-rose-100 text-rose-600', nextKey: 'Delivery', nextVal: 'Success', nextBadge: 'bg-emerald-100 text-emerald-700', corr: '4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b', source: 'System Retry', ip: '10.0.0.1', ts: 'May 14, 2025 • 08:47:33 AM (WITA)' },
                  { id: 4, icon: <Sparkles size={14} className='text-[#6956E8]' />, iconBg: 'bg-violet-50 border-violet-100', channel: 'WhatsApp', channelIcon: <MessageCircle size={11} className='text-[#16A34A]' />, title: 'AI handling set to workspace default', actor: 'Rina Pratiwi', actorRole: 'Outlet Manager', actorAvatar: rinaAvatar, sys: false, badge: 'Info', date: 'May 13, 2025', time: '05:18 PM', action: 'AI Config Changed', summary: 'AI handling mode was changed to use workspace default agent.', prevKey: 'AI Handling', prevVal: 'Override', prevBadge: 'bg-amber-100 text-amber-700', nextKey: 'AI Handling', nextVal: 'Default', nextBadge: 'bg-violet-100 text-violet-700', corr: '5f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c', source: 'KALIS.AI Admin Dashboard', ip: '103.247.12.59', ts: 'May 13, 2025 • 05:18:44 PM (WITA)' },
                  { id: 5, icon: <Users size={14} className='text-[#6956E8]' />, iconBg: 'bg-violet-50 border-violet-100', channel: 'Telegram', channelIcon: <Send size={11} className='text-[#2563EB]' />, title: 'Human team changed', actor: 'Dimas Putra', actorRole: 'Admin', actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=32&h=32&q=80', sys: false, badge: 'Info', date: 'May 13, 2025', time: '03:02 PM', action: 'Team Changed', summary: 'Human escalation team was changed for Telegram channel.', prevKey: 'Team', prevVal: 'CS Team', prevBadge: 'bg-slate-100 text-slate-600', nextKey: 'Team', nextVal: 'Website Team', nextBadge: 'bg-sky-100 text-sky-700', corr: '6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d', source: 'KALIS.AI Admin Dashboard', ip: '103.247.12.60', ts: 'May 13, 2025 • 03:02:11 PM (WITA)' },
                  { id: 6, icon: <Clock3 size={14} className='text-amber-500' />, iconBg: 'bg-amber-50 border-amber-100', channel: 'Website', channelIcon: <Globe2 size={11} className='text-[#6956E8]' />, title: 'Outside-hours behavior updated', actor: 'Siti Aisyah', actorRole: 'Manager', actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&h=32&q=80', sys: false, badge: 'Warning', date: 'May 13, 2025', time: '11:24 AM', action: 'Config Updated', summary: 'Outside-hours behavior was updated for Website channel.', prevKey: 'Behavior', prevVal: 'Reject', prevBadge: 'bg-rose-100 text-rose-600', nextKey: 'Behavior', nextVal: 'Auto-reply', nextBadge: 'bg-emerald-100 text-emerald-700', corr: '7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', source: 'KALIS.AI Admin Dashboard', ip: '103.247.12.58', ts: 'May 13, 2025 • 11:24:58 AM (WITA)' },
                  { id: 7, icon: <MessageCircle size={15} className='text-[#16A34A]' />, iconBg: 'bg-emerald-50 border-emerald-100', channel: 'WhatsApp', channelIcon: <MessageCircle size={12} className='text-[#16A34A]' />, title: 'WhatsApp re-authorization requested', actor: 'SYS', actorRole: 'System', actorAvatar: null, sys: true, badge: 'Warning', date: 'May 12, 2025', time: '04:11 PM', action: 'Auth Requested', summary: 'WhatsApp API token expired and re-authorization was requested.', prevKey: 'Auth Status', prevVal: 'Valid', prevBadge: 'bg-emerald-100 text-emerald-700', nextKey: 'Auth Status', nextVal: 'Expired', nextBadge: 'bg-rose-100 text-rose-600', corr: '8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f', source: 'System Monitor', ip: '10.0.0.1', ts: 'May 12, 2025 • 04:11:02 PM (WITA)' },
                ]
                const badgeStyle = { Success: 'bg-emerald-50 border-emerald-200 text-emerald-700', Info: 'bg-[#F5F3FF] border-violet-200 text-violet-700', Warning: 'bg-[#FFF7E8] border-amber-200 text-amber-700' }
                const sel = activities[selectedActivity] || activities[0]
                const filteredActivities = activities.filter(a => {
                  if (activityChannel !== 'All Channels' && activityChannel !== a.channel) return false
                  if (activityActor !== 'All Actors' && ((activityActor === 'System') !== a.sys)) return false
                  if (activityType !== 'All Types' && activityType !== a.badge) return false
                  if (activitySearch && !a.title.toLowerCase().includes(activitySearch.toLowerCase())) return false
                  return true
                })
                return (
                  <>
                    {/* Description */}
                    <p className='text-xs font-semibold text-slate-500'>Audit trail of configuration changes, sync events, and system activities for this outlet.</p>
 
                    {/* 4 metric cards */}
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                      {[
                        { icon: <Activity size={16} className='text-[#6956E8]' />, iconBg: 'bg-violet-50 border-violet-100', val: '128', label: 'Total Activities', sub: 'Last 30 days' },
                        { icon: <Sliders size={16} className='text-emerald-600' />, iconBg: 'bg-emerald-50 border-emerald-100', val: '42', label: 'Config Changes', sub: '32.8% of total' },
                        { icon: <RefreshCw size={16} className='text-sky-500' />, iconBg: 'bg-sky-50 border-sky-100', val: '63', label: 'Sync Events', sub: '49.2% of total' },
                        { icon: <AlertTriangle size={16} className='text-amber-500' />, iconBg: 'bg-amber-50 border-amber-100', val: '7', label: 'Attention Events', sub: '5.5% of total' },
                      ].map((m, i) => (
                        <div key={i} className='bg-white border border-slate-200/80 rounded-2xl shadow-sm px-4 py-3.5 flex items-center gap-3'>
                          <div className={cx('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', m.iconBg)}>{m.icon}</div>
                          <div>
                            <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none'>{m.label}</span>
                            <span className='block text-xl font-black text-slate-900 leading-tight mt-1'>{m.val}</span>
                            <span className='block text-[9px] text-slate-400 font-semibold mt-1 leading-none'>{m.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
 
                    {/* Filter row */}
                    <div className='flex flex-wrap items-center gap-2'>
                      {[
                        { label: 'Channel', val: activityChannel, setter: setActivityChannel, opts: ['All Channels','WhatsApp','Telegram','Website'] },
                        { label: 'Actor', val: activityActor, setter: setActivityActor, opts: ['All Actors','System','Human'] },
                        { label: 'Action Type', val: activityType, setter: setActivityType, opts: ['All Types','Success','Info','Warning'] },
                      ].map(f => (
                        <div key={f.label} className='flex items-center gap-1.5'>
                          <span className='text-[10px] font-bold text-slate-400'>{f.label}</span>
                          <div className='relative'>
                            <select value={f.val} onChange={e => f.setter(e.target.value)} className='h-8 pl-3 pr-8 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg appearance-none cursor-pointer focus:outline-none'>
                              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <ChevronDown size={11} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                          </div>
                        </div>
                      ))}
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[10px] font-bold text-slate-400'>Date Range</span>
                        <div className='relative select-none cursor-pointer'>
                          <div className='h-8 pl-8 pr-8 text-[10px] font-bold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg flex items-center shadow-sm'>
                            <Calendar size={11} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                            <span>May 8 – May 14, 2025</span>
                            <ChevronDown size={11} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                          </div>
                        </div>
                      </div>
                      <div className='flex-1 min-w-[160px] relative'>
                        <input type='text' placeholder='Search activities...' value={activitySearch} onChange={e => setActivitySearch(e.target.value)} className='w-full h-8 pl-3 pr-8 text-[10px] font-semibold text-slate-700 bg-white border border-[#E1E6EF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6956E8]/30 shadow-sm' />
                        <Search size={12} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                      </div>
                      <button type='button' onClick={() => { setActivityChannel('All Channels'); setActivityActor('All Actors'); setActivityType('All Types'); setActivitySearch('') }} className='h-8 px-3 border border-[#E1E6EF] rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer bg-white shadow-sm'>Clear</button>
                    </div>
 
                    {/* Split panel: Timeline + Detail */}
                    <div className='grid grid-cols-1 lg:grid-cols-[55%_45%] gap-4'>
                      {/* Timeline list */}
                      <div className='bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden'>
                        <div className='relative'>
                          {/* Timeline Line */}
                          <div className='absolute left-[22px] top-6 bottom-6 w-[2px] bg-slate-100' />
                          
                          <div className='divide-y divide-slate-50 relative z-10'>
                            {filteredActivities.map((a) => (
                              <button
                                key={a.id}
                                type='button'
                                onClick={() => setSelectedActivity(a.id)}
                                className={cx(
                                  'w-full text-left px-4 py-3.5 flex items-center gap-3 transition cursor-pointer relative',
                                  selectedActivity === a.id ? 'bg-[#F5F3FF]/45 border-l-[3px] border-[#6956E8]' : 'hover:bg-slate-50/60 border-l-[3px] border-transparent'
                                )}
                              >
                                {/* Timeline dot */}
                                <div className='w-3 flex justify-center shrink-0'>
                                  {selectedActivity === a.id ? (
                                    <div className='w-3 h-3 rounded-full border-2 border-[#6956E8] bg-white flex items-center justify-center'>
                                      <span className='w-1.5 h-1.5 rounded-full bg-[#6956E8]' />
                                    </div>
                                  ) : (
                                    <div className='w-3 h-3 rounded-full border-2 border-slate-300 bg-white' />
                                  )}
                                </div>
                                {/* Channel icon */}
                                <div className={cx('w-8 h-8 rounded-full flex items-center justify-center border shrink-0 shadow-sm bg-white', a.iconBg)}>{a.icon}</div>
                                {/* Actor avatar or SYS */}
                                <div className='w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm'>
                                  {a.sys ? (
                                    <span className='text-[8px] font-extrabold text-slate-500 select-none'>SYS</span>
                                  ) : (
                                    <img
                                      src={a.actorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.actor)}&background=11182e&color=ffffff&size=32`}
                                      alt={a.actor}
                                      className='w-full h-full object-cover shrink-0'
                                    />
                                  )}
                                </div>
                                {/* Content */}
                                <div className='flex-1 min-w-0'>
                                  <span className='block text-[11px] font-extrabold text-slate-800 truncate'>{a.title}</span>
                                  {!a.sys && <span className='block text-[9.5px] text-slate-400 font-semibold mt-0.5'>by {a.actor}</span>}
                                </div>
                                {/* Badge + date */}
                                <div className='flex flex-col items-end gap-1 shrink-0'>
                                  <span className={cx('inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border', badgeStyle[a.badge])}>{a.badge}</span>
                                  <span className='text-[9px] text-slate-400 font-semibold whitespace-nowrap'>{a.date} • {a.time}</span>
                                </div>
                                <ChevronDown size={14} className='text-slate-300 shrink-0 -rotate-90' />
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Pagination */}
                        <div className='px-4 py-3 border-t border-slate-100 bg-[#F8FAFC]/50 flex items-center justify-between select-none'>
                          <span className='text-[9.5px] text-slate-400 font-semibold'>Showing 1–8 of 128 activities</span>
                          <div className='flex items-center gap-1'>
                            {['<','1','2','3','...','16','>'].map((p, i) => (
                              <button key={i} type='button' className={cx('w-7 h-7 rounded-lg text-[10px] font-bold transition cursor-pointer', p === '1' ? 'bg-[#6956E8] text-white' : 'text-slate-500 hover:bg-slate-100')}>{p}</button>
                            ))}
                          </div>
                        </div>
                      </div>
 
                      {/* Detail panel */}
                      <div className='bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col gap-3.5 self-start'>
                        {/* Title + badge */}
                        <div className='flex items-start justify-between gap-2 border-b border-slate-100 pb-3'>
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <div className={cx('w-8 h-8 rounded-full flex items-center justify-center border shadow-sm shrink-0 bg-white', sel.iconBg)}>{sel.icon}</div>
                            <span className='text-xs font-extrabold text-slate-800 leading-tight truncate'>{sel.title}</span>
                          </div>
                          <span className={cx('inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0', badgeStyle[sel.badge])}>{sel.badge}</span>
                        </div>
 
                        {/* Meta grid */}
                        <div className='divide-y divide-slate-50 text-[10px]'>
                          {[
                            { label: 'Actor', val: <div className='flex items-center gap-1.5'><div className='w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200'>{sel.sys ? <span className='text-[7px] font-extrabold text-slate-500'>SYS</span> : <img src={sel.actorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sel.actor)}&background=11182e&color=ffffff&size=24`} alt={sel.actor} className='w-full h-full object-cover shrink-0' />}</div><span className='font-bold text-slate-700'>{sel.actor}</span><span className='px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 leading-none'>{sel.actorRole}</span></div> },
                            { label: 'Channel', val: <div className='flex items-center gap-1.5'><div className={cx('w-5 h-5 rounded-full flex items-center justify-center border shrink-0 bg-white', sel.iconBg)}>{sel.channelIcon}</div><span className='font-bold text-slate-700'>{sel.channel}</span></div> },
                            { label: 'Action', val: <span className='font-bold text-slate-700'>{sel.action}</span> },
                            { label: 'Summary', val: <span className='text-slate-600 font-semibold leading-relaxed'>{sel.summary}</span> },
                          ].map(r => (
                            <div key={r.label} className='py-2.5 flex items-start gap-2'>
                              <span className='text-slate-400 font-bold w-16 shrink-0'>{r.label}</span>
                              <div className='flex-1 min-w-0'>{r.val}</div>
                            </div>
                          ))}
                        </div>
 
                        {/* Change Details */}
                        <div className='border-t border-slate-100 pt-3'>
                          <span className='text-[10px] font-extrabold text-slate-700'>Change Details</span>
                          <div className='mt-2 flex items-center gap-2'>
                            <div className='flex-1 bg-[#F8FAFC] border border-slate-100 rounded-lg p-2.5'>
                              <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>Previous Value</span>
                              <div className='flex items-center gap-1.5 mt-1.5'>
                                <span className='text-[10px] font-extrabold text-slate-700'>{sel.prevKey}</span>
                                <span className={cx('px-1.5 py-0.5 rounded text-[9px] font-extrabold leading-none', sel.prevBadge)}>{sel.prevVal}</span>
                              </div>
                            </div>
                            <ArrowUp size={14} className='text-slate-300 rotate-90 shrink-0' />
                            <div className='flex-1 bg-[#F8FAFC] border border-slate-100 rounded-lg p-2.5'>
                              <span className='block text-[9px] font-bold text-slate-400 uppercase tracking-wider'>New Value</span>
                              <div className='flex items-center gap-1.5 mt-1.5'>
                                <span className='text-[10px] font-extrabold text-slate-700'>{sel.nextKey}</span>
                                <span className={cx('px-1.5 py-0.5 rounded text-[9px] font-extrabold leading-none', sel.nextBadge)}>{sel.nextVal}</span>
                              </div>
                            </div>
                          </div>
                        </div>
 
                        {/* Footer meta */}
                        <div className='divide-y divide-slate-50 text-[10px] border-t border-slate-100 pt-3'>
                          {[
                            { label: 'Correlation ID', val: <div className='flex items-center justify-between gap-1.5 font-mono text-[9px] text-slate-600 truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100'>{sel.corr} <button type='button' onClick={() => { navigator.clipboard?.writeText(sel.corr); alert('Copied Correlation ID to clipboard!') }} className='shrink-0 text-slate-400 hover:text-slate-600 cursor-pointer' title='Copy ID'><Copy size={10} /></button></div> },
                            { label: 'Source', val: <span className='font-bold text-slate-700'>{sel.source}</span> },
                            { label: 'IP Address', val: <span className='font-mono font-bold text-slate-700'>{sel.ip}</span> },
                            { label: 'Timestamp', val: <span className='font-bold text-slate-700'>{sel.ts}</span> },
                          ].map(r => (
                            <div key={r.label} className='py-2.5 flex items-start gap-2'>
                              <span className='text-slate-400 font-bold w-20 shrink-0'>{r.label}</span>
                              <div className='flex-1 min-w-0 overflow-hidden'>{r.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )
              })() : (
                <div className='bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 shadow-sm'>
                  <span className='text-2xl mb-2 block'>⚙️</span>
                  <h4 className='text-sm font-bold text-slate-700'>{activeChannelsTab} Tab Content</h4>
                  <p className='text-xs mt-1'>Configure channel-specific attributes, payloads, and event callbacks.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className='px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0'>
              <button
                type='button'
                onClick={() => {
                  setIsManageChannelsOpen(false)
                  setOutletForChannels(null)
                }}
                className='h-11 px-6 border border-[#D6DCE8] bg-white text-sm font-bold text-[#11182E] rounded-xl transition hover:bg-[#F2F4F8] cursor-pointer'
              >
                Close
              </button>
              <button
                type='button'
                onClick={handleSaveChannels}
                className='h-11 px-6 bg-[#6956E8] hover:bg-[#5b49d3] text-sm font-bold text-white rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer'
              >
                <RefreshCw size={15} /> Save & Sync
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
