import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import Logo from '../components/Logo';
import { playHaptic } from '../lib/sound';
import type { AuthResponse } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLoginSubmit = async (loginEmail: string, loginPass: string) => {
    setError('');
    setLoading(true);

    try {
      const data = await api.post<AuthResponse>('/api/auth/login', {
        email: loginEmail,
        password: loginPass,
      });
      playHaptic('pickup');
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      playHaptic('delete');
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const handleDemoLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    playHaptic('click');
    setEmail('demo@taskflow.dev');
    setPassword('password123');
    handleLoginSubmit('demo@taskflow.dev', 'password123');
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
          title="Toggle Obsidian Dark / Light theme"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--moss)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light' : 'Obsidian'}</span>
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
            Welcome back
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Real-time project velocity engineered for high-output teams.
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
          {/* 1-Click Fast Demo Login for Reviewers & Employers */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(74, 222, 128, 0.4)',
              background: 'var(--moss-soft)',
              color: 'var(--moss)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(74, 222, 128, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>⚡</span>
            <span>One-Click Demo Access (Reviewer Mode)</span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              or continue with email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

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
              <span>✕</span>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.45rem',
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  Password
                </label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Demo: password123
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
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
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
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
              <span>{loading ? 'Authenticating...' : 'Sign In to TaskFlow'}</span>
              <span>↵</span>
            </button>
          </form>

          {/* Switch to Signup */}
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
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: 'var(--moss)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create an account
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
          <span>⚡ WebSocket Sync</span>
          <span>·</span>
          <span>🔒 JWT Auth</span>
          <span>·</span>
          <span>⌘K Keyboard First</span>
        </div>
      </div>
    </div>
  );
}
