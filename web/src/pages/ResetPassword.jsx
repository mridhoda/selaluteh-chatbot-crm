import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faRobot } from '@fortawesome/free-solid-svg-icons';

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

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const r = await api.post('/auth/reset-password', { token, password });
      setMessage(r.data.message + ' Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-new-page">
      <AuthNavbar />
      <div className="auth-new-container">
        <div className="auth-new-card">
          <h2>Set a New Password</h2>
          <p>Create a new strong password for your account.</p>

          {error && <p className='auth-new-error'>{error}</p>}
          {message && <p className='auth-new-success'>{message}</p>}

          <form onSubmit={submit} className='auth-new-form'>
            <div className="auth-new-input-group">
                <FontAwesomeIcon icon={faLock} />
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='New Password'
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
            <div className="auth-new-input-group">
                <FontAwesomeIcon icon={faLock} />
                <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm New Password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                 <FontAwesomeIcon 
                    icon={showConfirmPassword ? faEyeSlash : faEye}
                    className="auth-new-eye-icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
            </div>
            
            <button type='submit' className="lp-btn lp-btn-primary auth-new-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}