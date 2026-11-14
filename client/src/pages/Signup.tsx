import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';
import Logo from '../components/Logo';
import { playHaptic } from '../lib/sound';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/signup', { email, password });
      playHaptic('complete');
      navigate('/login');
    } catch (err) {
      playHaptic('delete');
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--paper)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation Bar: Theme Switcher */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10 }}>
        <button
          type="button"
          onClick={() => {
            playHaptic('click');
            toggleTheme();
          }}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease',
          }}
          title="Toggle Dark / Light theme"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--moss)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <i className={theme === 'dark' ? "bi bi-sun-fill" : "bi bi-moon-stars-fill"}></i>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
      {/* Ambient Radial Spotlight Mesh */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <Logo size="lg" showBadge />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.025em',
              marginBottom: '0.4rem',
            }}
          >
            Create your account
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Start collaborating with sub-50ms real-time task physics.
          </p>
        </div>

        {/* Auth Card Container */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--border)',
            border: '1px solid var(--border)',
          }}
        >
          {error && (
            <div
              style={{
                background: 'var(--clay-soft)',
                color: 'var(--clay)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(248, 113, 113, 0.3)',
              }}
            >
              <i className="bi bi-x-circle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '0.45rem',
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--moss)';
                  e.target.style.boxShadow = '0 0 0 3px var(--moss-soft)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '0.45rem',
                }}
              >
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.6rem 0.7rem 0.95rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--moss)';
                    e.target.style.boxShadow = '0 0 0 3px var(--moss-soft)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.78rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.35)';
              }}
            >
              <span>{loading ? 'Creating Account...' : 'Get Started with TaskFlow'}</span>
              <i className="bi bi-arrow-right"></i>
            </button>
          </form>

          {/* Switch to Login */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              fontSize: '0.84rem',
              color: 'var(--ink-soft)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--moss)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div
          style={{
            marginTop: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            fontSize: '0.74rem',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="bi bi-broadcast"></i> Instant Sync
          </span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="bi bi-shield-check"></i> Encrypted Sessions
          </span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <i className="bi bi-command"></i> Keyboard First
          </span>
        </div>
      </div>
    </div>
  );
}
