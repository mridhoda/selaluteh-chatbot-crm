import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons'

export default function Navbar({ authed, user, plan, className }) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    localStorage.removeItem('token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  const onlineStatusColor = isOnline ? 'var(--lp-green-500)' : 'var(--lp-slate-400)';

  return (
    <div className={`navbar ${className || ''}`}>
      <Link
        to={authed ? '/app' : '/'}
        style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
      >
        <div className='logo'>
          <div className='lp-logo-icon' style={{ width: 32, height: 32, fontSize: 18, borderRadius: 8 }}>
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div>{import.meta.env.VITE_APP_NAME || 'KALIS.AI'}</div>
        </div>
      </Link>
      {!authed ? (
        <div className='row'>
          <Link to='/login' className='btn ghost'>
            Login
          </Link>
          <Link to='/register' className='btn'>
            Daftar Sekarang
          </Link>
        </div>
      ) : (
        <div className='row' style={{ alignItems: 'center' }}>
          <span className='badge'>
            Paket: {plan?.plan?.toUpperCase?.() || 'PRO'}
          </span>
          <div className='badge'>
            Sisa aktif:{' '}
            {plan?.expiry ? new Date(plan.expiry).toLocaleDateString() : '-'}
          </div>
          <div
            ref={dropdownRef}
            style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', margin: 0, padding: 0 }}
          >
            <button
              className='btn ghost'
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', height: '40px' }}
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              {user?.name}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--lp-slate-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: '16px', color: 'var(--muted)' }} />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: onlineStatusColor,
                    border: '1.5px solid white'
                  }}
                ></div>
              </div>
            </button>

            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: '260px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 4,
                  boxShadow: 'var(--shadow)',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 4 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--lp-slate-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FontAwesomeIcon icon={faUser} style={{ fontSize: '20px', color: 'var(--muted)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: onlineStatusColor }}></div>
                    <span style={{ fontSize: '14px', color: 'var(--text)' }}>Online</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={isOnline} onChange={() => setIsOnline(!isOnline)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <button
                  className='btn ghost'
                  style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}