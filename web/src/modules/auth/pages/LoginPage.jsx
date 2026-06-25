import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../../shared/api/httpClient'
import { registerOrderPushNotifications } from '../../../shared/services/webPush'
import {
  getDemoToken,
  getDemoUser,
  setDemoMode,
} from '../../../mocks/demoState'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faRobot,
} from '@fortawesome/free-solid-svg-icons'

// A consistent navbar for all auth pages
const AuthNavbar = () => (
  <nav className='lp-navbar scrolled'>
    <div className='lp-container lp-navbar-content'>
      <Link to='/' className='lp-logo' style={{ textDecoration: 'none' }}>
        <div className='lp-logo-icon'>
          <FontAwesomeIcon icon={faRobot} />
        </div>
        <span className='lp-logo-text'>KALIS.AI</span>
      </Link>
    </div>
  </nav>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loginDemo = () => {
    setDemoMode(true)
    const token = getDemoToken()
    const user = getDemoUser()
    sessionStorage.setItem('token', token)
    localStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    navigate('/app')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await api.post('/auth/login', { email, password })
      sessionStorage.setItem('token', r.data.token)
      if (remember) localStorage.setItem('token', r.data.token)
      sessionStorage.setItem('user', JSON.stringify(r.data.user))
      registerOrderPushNotifications().catch((err) => {
        console.warn('Order push notification registration failed:', err?.message || err)
      })
      navigate('/app')
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-new-page'>
      <AuthNavbar />
      <div className='auth-new-container'>
        <div className='auth-new-card'>
          <h2>Welcome Back!</h2>
          <p>Login to your KALIS.AI account</p>

          {error && <p className='auth-new-error'>{error}</p>}

          <form onSubmit={submit} className='auth-new-form'>
            <div className='auth-new-input-group'>
              <FontAwesomeIcon icon={faEnvelope} />
              <input
                type='email'
                placeholder='Email address'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='auth-new-input-group'>
              <FontAwesomeIcon icon={faLock} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className='auth-new-eye-icon'
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <div className='auth-new-options'>
              <label className='auth-new-remember'>
                <input
                  type='checkbox'
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link to='/forgot-password'>Forgot password?</Link>
            </div>

            <button
              type='submit'
              className='lp-btn lp-btn-primary auth-new-btn'
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <button
              type='button'
              className='lp-btn auth-new-btn'
              style={{
                marginTop: 10,
                background: '#fff7ed',
                border: '1px solid #fdba74',
                color: '#9a3412',
              }}
              onClick={loginDemo}
            >
              Masuk Demo UI
            </button>
          </form>

          <div className='auth-new-switch'>
            Don&apos;t have an account? <Link to='/register'>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
