import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

export function renderPublicRoute(element, options = {}) {
  const route = options.route || '/store/selalu-kopi'
  return renderToString(
    React.createElement(MemoryRouter, { initialEntries: [route] }, element),
  )
}

export function renderAdminRoute(element, options = {}) {
  const route = options.route || '/app/orders'
  const user = options.user || createAdminUserFixture()
  const session = {
    token: options.token || 'test-admin-token',
    user,
    workspaceId: user.workspaceId,
  }

  return {
    html: renderToString(
      React.createElement(MemoryRouter, { initialEntries: [route] }, element),
    ),
    session,
  }
}

export function createAdminUserFixture(overrides = {}) {
  return {
    id: 'admin-user-test-001',
    email: 'admin@example.test',
    name: 'Phase 5 Admin Tester',
    role: 'owner',
    workspaceId: 'workspace-selkop-test',
    ...overrides,
  }
}
