import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlug,
  faRobot,
  faUserTie,
  faCog,
  faExclamationCircle,
  faThumbtack,
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
} from '@fortawesome/free-solid-svg-icons'
import {
  faComment,
  faAddressBook,
  faCreditCard,
  faUser,
} from '@fortawesome/free-regular-svg-icons'
import { navigationGroups } from '../../routes/navigation.config'
import api from '../../shared/api/httpClient'

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
  reports: faFileAlt,
  billing: faCreditCard,
  settings: faCog,
  profile: faUser,
}

const activeNavigationKeys = new Set([
  'orders',
  'kitchen-view',
  'products',
  'outlets',
  'payments',
  'chat',
  'platforms',
  'agents',
])

export default function Sidebar() {
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

  useEffect(() => {
    api
      .get('/orders')
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
  }, [])

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
              <span className='logo-title'>Selalu Teh</span>
              <span className='logo-subtitle'>Marketplace</span>
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
        {navigationGroups.map((group) => (
          <div key={group.label} className='sidebar-group'>
            {isSidebarOpen && (
              <div className='sidebar-category-header'>{group.label}</div>
            )}
            <div className='sidebar-items-list'>
              {group.items.map(({ key, label, path }) => {
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
        ))}
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
                <div className='workspace-name'>Selalu Teh</div>
                <div className='workspace-role'>Owner</div>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className='workspace-dropdown-chevron'
              />
            </div>

            {workspaceOpen && (
              <div className='sidebar-workspace-dropdown'>
                <div className='dropdown-item active'>
                  <div className='workspace-dot'></div>
                  <div className='dropdown-workspace-details'>
                    <div className='dropdown-workspace-name'>Selalu Teh</div>
                    <div className='dropdown-workspace-role'>Owner</div>
                  </div>
                </div>
                <div
                  className='dropdown-item'
                  onClick={() => alert('Switching workspace...')}
                >
                  <div className='workspace-dot inactive'></div>
                  <div className='dropdown-workspace-details'>
                    <div className='dropdown-workspace-name'>Kalis Coffee</div>
                    <div className='dropdown-workspace-role'>Member</div>
                  </div>
                </div>
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
