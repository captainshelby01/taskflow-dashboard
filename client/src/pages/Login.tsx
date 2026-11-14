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
  const [showEmailForm, setShowEmailForm] = useState(false);
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

  const handleExploreDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    playHaptic('click');
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
        padding: '2.5rem 1.5rem',
        background: 'var(--paper)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Navigation Bar: Theme Toggle */}
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
          title="Toggle Dark mode / Light mode"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--moss)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      {/* Ambient Radial Spotlight Mesh */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '780px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ width: '100%', maxWidth: '490px', position: 'relative', zIndex: 1 }}>
        {/* Brand & Editorial Narrative Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <Logo size="md" showBadge={false} />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.95rem',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.035em',
              lineHeight: 1.2,
              marginBottom: '0.75rem',
            }}
          >
            See what’s putting your next release at risk.
          </h1>

          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: '0.94rem',
              lineHeight: 1.55,
              maxWidth: '430px',
              margin: '0 auto',
            }}
          >
            A planning workspace for small product teams—connecting tasks, dependencies, and decisions in one place.
          </p>
        </div>

        {/* Main Experience Card */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.85rem',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px var(--border)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Sample Release Preview Card (Gives immediate context before clicking) */}
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '1rem 1.15rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#f87171',
                    boxShadow: '0 0 8px rgba(248, 113, 113, 0.6)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#f87171',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Release at risk
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Target: Friday, 20 Nov
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '0.45rem',
              }}
            >
              Checkout Redesign v2.4
            </div>

            {/* Blocked dependency chain preview */}
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.78rem',
                color: 'var(--ink)',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <span style={{ color: '#f87171', fontWeight: 700 }}>⚠ Blocker:</span>
              <span>
                <strong>Payment testing</strong> is blocked by <strong>Bank API approval</strong> (Sarah K. · Overdue 13 Nov)
              </span>
            </div>

            <div
              style={{
                marginTop: '0.65rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.73rem',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>3 of 8 tasks complete</span>
              <span>1 decision attached</span>
            </div>
          </div>

          {/* Primary Action: Explore Live Demo */}
          <button
            type="button"
            onClick={handleExploreDemo}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.95rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.35)';
            }}
          >
            <span>{loading ? 'Entering Workspace...' : 'Explore Live Demo'}</span>
            <span>↵</span>
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.76rem',
              color: 'var(--ink-soft)',
              marginTop: '0.65rem',
              marginBottom: '1.25rem',
            }}
          >
            No account required. Preloaded with the Checkout Redesign release.
          </p>

          {/* Secondary Action: Toggle Email Sign-in */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-soft)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--ink)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--ink-soft)';
              }}
            >
              <span>{showEmailForm ? 'Hide email sign-in' : 'Already have an account? Sign in with email'}</span>
              <span style={{ fontSize: '0.7rem' }}>{showEmailForm ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Collapsible Email Sign-in Form */}
          {showEmailForm && (
            <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
              {error && (
                <div
                  style={{
                    background: 'var(--clay-soft)',
                    color: 'var(--clay)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
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

              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '0.4rem',
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
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--moss)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label
                    htmlFor="password"
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    Password
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
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
                      padding: '0.65rem 2.4rem 0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--paper)',
                      color: 'var(--ink)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--moss)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '0.2rem',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>{loading ? 'Authenticating...' : 'Sign in to account'}</span>
              </button>

              <div style={{ marginTop: '0.85rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                New here?{' '}
                <Link to="/signup" style={{ color: 'var(--moss)', fontWeight: 600, textDecoration: 'none' }}>
                  Create account
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Product-Facing Benefit Indicators (Outcome-driven, no tech bragging) */}
        <div
          style={{
            marginTop: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.78rem',
            color: 'var(--ink-soft)',
          }}
        >
          <span>⚡ Changes sync instantly</span>
          <span>·</span>
          <span>⎇ Visual blocker trace</span>
          <span>·</span>
          <span>✦ Decisions attached to work</span>
        </div>
      </div>
    </div>
  );
}
