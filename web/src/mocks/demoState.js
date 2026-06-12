const DEMO_STORAGE_KEY = 'kalis-demo-state'
const DEMO_MODE_KEY = 'demoMode'
const DEMO_TOKEN = 'demo-token'

const now = Date.now()
const day = 24 * 60 * 60 * 1000

const clone = (value) => JSON.parse(JSON.stringify(value))

const seedState = {
  user: {
    _id: 'demo-user-1',
    name: 'Demo Operator',
    email: 'demo@kalis.ai',
    role: 'super',
    status: 'online',
  },
  billing: {
    plan: 'pro',
    expiry: new Date(now + 30 * day).toISOString(),
    limits: {
      maxAgents: 25,
      maxContacts: 5000,
    },
  },
  platforms: [
    {
      _id: 'plat-1',
      type: 'whatsapp',
      label: 'WhatsApp Official',
      token: 'demo-wa-token',
      accountId: 'wa-001',
      webhookSecret: 'secret-wa',
    },
    {
      _id: 'plat-2',
      type: 'instagram',
      label: 'Instagram DM',
      token: 'demo-ig-token',
      accountId: 'ig-001',
      webhookSecret: 'secret-ig',
    },
  ],
  agents: [
    {
      _id: 'agent-1',
      name: 'SelaluTeh AI',
      platformId: 'plat-1',
      prompt: 'Jawab singkat, ramah, dan bantu pelanggan memilih menu.',
      behavior: 'Friendly sales assistant',
      welcomeMessage: 'Halo, selamat datang di SelaluTeh!',
      status: 'active',
      salesForms: [
        {
          name: 'Default',
          products: [
            { name: 'Es Teh', price: 12000 },
            { name: 'Es Teh Lemon', price: 15000 },
          ],
        },
      ],
    },
  ],
  contacts: [
    {
      _id: 'contact-1',
      name: 'Ayu Putri',
      phone: '081234567890',
      tags: ['repeat'],
      notes: 'Minta update stok es teh lemon',
      platformAccountId: 'wa_ayu_01',
    },
    {
      _id: 'contact-2',
      name: 'Bima',
      phone: '081298765432',
      tags: ['new'],
      notes: '',
      platformAccountId: 'ig_bima_02',
    },
  ],
  chats: [
    {
      _id: 'chat-1',
      contactId: null,
      platformType: 'whatsapp',
      status: 'open',
      unread: 2,
      takeoverBy: null,
      isEscalated: false,
      agentId: 'agent-1',
      lastMessage: 'Mau pesan 2 es teh lemon ya',
      createdAt: new Date(now - 2 * day).toISOString(),
    },
    {
      _id: 'chat-2',
      contactId: null,
      platformType: 'instagram',
      status: 'resolved',
      unread: 0,
      takeoverBy: 'demo-user-1',
      isEscalated: false,
      agentId: 'agent-1',
      lastMessage: 'Terima kasih, sudah dibantu',
      createdAt: new Date(now - day).toISOString(),
    },
  ],
  messages: {
    'chat-1': [
      {
        _id: 'msg-1',
        from: 'user',
        text: 'Halo, masih ada es teh lemon?',
        createdAt: new Date(now - 2 * day + 1000 * 60).toISOString(),
      },
      {
        _id: 'msg-2',
        from: 'ai',
        text: 'Masih ada, kak. Mau pesan berapa?',
        createdAt: new Date(now - 2 * day + 1000 * 60 * 5).toISOString(),
      },
    ],
    'chat-2': [
      {
        _id: 'msg-3',
        from: 'user',
        text: 'Makasih, pesanannya sudah diterima ya?',
        createdAt: new Date(now - day + 1000 * 60).toISOString(),
      },
      {
        _id: 'msg-4',
        from: 'human',
        text: 'Sudah kak, terima kasih!',
        createdAt: new Date(now - day + 1000 * 60 * 8).toISOString(),
      },
    ],
  },
  users: [
    {
      _id: 'human-1',
      name: 'Sinta',
      email: 'sinta@kalis.ai',
      role: 'agent',
    },
    {
      _id: 'human-2',
      name: 'Raka',
      email: 'raka@kalis.ai',
      role: 'super',
    },
  ],
  orders: [
    {
      _id: 'order-1',
      status: 'new',
      contactId: {
        _id: 'contact-1',
        name: 'Ayu Putri',
        phone: '081234567890',
      },
      agentId: 'agent-1',
      formName: 'Default',
      formData: {
        itemName: 'Es Teh Lemon',
        quantity: 2,
        total: 'Rp 30.000',
      },
      createdAt: new Date(now - 5 * day).toISOString(),
    },
  ],
  complaints: [
    {
      _id: 'comp-1',
      status: 'open',
      createdAt: new Date(now - day).toISOString(),
      contactId: {
        _id: 'contact-2',
        name: 'Bima',
        phone: '081298765432',
      },
      text: 'Pesanan terlambat datang 20 menit',
      platformType: 'instagram',
    },
  ],
  analytics: {
    traffic: [
      { _id: new Date(now - 6 * day).toISOString(), count: 12 },
      { _id: new Date(now - 5 * day).toISOString(), count: 18 },
      { _id: new Date(now - 4 * day).toISOString(), count: 9 },
      { _id: new Date(now - 3 * day).toISOString(), count: 21 },
      { _id: new Date(now - 2 * day).toISOString(), count: 16 },
      { _id: new Date(now - day).toISOString(), count: 24 },
      { _id: new Date(now).toISOString(), count: 14 },
    ],
    platforms: [
      { _id: 'WhatsApp', count: 18 },
      { _id: 'Instagram', count: 12 },
      { _id: 'Telegram', count: 6 },
    ],
    agents: [
      { _id: 'SelaluTeh AI', count: 22 },
      { _id: 'Sinta', count: 10 },
    ],
    peakHours: {
      labels: ['08', '10', '12', '14', '16', '18', '20'],
      data: [4, 7, 11, 8, 13, 9, 5],
    },
  },
}

