import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faRobot } from '@fortawesome/free-solid-svg-icons';

// A consistent navbar for all auth pages
const AuthNavbar = () => (
    <nav className="lp-navbar scrolled">
        <div className="lp-container lp-navbar-content">
             <Link to="/" className="lp-logo" style={{ textDecoration: 'none' }}>
                <div className="lp-logo-icon"><FontAwesomeIcon icon={faRobot} /></div>
                <span className="lp-logo-text">KALIS.AI</span>
             </Link>
        </div>
    </nav>
);

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      setMsg('Registration successful! Redirecting to verification...');
      setTimeout(() => navigate('/verify?email=' + encodeURIComponent(email)), 1200);
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-new-page">
      <AuthNavbar />
      <div className="auth-new-container">
        <div className="auth-new-card">
          <h2>Create your Account</h2>
          <p>Start your journey with KALIS.AI today</p>

          {error && <p className='auth-new-error'>{error}</p>}
          {msg && <p className='auth-new-success'>{msg}</p>}

          <form onSubmit={submit} className='auth-new-form'>
            <div className="auth-new-input-group">
                <FontAwesomeIcon icon={faUser} />
                <input
                    type='text'
                    placeholder='Full Name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div className="auth-new-input-group">
              <FontAwesomeIcon icon={faEnvelope} />
              <input
                type='email'
                placeholder='Email address'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-new-input-group">
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
                  className="auth-new-eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                />
            </div>

            <button type='submit' className="lp-btn lp-btn-primary auth-new-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className='auth-new-switch'>
            Already have an account? <Link to='/login'>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}