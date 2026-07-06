import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlug,
  faRobot,
  faUserTie,
  faCog,
  faExclamationCircle,
  faBars,
  faStore,
  faFileAlt,
  faLeaf,
  faChevronDown,
  faChevronUp,
  faUserPlus,
  faBuilding,
  faHome,
  faShoppingBag,
  faCube,
  faChartLine,
  faWallet,
  faUtensils,
  faUserShield,
  faBell,
  faSlidersH,
} from '@fortawesome/free-solid-svg-icons'
import {
  faComment,
  faAddressBook,
  faCreditCard,
  faUser,
} from '@fortawesome/free-regular-svg-icons'
import { navigationGroups } from '../../routes/navigation.config'
import api from '../../shared/api/httpClient'
import { canAccessNavItem, getOrderQueryParams, getSessionUser, normalizeRole, permissionsToResourceMap } from '../../shared/auth/permissions'

const navigationIcons = {
  dashboard: faHome,
  orders: faShoppingBag,
  'kitchen-view': faUtensils,
  products: faCube,
  outlets: faStore,
  payments: faWallet,
  chat: faComment,
  analytics: faChartLine,
  contacts: faAddressBook,
  platforms: faPlug,
  agents: faRobot,
  'human-agents': faUserTie,
  complaints: faExclamationCircle,
  'escalation-inbox': faBell,
  'escalation-settings': faSlidersH,
  reports: faFileAlt,
  billing: faCreditCard,
  'access-control': faUserShield,
  settings: faCog,
  profile: faUser,
}

const activeNavigationKeys = new Set([
  'dashboard',
  'orders',
  'kitchen-view',
  'products',
  'outlets',
  'payments',
  'chat',
  'platforms',
  'agents',
  'access-control',
])

function getStoredWorkspace(user) {
  const workspaceId = user?.workspaceId || user?.workspace_id || user?.currentWorkspaceId || user?.workspace?.id
  const workspaceName = user?.workspaceName || user?.workspace_name || user?.workspace?.name
  if (!workspaceId && !workspaceName) return null
  return {
    id: workspaceId || null,
    name: workspaceName || 'Current Workspace',
  }
}