function hasWindow() {
  return typeof window !== 'undefined'
}

export function isDemoMode() {
  if (!hasWindow()) return false
  return (
    import.meta.env.VITE_DEMO_MODE === 'true' ||
    window.sessionStorage.getItem(DEMO_MODE_KEY) === '1'
  )
}

export function setDemoMode(on = true) {
  if (!hasWindow()) return
  if (on) window.sessionStorage.setItem(DEMO_MODE_KEY, '1')
  else window.sessionStorage.removeItem(DEMO_MODE_KEY)
}

export function clearDemoMode() {
  if (!hasWindow()) return
  window.sessionStorage.removeItem(DEMO_MODE_KEY)
  window.sessionStorage.removeItem('token')
  window.sessionStorage.removeItem('user')
  window.localStorage.removeItem('token')
}

export function getDemoUser() {
  return clone(seedState.user)
}

export function getDemoToken() {
  return DEMO_TOKEN
}

function readState() {
  if (!hasWindow()) return clone(seedState)
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted demo storage
  }
  const next = clone(seedState)
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next))
  return next
}

function saveState(state) {
  if (!hasWindow()) return
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}

function nextId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function response(data) {
  return Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  })
}

function getPath(url = '') {
  const clean = url.split('?')[0]
  return clean.startsWith('/') ? clean : `/${clean}`
}

function matchId(path, prefix) {
  return path.startsWith(`${prefix}/`) ? path.slice(prefix.length + 1) : null
}

function applyChatFilters(chats, params = {}) {
  let next = [...chats]
  if (params.search) {
    const q = String(params.search).toLowerCase()
    next = next.filter(
      (chat) =>
        (chat.lastMessage || '').toLowerCase().includes(q) ||
        (chat.contactId?.name || '').toLowerCase().includes(q)
    )
  }
  if (params.status) next = next.filter((chat) => chat.status === params.status)
  if (params.unreadOnly) next = next.filter((chat) => chat.unread > 0)
  return next
}

function ensureContact(chat, state) {
  if (chat.contactId && typeof chat.contactId === 'object') return chat
  const found = state.contacts.find((contact) => contact._id === chat.contactId)
  return { ...chat, contactId: found || null }
}

