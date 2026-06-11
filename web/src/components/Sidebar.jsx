import React from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlug,
  faRobot,
  faUserTie,
  faCog,
  faExclamationCircle,
  faShoppingCart,
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
  return (
    <div className='sidebar'>
      <div>
        <div style={{ paddingTop: 64 }}></div>
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
