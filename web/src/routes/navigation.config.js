export const navigationGroups = [
  {
    label: 'COMMERCE',
    items: [
      { label: 'Dashboard', path: '/app', key: 'dashboard' },
      { label: 'Orders', path: '/app/orders', key: 'orders', permission: { resource: 'orders', action: 'read' } },
      { label: 'Kitchen View', path: '/app/kitchen', key: 'kitchen-view', permission: { resource: 'orders', action: 'manage_status' } },
      { label: 'Products', path: '/app/products', key: 'products', permission: { resource: 'products', action: 'read' } },
      { label: 'Outlets', path: '/app/outlets', key: 'outlets', permission: { resource: 'outlets', action: 'read' } },
      { label: 'Payments', path: '/app/payments', key: 'payments', permission: { resource: 'payments', action: 'read' } },
      { label: 'QR/Payment Settings', path: '/app/payments/settings', key: 'qr-payment-settings', permission: { resource: 'payments', action: 'read' } },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Chat', path: '/app/chats', key: 'chat', permission: { resource: 'chats', action: 'read' } },
      { label: 'Analytics', path: '/app/analytics', key: 'analytics', permission: { resource: 'analytics', action: 'read' } },
      { label: 'Contacts', path: '/app/contacts', key: 'contacts', permission: { resource: 'contacts', action: 'read' } },
      {
        label: 'Connected Platforms',
        path: '/app/platforms',
        key: 'platforms',
        permission: { resource: 'platforms', action: 'read' },
      },
      { label: 'AI Agents', path: '/app/agents', key: 'agents', permission: { resource: 'ai', action: 'configure' } },
      { label: 'Human Agents', path: '/app/human-agents', key: 'human-agents', permission: { resource: 'access_control', action: 'manage' }, ownerOnly: true },
      { label: 'Complaints', path: '/app/complaints', key: 'complaints', permission: { resource: 'complaints', action: 'read' } },
      { label: 'Escalation Inbox', path: '/app/escalation-inbox', key: 'escalation-inbox', permission: { resource: 'complaints', action: 'read' } },
      { label: 'Escalation Settings', path: '/app/escalation-settings', key: 'escalation-settings', permission: { resource: 'complaints', action: 'read' } },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Reports', path: '/app/reports', key: 'reports', permission: { resource: 'reports', action: 'read' } },
      { label: 'Billing', path: '/app/billing', key: 'billing', permission: { resource: 'billing', action: 'read' } },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Access Control', path: '/app/access-control', key: 'access-control', permission: { resource: 'access_control', action: 'manage' }, ownerOnly: true },
      { label: 'Settings', path: '/app/settings', key: 'settings', permission: { resource: 'settings', action: 'read' } },
      { label: 'Profile', path: '/app/profile', key: 'profile' },
    ],
  },
]
