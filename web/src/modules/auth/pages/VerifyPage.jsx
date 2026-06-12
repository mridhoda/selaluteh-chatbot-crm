import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../../shared/api/httpClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faRobot, faEnvelope } from '@fortawesome/free-solid-svg-icons';

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

export default function Verify() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const e = sp.get('email');
    if (e) setEmail(e);
  }, [sp]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      await api.post('/auth/verify', { email, code });
      setMsg('Verification successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setError(e.response?.data?.error || 'Verification failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="auth-new-page">
      <AuthNavbar />
      <div className="auth-new-container">
        <div className="auth-new-card">
          <h2>Verify Your Account</h2>
          <p>Enter the 6-digit code sent to your email.</p>

          {error && <p className='auth-new-error'>{error}</p>}
          {msg && <p className='auth-new-success'>{msg}</p>}

          <form onSubmit={submit} className='auth-new-form'>
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
              <FontAwesomeIcon icon={faKey} />
              <input
                type='text'
                placeholder='6-digit OTP Code'
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength="6"
              />
            </div>
            
            <button type='submit' className="lp-btn lp-btn-primary auth-new-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

           <div className='auth-new-switch'>
            Didn&apos;t get a code? <Link to='/forgot-password'>Resend it</Link>
          </div>
        </div>
      </div>
    </div>
  );
}