export async function mockApi(method, url, payload, config = {}) {
  const state = readState()
  const path = getPath(url)
  const params = config?.params || {}

  if (path === '/auth/login' && method === 'post') {
    return response({ token: DEMO_TOKEN, user: clone(state.user) })
  }

  if (path.startsWith('/auth/') && method === 'post') {
    return response({
      message: 'Demo mode active. Backend auth is bypassed for UI review.',
    })
  }

  if (path === '/billing' && method === 'get') return response(clone(state.billing))

  if (path === '/platforms' && method === 'get') return response(clone(state.platforms))

  if (path === '/agents' && method === 'get') return response(clone(state.agents))

  if (path.startsWith('/agents/') && method === 'get') {
    const id = matchId(path, '/agents')
    return response(clone(state.agents.find((agent) => agent._id === id) || null))
  }

  if (path === '/agents' && method === 'post') {
    const next = {
      _id: nextId('agent'),
      name: payload?.name || 'New AI Agent',
      platformId: payload?.platformId || null,
      prompt: payload?.prompt || '',
      behavior: payload?.behavior || '',
      welcomeMessage: payload?.welcomeMessage || '',
      salesForms: payload?.salesForms || [],
      status: 'active',
    }
    state.agents.unshift(next)
    saveState(state)
    return response(clone(next))
  }

  if (path.startsWith('/agents/') && method === 'delete') {
    const id = matchId(path, '/agents')
    state.agents = state.agents.filter((agent) => agent._id !== id)
    saveState(state)
    return response({ ok: true })
  }

  if (path === '/agents/upload' && method === 'post') {
    return response({
      filePath: '/demo/uploads/sample-file.pdf',
      originalName: 'sample-file.pdf',
    })
  }

  if (path === '/users' && method === 'get') return response(clone(state.users))

  if (path === '/users/human' && method === 'post') {
    const next = {
      _id: nextId('human'),
      name: payload?.name || 'New Human',
      email: payload?.email || 'new@demo.local',
      role: payload?.role || 'agent',
    }
    state.users.unshift(next)
    saveState(state)
    return response(clone(next))
  }

  if (path === '/users/profile' && method === 'put') {
    state.user = { ...state.user, ...payload }
    saveState(state)
    if (hasWindow()) {
      window.sessionStorage.setItem('user', JSON.stringify(state.user))
    }
    return response(clone(state.user))
  }

  if (path.startsWith('/users/') && method === 'delete') {
    const id = matchId(path, '/users')
    state.users = state.users.filter((user) => user._id !== id)
    saveState(state)
    return response({ ok: true })
  }

  if (path === '/contacts' && method === 'get') return response(clone(state.contacts))

  if (path.startsWith('/contacts/') && method === 'put') {
    const id = matchId(path, '/contacts')
    const idx = state.contacts.findIndex((contact) => contact._id === id)
    if (idx >= 0) {
      state.contacts[idx] = { ...state.contacts[idx], ...payload }
      saveState(state)
    }
    return response(clone(state.contacts[idx] || null))
  }

  if (path === '/chats' && method === 'get') {
    const filtered = applyChatFilters(
      state.chats.map((chat) => ensureContact(chat, state)),
      params
    )
    return response(clone(filtered))
  }

  if (path.startsWith('/chats/') && path.endsWith('/messages') && method === 'get') {
    const chatId = path.split('/')[2]
    return response(clone(state.messages[chatId] || []))
  }

  if (path.startsWith('/chats/') && path.endsWith('/send') && method === 'post') {
    const chatId = path.split('/')[2]
    const message = {
      _id: nextId('msg'),
      from: 'human',
      text: payload?.text || 'Demo message',
      createdAt: new Date().toISOString(),
      attachment: payload?.attachment || undefined,
    }
    state.messages[chatId] = [...(state.messages[chatId] || []), message]
    const chat = state.chats.find((item) => item._id === chatId)
    if (chat) chat.lastMessage = message.text
    saveState(state)
    return response(clone(message))
  }

  if (path.startsWith('/chats/') && path.endsWith('/takeover') && method === 'post') {
    const chatId = path.split('/')[2]
    const chat = state.chats.find((item) => item._id === chatId)
    if (chat) {
      chat.takeoverBy = state.user._id
      chat.isEscalated = true
    }
    saveState(state)
    return response(clone(ensureContact(chat || {}, state)))
  }

  if (path.startsWith('/chats/') && path.endsWith('/resolve') && method === 'post') {
    const chatId = path.split('/')[2]
    const chat = state.chats.find((item) => item._id === chatId)
    if (chat) chat.status = 'resolved'
    saveState(state)
    return response(clone(ensureContact(chat || {}, state)))
  }

  if (path.startsWith('/chats/') && method === 'put') {
    const chatId = path.split('/')[2]
    const chat = state.chats.find((item) => item._id === chatId)
    if (chat) Object.assign(chat, payload || {})
    saveState(state)
    return response(clone(ensureContact(chat || {}, state)))
  }

  if (path.startsWith('/chats/') && method === 'delete') {
    const chatId = path.split('/')[2]
    state.chats = state.chats.filter((chat) => chat._id !== chatId)
    delete state.messages[chatId]
    saveState(state)
    return response({ ok: true })
  }

  if (path === '/orders' && method === 'get') {
    let next = clone(state.orders)
    if (params?.status && params.status !== 'all') {
      next = next.filter((order) => order.status === params.status)
    }
    return response(next)
  }

  if (path.startsWith('/orders/') && method === 'put') {
    const id = path.split('/')[2]
    const order = state.orders.find((item) => item._id === id)
    if (order) Object.assign(order, payload || {})
    saveState(state)
    return response(clone(order || null))
  }

  if (path.startsWith('/orders/') && method === 'delete') {
    const id = path.split('/')[2]
    state.orders = state.orders.filter((order) => order._id !== id)
    saveState(state)
    return response({ ok: true })
  }

  if (path === '/complaints' && method === 'get') return response(clone(state.complaints))

  if (path === '/complaints' && method === 'post') {
    const next = {
      _id: nextId('comp'),
      status: 'open',
      createdAt: new Date().toISOString(),
      contactId: state.contacts[0] || null,
      text: payload?.text || 'Demo complaint',
      platformType: payload?.platformType || 'whatsapp',
      formData: payload?.formData || {},
    }
    state.complaints.unshift(next)
    saveState(state)
    return response(clone(next))
  }

  if (path.startsWith('/complaints/') && method === 'put') {
    const id = path.split('/')[2]
    const complaint = state.complaints.find((item) => item._id === id)
    if (complaint) Object.assign(complaint, payload || {})
    saveState(state)
    return response(clone(complaint || null))
  }

  if (path.startsWith('/complaints/') && method === 'delete') {
    const id = path.split('/')[2]
    state.complaints = state.complaints.filter((item) => item._id !== id)
    saveState(state)
    return response({ ok: true })
  }

  if (path === '/analytics/traffic' && method === 'get')
    return response(clone(state.analytics.traffic))
  if (path === '/analytics/platforms' && method === 'get')
    return response(clone(state.analytics.platforms))
  if (path === '/analytics/agents' && method === 'get')
    return response(clone(state.analytics.agents))
  if (path === '/analytics/peak-hours' && method === 'get')
    return response(clone(state.analytics.peakHours))

  if (path === '/platforms' && method === 'post') {
    const next = {
      _id: nextId('plat'),
      type: payload?.type || 'telegram',
      label: payload?.label || 'New Platform',
      token: payload?.token || '',
      accountId: payload?.accountId || '',
      webhookSecret: payload?.webhookSecret || '',
      appId: payload?.appId || '',
      appSecret: payload?.appSecret || '',
      phoneNumberId: payload?.phoneNumberId || '',
    }
    state.platforms.unshift(next)
    saveState(state)
    return response(clone(next))
  }

  if (path.startsWith('/platforms/') && method === 'put') {
    const id = path.split('/')[2]
    const platform = state.platforms.find((item) => item._id === id)
    if (platform) Object.assign(platform, payload || {})
    saveState(state)
    return response(clone(platform || null))
  }

  if (path.startsWith('/platforms/') && method === 'delete') {
    const id = path.split('/')[2]
    state.platforms = state.platforms.filter((item) => item._id !== id)
    saveState(state)
    return response({ ok: true })
  }

  if (path.startsWith('/integrations/') && method === 'post') {
    return response({ ok: true })
  }

  if (path.startsWith('/webhook/') && method === 'post') {
    return response({ ok: true })
  }

  return response(method === 'get' ? [] : { ok: true })
}