function formatWorkspaceName(name) {
  return String(name || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function getWorkspaceLabel(currentWorkspace, accessUser) {
  return formatWorkspaceName(currentWorkspace?.name || getStoredWorkspace(accessUser)?.name) || 'Current Workspace'
}

function persistSessionUser(updates) {
  const current = getSessionUser() || {}
  const nextUser = { ...current, ...updates }
  sessionStorage.setItem('user', JSON.stringify(nextUser))
  return nextUser
}

export default function Sidebar() {
  const [accessUser, setAccessUser] = useState(() => getSessionUser())
  const role = normalizeRole(accessUser?.workspaceRole || accessUser?.role)
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return localStorage.getItem('sidebarExpanded') === '1'
    } catch {
      return false
    }
  })

  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('sidebarPinned') === '1'
    } catch {
      return false
    }
  })

  const [ordersCount, setOrdersCount] = useState(128)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState([])
  const [currentWorkspace, setCurrentWorkspace] = useState(() => getStoredWorkspace(getSessionUser()))

  const handleSwitchWorkspace = (workspace) => {
    persistSessionUser({
      workspaceId: workspace.id,
      workspaceRole: workspace.role || 'member',
      workspaceName: workspace.name || '',
      workspace: {
        id: workspace.id,
        name: workspace.name || '',
      },
    })
    window.location.reload()
  }

  useEffect(() => {
    // 1. Fetch current workspace details (contains the name)
    api
      .get('/api/workspaces/current', { skipAuthRedirect: true })
      .then((res) => {
        const workspace = res.data?.data || null
        setCurrentWorkspace(workspace)
        if (workspace?.id) {
          persistSessionUser({
            workspaceId: workspace.id,
            workspaceName: workspace.name || '',
            workspace: {
              id: workspace.id,
              name: workspace.name || '',
            },
          })
        }
      })
      .catch((err) => console.warn('Failed to load current workspace', err))

    // 2. Fetch list of all workspaces user belongs to
    api
      .get('/api/workspaces', { skipAuthRedirect: true })
      .then((res) => {
        setWorkspaces(res.data?.data || [])
      })
      .catch((err) => console.warn('Failed to load workspaces list', err))

    // 3. Fetch current workspace permissions & role
    api
      .get('/api/workspaces/current/access', { skipAuthRedirect: true })
      .then((res) => {
        const data = res.data?.data || {}
        const current = getSessionUser() || {}
        const hasCustomPermissions = Array.isArray(data.permissions) && data.permissions.length > 0
        const nextUser = {
          ...current,
          workspaceRole: data.role || current.workspaceRole || current.role,
          workspaceId: data.workspaceId || current.workspaceId,
          workspaceName: current.workspaceName,
          workspace: current.workspace,
          allowedOutletIds: data.allowedOutletIds || [],
          accessPolicy: hasCustomPermissions
            ? { permissions: data.permissions, permissionsByResource: permissionsToResourceMap(data.permissions) }
            : null,
        }
        setAccessUser(nextUser)
        sessionStorage.setItem('user', JSON.stringify(nextUser))
      })
      .catch(() => setAccessUser(getSessionUser()))
  }, [])

  useEffect(() => {
    const user = accessUser || getSessionUser()
    api
      .get('/orders', { params: getOrderQueryParams(user) })
      .then((res) => {
        const rawOrders = Array.isArray(res.data)
          ? res.data
          : res.data && Array.isArray(res.data.data)
            ? res.data.data
            : []
        setOrdersCount(rawOrders.length)
      })
      .catch((err) => {
        // Fallback to default count in case of API failure or offline mode
        console.warn('Could not fetch active order count, using fallback:', err)
      })
  }, [accessUser])

  useEffect(() => {
    try {
      if (isPinned) {
        localStorage.setItem('sidebarPinned', '1')
        localStorage.setItem('sidebarExpanded', '1')
        document.body.classList.add('sidebar-pinned')
        document.body.classList.add('sidebar-expanded')
      } else {
        localStorage.removeItem('sidebarPinned')
        document.body.classList.remove('sidebar-pinned')

        if (isExpanded) {
          localStorage.setItem('sidebarExpanded', '1')
          document.body.classList.add('sidebar-expanded')
        } else {
          localStorage.removeItem('sidebarExpanded')
          document.body.classList.remove('sidebar-expanded')
        }
      }
    } catch {
      // Ignore storage errors in demo/private browsing contexts.
    }
    return () => {
      document.body.classList.remove('sidebar-pinned')
      document.body.classList.remove('sidebar-expanded')
    }
  }, [isPinned, isExpanded])

  // Automatically collapse sidebar when clicking outside (in the middle / content area)
  // ONLY active when expanded but NOT pinned (overlay/drawer mode).
  useEffect(() => {
    if (!isExpanded || isPinned) return

    const handleOutsideClick = (event) => {
      const sidebarEl = document.querySelector('.sidebar')
      if (sidebarEl && !sidebarEl.contains(event.target)) {
        setIsExpanded(false)
      }
    }

    // Delay setting click listener to avoid catching the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [isExpanded, isPinned])

  const handleButtonClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
      setIsPinned(false)
    } else if (!isPinned) {
      setIsPinned(true)
    } else {
      setIsExpanded(false)
      setIsPinned(false)
    }
  }

  const isSidebarOpen = isExpanded || isPinned
  const workspaceLabel = getWorkspaceLabel(currentWorkspace, accessUser)

  return (
    <div
      className={`sidebar ${isSidebarOpen ? 'sidebar--expanded' : ''} ${isPinned ? 'sidebar--pinned' : ''}`}
    >
      {/* Header section */}
      {isSidebarOpen ? (
        <div className='sidebar-header-expanded'>
          <div className='sidebar-logo-container'>
            <div className='sidebar-leaf-logo'>
              <FontAwesomeIcon icon={faLeaf} />
            </div>
            <div className='sidebar-logo-text'>
              <span className='logo-title'>{workspaceLabel}</span>
              <span className='logo-subtitle'>CRM Chatbot</span>
            </div>
          </div>
        </div>
      ) : (
        <div className='sidebar-header-collapsed'>
          <div
            className='sidebar-leaf-logo'
            onClick={() => setIsExpanded(true)}
          >
            <FontAwesomeIcon icon={faLeaf} />
          </div>
        </div>
      )}

      {/* Navigation section */}
      <div className='sidebar-nav-container'>
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccessNavItem(item, accessUser))
          if (visibleItems.length === 0) return null
          return (
          <div key={group.label} className='sidebar-group'>
            {isSidebarOpen && (
              <div className='sidebar-category-header'>{group.label}</div>
            )}
            <div className='sidebar-items-list'>
              {visibleItems.map(({ key, label, path }) => {
                const icon = navigationIcons[key]
                const isOrders = key === 'orders'
                const isInactive = !activeNavigationKeys.has(key)
                return (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/app'}
                    className={({ isActive }) =>
                      `item ${isActive ? 'active' : ''} ${isInactive ? 'item--inactive' : ''}`
                    }
                    onClick={() => {
                      if (isExpanded && !isPinned) {
                        setIsExpanded(false)
                      }
                    }}
                  >
                    <div
                      className='icon'
                      title={!isSidebarOpen ? label : undefined}
                    >
                      <FontAwesomeIcon icon={icon} />
                    </div>
                    {isSidebarOpen && <span className='label'>{label}</span>}
                    {isOrders && isSidebarOpen && (
                      <span className='sidebar-badge'>{ordersCount}</span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        )})}
      </div>

      {/* Footer / Workspace card section */}
      <div className='sidebar-footer'>
        {isSidebarOpen ? (
          <div className='sidebar-workspace-container'>
            <div
              className='sidebar-workspace-header'
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
            >
              <span>Workspace</span>
              <FontAwesomeIcon
                icon={workspaceOpen ? faChevronDown : faChevronUp}
                className='chevron-icon'
              />
            </div>

            <div
              className='sidebar-workspace-card'
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
            >
              <div className='workspace-logo-container'>
                <FontAwesomeIcon icon={faBuilding} />
              </div>
              <div className='workspace-info'>
                <div className='workspace-name'>{workspaceLabel}</div>
                <div className='workspace-role'>{role === 'human_agent' ? 'Agent' : role.replace('_', ' ')}</div>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className='workspace-dropdown-chevron'
              />
            </div>

            {workspaceOpen && (
              <div className='sidebar-workspace-dropdown'>
                {workspaces.map((ws) => {
                  const isActive = ws.id === currentWorkspace?.id
                  return (
                    <div
                      key={ws.id}
                      className={`dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => !isActive && handleSwitchWorkspace(ws)}
                    >
                      <div className={`workspace-dot ${isActive ? '' : 'inactive'}`}></div>
                      <div className='dropdown-workspace-details'>
                        <div className='dropdown-workspace-name'>{ws.name}</div>
                        <div className='dropdown-workspace-role'>
                          {ws.role ? ws.role.replace('_', ' ') : 'Member'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              className='sidebar-invite-btn'
              onClick={() => alert('Invite Members Clicked')}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              <span>Invite Members</span>
            </button>

            <button
              type='button'
              className='sidebar-toggle-action-btn'
              onClick={handleButtonClick}
              title={isPinned ? 'Collapse sidebar' : 'Pin sidebar'}
            >
              <FontAwesomeIcon icon={faBars} />
              <span>
                {isPinned ? 'Pinned (Click to collapse)' : 'Pin Sidebar'}
              </span>
            </button>
          </div>
        ) : (
          <button
            type='button'
            className='sidebar-toggle-collapsed-btn'
            onClick={handleButtonClick}
            title='Expand sidebar'
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        )}
      </div>
    </div>
  )
}
