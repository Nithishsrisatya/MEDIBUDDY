import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import '../pages/Login.css';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithProvider } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      setLoading(false);

      if (result.success) {
        // Redirect handled in AuthContext login function
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred during login');
    }
  };

  return (
    <div className="login-form-wrapper">
      <motion.div
        className="login-form-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="login-title">
          Sign in to <span className="highlight">MediBuddy</span>
        </h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="input-field"
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field"
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <PasswordStrengthIndicator password={password} />

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`submit-button ${loading ? 'disabled' : ''}`}
          >
            {loading && (
              <div className="spinner" />
            )}
            {loading ? 'Signing In...' : 'SIGN IN'}
          </motion.button>

          <div className="social-login">
            <motion.button
              type="button"
              onClick={() => loginWithProvider('google')}
              whileHover={{ scale: 1.02 }}
              className="social-button google"
            >
              <FaGoogle /> Continue with Google
            </motion.button>
            <motion.button
              type="button"
              onClick={() => loginWithProvider('facebook')}
              whileHover={{ scale: 1.02 }}
              className="social-button facebook"
            >
              <FaFacebook /> Continue with Facebook
            </motion.button>
          </div>

          <p className="register-text">
            Don’t have an account?{' '}
            <a href="/register" className="register-link">
              Sign Up
            </a>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
