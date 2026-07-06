import { PUBLIC_ORDER_STATUS } from '../types/orderStatus.types'
import { calculateCartTotals } from '../utils/calculateDisplayTotal'
import { maskPhone } from '../utils/maskPhone'

export const mockStorefront = {
  id: 'storefront-selaluteh-samarinda',
  slug: 'selaluteh-samarinda',
  name: 'SelaluTeh Samarinda',
  brandName: 'SelaluTeh',
  channel: 'WEB_STORE',
  source: 'QR',
  fulfillmentMethod: 'PICKUP',
  isActive: true,
  theme: {
    primaryColor: '#166534',
    primarySoftColor: '#dcfce7',
    logoUrl: '',
  },
  outlet: {
    id: 'outlet-smd-001',
    name: 'SelaluTeh Samarinda Kota',
    address: 'Jl. Juanda No. 18, Samarinda',
    isLockedFromQr: false,
  },
  outlets: [
    {
      id: 'outlet-smd-001',
      name: 'Samarinda Kota',
      address: 'Jl. Juanda No. 18, Samarinda',
      distanceLabel: '32.000 m',
      isAvailable: true,
      isLockedFromQr: false,
    },
    {
      id: 'outlet-smd-002',
      name: 'Samarinda Seberang',
      address: 'Jl. Mulawarman No. 45, Samarinda',
      distanceLabel: '35.000 m',
      isAvailable: true,
      isLockedFromQr: false,
    },
    {
      id: 'outlet-smd-003',
      name: 'Samarinda Ulu',
      address: 'Jl. Datuk Setia Maharaja No. 27, Samarinda',
      distanceLabel: '38.000 m',
      isAvailable: true,
      isLockedFromQr: false,
    },
    {
      id: 'outlet-bpp-001',
      name: 'Balikpapan Center',
      address: 'Jl. Jend. Sudirman No. 88, Balikpapan',
      distanceLabel: '120.000 m',
      isAvailable: true,
      isLockedFromQr: false,
    },
  ],
  banner: {
    title: 'Pickup cepat, teh segar langsung dari outlet',
    subtitle: 'Pilih menu favoritmu, bayar online, lalu ambil saat siap.',
  },
}

export const mockCategories = [
  { id: 'cat-signature', name: 'Signature', sortOrder: 1 },
  { id: 'cat-milk-tea', name: 'Milk Tea', sortOrder: 2 },
  { id: 'cat-snack', name: 'Snack', sortOrder: 3 },
]

export const mockProducts = [
  {
    id: 'prod-jasmine-tea',
    categoryId: 'cat-signature',
    name: 'Jasmine Tea Selalu Segar',
    description: 'Teh melati dingin dengan aroma ringan dan gula aren pilihan.',
    basePriceMinor: 14000,
    imageUrl: '',
    isAvailable: true,
    badges: ['NEW'],
    modifierGroups: [
      {
        id: 'grp-sugar-jasmine',
        title: 'Level Gula',
        isRequired: true,
        type: 'SINGLE',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'opt-sugar-normal', name: 'Normal', priceDeltaMinor: 0, isAvailable: true },
          { id: 'opt-sugar-less', name: 'Less Sugar', priceDeltaMinor: 0, isAvailable: true },
          { id: 'opt-sugar-zero', name: 'No Sugar', priceDeltaMinor: 0, isAvailable: true },
        ],
      },
      {
        id: 'grp-topping-jasmine',
        title: 'Topping',
        isRequired: false,
        type: 'MULTIPLE',
        minSelect: 0,
        maxSelect: 2,
        options: [
          { id: 'opt-boba', name: 'Boba', priceDeltaMinor: 4000, isAvailable: true },
          { id: 'opt-grass-jelly', name: 'Grass Jelly', priceDeltaMinor: 3000, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: 'prod-lychee-tea',
    categoryId: 'cat-signature',
    name: 'Lychee Tea Spark',
    description: 'Teh buah leci dengan sensasi segar untuk siang hari.',
    basePriceMinor: 18000,
    imageUrl: '',
    isAvailable: true,
    badges: ['PROMO'],
    modifierGroups: [
      {
        id: 'grp-ice-lychee',
        title: 'Level Es',
        isRequired: true,
        type: 'SINGLE',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'opt-ice-normal', name: 'Es Normal', priceDeltaMinor: 0, isAvailable: true },
          { id: 'opt-ice-less', name: 'Less Ice', priceDeltaMinor: 0, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: 'prod-brown-sugar',
    categoryId: 'cat-milk-tea',
    name: 'Brown Sugar Milk Tea',
    description: 'Milk tea creamy dengan brown sugar dan boba lembut.',
    basePriceMinor: 22000,
    imageUrl: '',
    isAvailable: true,
    modifierGroups: [
      {
        id: 'grp-topping-milk',
        title: 'Topping',
        isRequired: true,
        type: 'SINGLE',
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: 'opt-boba', name: 'Boba', priceDeltaMinor: 4000, isAvailable: true },
          { id: 'opt-pudding', name: 'Pudding', priceDeltaMinor: 3500, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: 'prod-taro',
    categoryId: 'cat-milk-tea',
    name: 'Taro Milk Tea',
    description: 'Taro lembut, susu segar, dan teh ringan.',
    basePriceMinor: 21000,
    imageUrl: '',
    isAvailable: false,
    availabilityLabel: 'Sold Out',
    badges: ['SOLD_OUT'],
    modifierGroups: [],
  },
  {
    id: 'prod-toast',
    categoryId: 'cat-snack',
    name: 'Roti Panggang Kaya',
    description: 'Snack manis untuk teman minum teh.',
    basePriceMinor: 16000,
    imageUrl: '',
    isAvailable: true,
    modifierGroups: [],
  },
]

export const mockCart = {
  id: 'guest-cart-mock',
  storefrontId: mockStorefront.id,
  outletId: mockStorefront.outlet.id,
  items: [],
  totals: calculateCartTotals([]),
}

export const mockPublicOrder = {
  orderNumber: 'STH-240706-018',
  queueNumber: 'A18',
  status: PUBLIC_ORDER_STATUS.PREPARING,
  customer: {
    name: 'Tamu SelaluTeh',
    phoneMasked: maskPhone('6281234567890'),
  },
  outlet: mockStorefront.outlet,
  items: [
    {
      id: 'order-item-1',
      productId: 'prod-brown-sugar',
      productName: 'Brown Sugar Milk Tea',
      quantity: 1,
      selectedModifierOptionIds: ['opt-boba'],
      modifierSummary: ['Boba'],
      unitPriceMinor: 26000,
      lineTotalMinor: 26000,
    },
  ],
  totals: calculateCartTotals([{ lineTotalMinor: 26000 }]),
  invoice: {
    downloadUrl: '#mock-invoice-download',
    shareUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/store/order/mock-public-order`,
  },
}
