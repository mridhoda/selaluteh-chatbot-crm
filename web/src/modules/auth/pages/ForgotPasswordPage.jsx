import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/httpClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faRobot } from '@fortawesome/free-solid-svg-icons';

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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const r = await api.post('/auth/forgot-password', { email });
      setMessage(r.data.message);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-new-page">
      <AuthNavbar />
      <div className="auth-new-container">
        <div className="auth-new-card">
          <h2>Forgot Password?</h2>
          <p>No worries, we&apos;ll send you reset instructions.</p>

          {error && <p className='auth-new-error'>{error}</p>}
          {message && <p className='auth-new-success'>{message}</p>}

          <form onSubmit={submit} className='auth-new-form'>
            <div className="auth-new-input-group">
              <FontAwesomeIcon icon={faEnvelope} />
              <input
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type='submit' className="lp-btn lp-btn-primary auth-new-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          <div className='auth-new-switch'>
            <Link to='/login'>← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}