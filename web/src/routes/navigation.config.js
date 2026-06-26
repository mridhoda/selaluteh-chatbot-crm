export const navigationGroups = [
  {
    label: 'COMMERCE',
    items: [
      { label: 'Dashboard', path: '/app', key: 'dashboard' },
      { label: 'Orders', path: '/app/orders', key: 'orders' },
      { label: 'Kitchen View', path: '/app/kitchen', key: 'kitchen-view' },
      { label: 'Products', path: '/app/products', key: 'products' },
      { label: 'Outlets', path: '/app/outlets', key: 'outlets' },
      { label: 'Payments', path: '/app/payments', key: 'payments' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Chat', path: '/app/chats', key: 'chat' },
      { label: 'Analytics', path: '/app/analytics', key: 'analytics' },
      { label: 'Contacts', path: '/app/contacts', key: 'contacts' },
      {
        label: 'Connected Platforms',
        path: '/app/platforms',
        key: 'platforms',
      },
      { label: 'AI Agents', path: '/app/agents', key: 'agents' },
      { label: 'Human Agents', path: '/app/human-agents', key: 'human-agents' },
      { label: 'Complaints', path: '/app/complaints', key: 'complaints' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Reports', path: '/app/reports', key: 'reports' },
      { label: 'Billing', path: '/app/billing', key: 'billing' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Access Control', path: '/app/access-control', key: 'access-control' },
      { label: 'Settings', path: '/app/settings', key: 'settings' },
      { label: 'Profile', path: '/app/profile', key: 'profile' },
    ],
  },
]
