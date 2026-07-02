export const INITIAL_ORDERS = [
  {
    id: '1',
    orderNo: '#ST-250521-1023',
    outlet: 'Danau Murung',
    channel: 'WhatsApp',
    amount: 120000,
    status: 'Completed',
    paymentStatus: 'Paid',
    timestamp: '9:41 AM',
    customerName: 'Ahmad Faisal',
    items: [
      { name: 'Es Teh Manis Jumbo', quantity: 4, price: 15000 },
      { name: 'Teh Melati Premium', quantity: 2, price: 20000 },
      { name: 'Matcha Latte SelaluTeh', quantity: 1, price: 20000 },
    ],
  },
  {
    id: '2',
    orderNo: '#ST-250521-1022',
    outlet: 'Samarinda Kota',
    channel: 'Telegram',
    amount: 85000,
    status: 'Preparing',
    paymentStatus: 'Paid',
    timestamp: '9:32 AM',
    customerName: 'Siti Rahma',
    items: [
      { name: 'Es Teh Lemon', quantity: 3, price: 18000 },
      { name: 'Es Teh Susu Aren', quantity: 1, price: 21000 },
      { name: 'Cemilan Cireng Krispi', quantity: 1, price: 10000 },
    ],
  },
  {
    id: '3',
    orderNo: '#ST-250521-1021',
    outlet: 'Tenggarong',
    channel: 'WhatsApp',
    amount: 145000,
    status: 'Ready',
    paymentStatus: 'Paid',
    timestamp: '9:15 AM',
    customerName: 'Budi Santoso',
    items: [
      { name: 'Teh Oolong Premium', quantity: 2, price: 25000 },
      { name: 'Es Teh Solo Original', quantity: 6, price: 12000 },
      { name: 'Kentang Goreng Keju', quantity: 2, price: 11500 },
    ],
  },
  {
    id: '4',
    orderNo: '#ST-250521-1020',
    outlet: 'Danau Murung',
    channel: 'Instagram',
    amount: 65000,
    status: 'Incoming',
    paymentStatus: 'Pending',
    timestamp: '8:55 AM',
    customerName: 'Diana Putri',
    items: [
      { name: 'Matcha Latte SelaluTeh', quantity: 2, price: 20000 },
      { name: 'Roti Bakar Cokelat', quantity: 1, price: 25000 },
    ],
  },
  {
    id: '5',
    orderNo: '#ST-250521-1019',
    outlet: 'Balikpapan Baru',
    channel: 'Website',
    amount: 95000,
    status: 'Completed',
    paymentStatus: 'Paid',
    timestamp: '8:42 AM',
    customerName: 'Rian Hidayat',
    items: [
      { name: 'Es Teh Solo Original', quantity: 5, price: 12000 },
      { name: 'Es Teh Lemon', quantity: 1, price: 18000 },
      { name: 'Cemilan Singkong Goreng', quantity: 1, price: 17000 },
    ],
  },
];

export const INITIAL_OUTLET_STATS = [
  { id: 'out-1', name: 'Danau Murung', sales: 8450000, change: 18.2, orderCount: 88 },
  { id: 'out-2', name: 'Samarinda Kota', sales: 6780000, change: 15.7, orderCount: 70 },
  { id: 'out-3', name: 'Tenggarong', sales: 5230000, change: 12.1, orderCount: 54 },
  { id: 'out-4', name: 'Balikpapan Baru', sales: 2950000, change: 8.4, orderCount: 31 },
  { id: 'out-5', name: 'Bontang', sales: 1270000, change: 6.2, orderCount: 13 },
];

export const INITIAL_CHANNEL_STATS = [
  { name: 'WhatsApp', orders: 124, sales: 12420000, cvr: 18.9 },
  { name: 'Telegram', orders: 96, sales: 8580000, cvr: 16.5 },
  { name: 'Instagram', orders: 22, sales: 2760000, cvr: 14.2 },
  { name: 'Website', orders: 14, sales: 920000, cvr: 11.3 },
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Order #ST-250521-1023',
    subtitle: 'Danau Murung',
    timestamp: '9:41 AM',
    type: 'order',
    statusLabel: 'Paid',
    statusType: 'success',
  },
  {
    id: 'act-2',
    title: 'Pembayaran Xendit berhasil',
    subtitle: 'Order #ST-250521-1023',
    timestamp: '9:39 AM',
    type: 'payment',
    statusLabel: 'Success',
    statusType: 'success',
  },
  {
    id: 'act-3',
    title: 'Pesan baru dari WhatsApp',
    subtitle: '+62 812-3456-7890',
    timestamp: '9:36 AM',
    type: 'chat',
    statusLabel: 'New Message',
    statusType: 'danger',
  },
  {
    id: 'act-4',
    title: 'Order #ST-250521-1022',
    subtitle: 'Samarinda Kota',
    timestamp: '9:32 AM',
    type: 'order',
    statusLabel: 'Preparing',
    statusType: 'warning',
  },
  {
    id: 'act-5',
    title: 'Broadcast "Promo Spesial" terkirim',
    subtitle: 'WhatsApp • 1285 penerima',
    timestamp: '9:30 AM',
    type: 'broadcast',
    statusLabel: 'Sent',
    statusType: 'info',
  },
];

