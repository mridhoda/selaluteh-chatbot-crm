import butterSaltImage from '../../../assets/product-image/buttersalt.jpg'
import nuttyLatteImage from '../../../assets/product-image/nutty-latte.png'
import saltyCaramelImage from '../../../assets/product-image/salty-caramel.png'
import selkopArenCreamyImage from '../../../assets/product-image/selkop-aren-creamy.png'
import selkopSocietyImage from '../../../assets/product-image/selkop-society.png'
import { PUBLIC_ORDER_STATUS } from '../types/orderStatus.types'
import { calculateCartTotals } from '../utils/calculateDisplayTotal'
import { maskPhone } from '../utils/maskPhone'

export const mockStorefront = {
  id: 'storefront-selaluteh-samarinda',
  slug: 'selaluteh-samarinda',
  name: 'Selkop Samarinda',
  brandName: 'Selkop',
  channel: 'WEB_STORE',
  source: 'QR',
  fulfillmentMethod: 'PICKUP',
  isActive: true,
  theme: {
    primaryColor: 'var(--brand-500)',
    primarySoftColor: 'var(--brand-50)',
    logoUrl: '/logo-selalu-kopi.png',
  },
  outlet: {
    id: 'outlet-smd-001',
    name: 'SELKOP Samarinda',
    address: 'Jl. Mayor Jendral Sutoyo No.9, Sungai Pinang Dalam, Kec. Sungai Pinang, Kota Samarinda, Kalimantan Timur 75123',
    isLockedFromQr: false,
  },
  outlets: [
    {
      id: 'outlet-smd-001',
      name: 'SELKOP Samarinda',
      address: 'Jl. Mayor Jendral Sutoyo No.9, Sungai Pinang Dalam, Kec. Sungai Pinang, Kota Samarinda, Kalimantan Timur 75123',
      distanceLabel: 'Samarinda',
      isAvailable: true,
      isLockedFromQr: false,
    },
    {
      id: 'outlet-smd-002',
      name: 'SELKOP Tenggarong',
      address: 'Jl. K.H. Ahmad Muksin, Timbau, Kec. Tenggarong, Kabupaten Kutai Kartanegara, Kalimantan Timur 75513',
      distanceLabel: 'Tenggarong',
      isAvailable: true,
      isLockedFromQr: false,
    },
  ],
  banner: {
    title: 'Pickup cepat, kopi segar langsung dari outlet',
    subtitle: 'Pilih menu favoritmu, bayar online, lalu ambil saat siap.',
  },
}

export const mockCategories = [
  { id: 'cat-signature', name: 'Signature', sortOrder: 1 },
  { id: 'cat-creamy', name: 'Creamy', sortOrder: 2 },
  { id: 'cat-caramel', name: 'Caramel', sortOrder: 3 },
]

export const mockProducts = [
  {
    id: 'prod-selkop-society',
    categoryId: 'cat-signature',
    name: 'Selkop Society',
    description: '',
    basePriceMinor: 25000,
    originalPriceMinor: 35000,
    imageUrl: selkopSocietyImage,
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
    id: 'prod-selkop-aren-creamy',
    categoryId: 'cat-creamy',
    name: 'Selkop Aren Creamy',
    description: 'Kopi dengan gula aren lokal yang creamy dan manis.',
    basePriceMinor: 15000,
    imageUrl: selkopArenCreamyImage,
    isAvailable: true,
    badges: ['CREAMY'],
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
    id: 'prod-selkop-alpha',
    categoryId: 'cat-signature',
    name: 'Selkop Alpha',
    description: 'Kopi kuat dengan gula aren lokal yang tegas.',
    basePriceMinor: 19000,
    imageUrl: selkopArenCreamyImage,
    isAvailable: true,
    badges: ['BOLD'],
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
    id: 'prod-nutty-latte',
    categoryId: 'cat-creamy',
    name: 'Nutty Latte',
    description: 'Hazelnut latte dengan aroma kacang yang creamy.',
    basePriceMinor: 20000,
    imageUrl: nuttyLatteImage,
    isAvailable: true,
    badges: ['NUTTY'],
    modifierGroups: [],
  },
  {
    id: 'prod-salty-caramel',
    categoryId: 'cat-caramel',
    name: 'Salty Caramel',
    description: 'Sea salt caramel manis dengan sentuhan asin.',
    basePriceMinor: 20000,
    imageUrl: saltyCaramelImage,
    isAvailable: true,
    badges: ['SWEET-SALTY'],
    modifierGroups: [],
  },
  {
    id: 'prod-butter-salt',
    categoryId: 'cat-caramel',
    name: 'Butter Salt',
    description: 'Kombinasi butterscotch yang creamy.',
    basePriceMinor: 20000,
    imageUrl: butterSaltImage,
    isAvailable: true,
    badges: ['CREAMY'],
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
    name: 'Tamu Selkop',
    phoneMasked: maskPhone('6281234567890'),
  },
  outlet: mockStorefront.outlet,
  items: [
    {
      id: 'order-item-1',
      productId: 'prod-selkop-aren-creamy',
      productName: 'Selkop Aren Creamy',
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
