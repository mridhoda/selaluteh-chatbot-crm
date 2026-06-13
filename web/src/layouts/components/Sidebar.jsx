import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlug,
  faRobot,
  faUserTie,
  faCog,
  faExclamationCircle,
  faShoppingCart,
  faThumbtack,
  faBars,
  faBoxOpen,
  faStore,
  faFileAlt,
  faTachometerAlt,
} from '@fortawesome/free-solid-svg-icons'
import {
  faComment,
  faChartBar,
  faAddressBook,
  faCreditCard,
  faUser,
} from '@fortawesome/free-regular-svg-icons'
import { navigationGroups } from '../../routes/navigation.config'

const navigationIcons = {
  dashboard: faTachometerAlt,
  orders: faShoppingCart,
  products: faBoxOpen,
  outlets: faStore,
  chat: faComment,
  analytics: faChartBar,
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

const topGroups = navigationGroups.filter((group) => group.label !== 'SETTINGS')
const bottomItems = navigationGroups.find((group) => group.label === 'SETTINGS')?.items || []

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

  return (
    <div className={`sidebar ${isExpanded ? 'sidebar--expanded' : ''} ${isPinned ? 'sidebar--pinned' : ''}`}>
      <div className='sidebar-header'>
        <button
          type='button'
          className={`sidebar-pin-btn ${isPinned ? 'is-active' : ''}`}
          onClick={handleButtonClick}
          aria-pressed={isPinned || isExpanded}
          title={
            !isExpanded 
              ? 'Open sidebar' 
              : !isPinned 
                ? 'Pin sidebar' 
                : 'Collapse sidebar'
          }
        >
          <FontAwesomeIcon icon={!isExpanded ? faBars : faThumbtack} />
          <span className='sidebar-pin-label'>
            {!isExpanded ? 'Sidebar' : !isPinned ? 'Pin' : 'Pinned'}
          </span>
        </button>
      </div>
      <div>
        <div style={{ paddingTop: 12 }}></div>
        {topGroups.map((group, groupIndex) => (
          <React.Fragment key={group.label}>
            {groupIndex > 0 && <div className='divider'></div>}
            {group.items.map(({ key, label, path }) => {
              const icon = navigationIcons[key]
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `item ${isActive ? 'unread' : ''}`}
                >
                  <div className='icon' title={label}>
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  <div className='label'>{label}</div>
                </NavLink>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      <div>
        {bottomItems.map(({ key, label, path }) => {
          const icon = navigationIcons[key]
          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `item ${isActive ? 'unread' : ''}`}
            >
              <div className='icon' title={label}>
                <FontAwesomeIcon icon={icon} />
              </div>
              <div className='label'>{label}</div>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
