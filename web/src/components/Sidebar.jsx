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
} from '@fortawesome/free-solid-svg-icons'
import {
  faComment,
  faChartBar,
  faAddressBook,
  faCreditCard,
  faUser,
} from '@fortawesome/free-regular-svg-icons'

const topItems = [
  [faComment, 'Chat', '/app'],
  ['divider'],
  [faChartBar, 'Analytics', '/app/analytics'],
  [faAddressBook, 'Contacts', '/app/contacts'],
  ['divider'],
  [faPlug, 'Connected Platforms', '/app/platforms'],
  [faRobot, 'AI Agents', '/app/agents'],
  [faUserTie, 'Human Agents', '/app/humans'],
  [faExclamationCircle, 'Complaints', '/app/complaints'],
  [faShoppingCart, 'Orders', '/app/orders'],
]

const bottomItems = [
  [faCog, 'Settings', '/app/settings'],
  [faCreditCard, 'Billing', '/app/billing'],
  [faUser, 'Profile', '/app/profile'],
]

export default function Sidebar() {
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
        document.body.classList.add('sidebar-pinned')
      } else {
        localStorage.removeItem('sidebarPinned')
        document.body.classList.remove('sidebar-pinned')
      }
    } catch {
      // Ignore storage errors in demo/private browsing contexts.
    }
    return () => {
      document.body.classList.remove('sidebar-pinned')
    }
  }, [isPinned])

  return (
    <div className={`sidebar ${isPinned ? 'sidebar--pinned' : ''}`}>
      <div className='sidebar-header'>
        <button
          type='button'
          className={`sidebar-pin-btn ${isPinned ? 'is-active' : ''}`}
          onClick={() => setIsPinned((prev) => !prev)}
          aria-pressed={isPinned}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          <FontAwesomeIcon icon={faThumbtack} />
          <span className='sidebar-pin-label'>
            {isPinned ? 'Pinned' : 'Pin'}
          </span>
        </button>
      </div>
      <div>
        <div style={{ paddingTop: 12 }}></div>
        {topItems.map((item, index) => {
          if (item[0] === 'divider') {
            return <div key={index} className='divider'></div>
          }
          const [icon, label, href] = item
          return (
            <NavLink
              key={href}
              to={href}
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
      <div>
        {bottomItems.map(([icon, label, href]) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) => `item ${isActive ? 'unread' : ''}`}
          >
            <div className='icon' title={label}>
              <FontAwesomeIcon icon={icon} />
            </div>
            <div className='label'>{label}</div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