export const SEVEN_DAYS_SALES = [
  { date: '15 May', amount: 19000000 },
  { date: '16 May', amount: 32000000 },
  { date: '17 May', amount: 27000000 },
  { date: '18 May', amount: 28000000 },
  { date: '19 May', amount: 31000000 },
  { date: '20 May', amount: 25000000 },
  { date: '21 May', amount: 18000000 },
];

export const OUTLET_POPULAR_PRODUCTS = {
  'Danau Murung': [
    { name: 'Es Teh Solo Original', sales: 3200000, qty: 260 },
    { name: 'Matcha Latte SelaluTeh', sales: 2400000, qty: 120 },
    { name: 'Es Teh Lemon', sales: 1500000, qty: 83 },
    { name: 'Cemilan Cireng Krispi', sales: 1350000, qty: 135 },
  ],
  'Samarinda Kota': [
    { name: 'Es Teh Susu Aren', sales: 2500000, qty: 119 },
    { name: 'Es Teh Solo Original', sales: 2100000, qty: 175 },
    { name: 'Teh Melati Premium', sales: 1200000, qty: 60 },
    { name: 'Kentang Goreng Keju', sales: 980000, qty: 85 },
  ],
  Tenggarong: [
    { name: 'Es Teh Solo Original', sales: 2100000, qty: 175 },
    { name: 'Teh Oolong Premium', sales: 1600000, qty: 64 },
    { name: 'Es Teh Lemon', sales: 1100000, qty: 61 },
    { name: 'Roti Bakar Cokelat', sales: 430000, qty: 17 },
  ],
  'Balikpapan Baru': [
    { name: 'Es Teh Solo Original', sales: 1400000, qty: 116 },
    { name: 'Matcha Latte SelaluTeh', sales: 850000, qty: 42 },
    { name: 'Kentang Goreng Keju', sales: 700000, qty: 60 },
  ],
  Bontang: [
    { name: 'Es Teh Solo Original', sales: 800000, qty: 66 },
    { name: 'Es Teh Susu Aren', sales: 470000, qty: 22 },
  ],
};

export const MOCK_CHATS = [
  {
    id: 'c-1',
    sender: 'Sari Kartika',
    number: '+62 821-4455-9088',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    message: 'Halo SelaluTeh, saya mau pesan Es Teh Lemon 5 cup kirim ke Danau Murung ya. Pembayarannya lewat apa aja?',
    timestamp: '9:36 AM',
    channel: 'WhatsApp',
    replied: false,
    aiSuggested: 'Halo Kak Sari! Tentu bisa, Es Teh Lemon 5 cup siap diproses untuk outlet Danau Murung. Pembayaran bisa menggunakan Xendit (E-wallet seperti OVO, GoPay, Dana, QRIS, atau transfer bank). Apakah mau langsung kami buatkan ordernya?',
  },
  {
    id: 'c-2',
    sender: 'Rendy Wijaya',
    number: '@rendy_wijaya',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    message: 'Apakah ada promo diskon khusus untuk pembelian di atas 15 cup?',
    timestamp: '9:15 AM',
    channel: 'Telegram',
    replied: false,
    aiSuggested: 'Halo Kak Rendy! Ya, betul sekali! Untuk pembelian minimal 15 cup, Kakak berhak mendapatkan promo diskon 10% atau Gratis 2 Es Teh Solo Original. Mau kami bantu buatkan pesanannya sekarang?',
  },
  {
    id: 'c-3',
    sender: 'Vivi Amalia',
    number: 'vivi_amll',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    message: 'Min, menu Matcha Latte hari ini masih ready kan di Tenggarong?',
    timestamp: '8:45 AM',
    channel: 'Instagram',
    replied: true,
    aiSuggested: 'Halo Kak Vivi! Matcha Latte SelaluTeh kami sedia melimpah di outlet Tenggarong hari ini. Ditunggu kunjungannya ya Kak!',
  }
];
