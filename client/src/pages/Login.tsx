import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import Logo from '../components/Logo';
import CaseStudyDrawer from '../components/CaseStudyDrawer';
import { playHaptic } from '../lib/sound';
import type { AuthResponse } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isCaseStudyOpen, setIsCaseStudyOpen] = useState(false);
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
        background: 'var(--paper)',
        position: 'relative',
        color: 'var(--ink)',
      }}
    >
      {/* ── Global Top Bar: Brand, Case Study, Theme Toggle ── */}
      <header
        style={{
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Logo size="sm" showBadge={false} />
          <span style={{ color: 'var(--border)', fontSize: '0.9rem' }}>/</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
              color: 'var(--ink-soft)',
              letterSpacing: '0.04em',
            }}
          >
            Release Risk Workspace
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => {
              playHaptic('click');
              setIsCaseStudyOpen(true);
            }}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
            title="Design Engineer case study and design decisions"
          >
            <i className="bi bi-journal-text" style={{ color: 'var(--moss)' }}></i>
            <span>Case Study</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playHaptic('click');
              toggleTheme();
            }}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
            title="Toggle Dark / Light mode"
          >
            <i className={theme === 'dark' ? "bi bi-sun-fill" : "bi bi-moon-stars-fill"}></i>
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Split Hero: Editorial Action + Tangible Risk Map Preview ── */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '3rem 2rem 4rem 2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Problem-First Editorial & One-Click Access */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              marginBottom: '1.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <i className="bi bi-shield-exclamation" style={{ fontSize: '0.75rem' }}></i>
            <span>Release-First Planning</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              marginBottom: '1rem',
            }}
          >
            Your release is not late. It is blocked.
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--ink-soft)',
              marginBottom: '2rem',
              maxWidth: '520px',
            }}
          >
            TaskFlow maps root blockers, downstream work, and attached decisions in one interactive
            workspace—so product teams understand delivery risk before launch day.
          </p>

          {/* Primary Call to Action */}
          <div style={{ maxWidth: '420px', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={handleExploreDemo}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.95rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--moss)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>{loading ? 'Entering Workspace...' : 'Explore Live Demo'}</span>
              <i className="bi bi-arrow-right"></i>
            </button>

            <div
              style={{
                marginTop: '0.65rem',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              No account required · Preloaded with Checkout Redesign v2.4
            </div>
          </div>

          {/* 3 Outcome Proof Points */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
              maxWidth: '480px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
              <i className="bi bi-diagram-3" style={{ color: 'var(--moss)', fontSize: '0.9rem' }}></i>
              <span style={{ color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>Visual Risk Path:</strong> Trace the causal chain
                from root blocker to release deadline.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
              <i className="bi bi-check2-circle" style={{ color: 'var(--moss)', fontSize: '0.9rem' }}></i>
              <span style={{ color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>Decisions Attached to Work:</strong> Document scope
                trade-offs directly beside the task.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
              <i className="bi bi-lightning-charge" style={{ color: 'var(--moss)', fontSize: '0.9rem' }}></i>
              <span style={{ color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>Deterministic &amp; Tactile:</strong> Instant local
                updates and Web Audio mechanical haptics.
              </span>
            </div>
          </div>

          {/* Secondary Collapsible Email Form */}
          <div style={{ marginTop: '2rem', maxWidth: '420px' }}>
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-soft)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: 0,
              }}
            >
              <span>{showEmailForm ? 'Hide email sign-in' : 'Have an existing account? Sign in with email'}</span>
              <i className={showEmailForm ? "bi bi-chevron-up" : "bi bi-chevron-down"} style={{ fontSize: '0.7rem' }}></i>
            </button>

            {showEmailForm && (
              <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                {error && (
                  <div
                    style={{
                      background: 'var(--clay-soft)',
                      color: 'var(--clay)',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.75rem',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(248, 113, 113, 0.3)',
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--ink)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--ink)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
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
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign in
                </button>

                <div style={{ marginTop: '0.65rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  New here?{' '}
                  <Link to="/signup" style={{ color: 'var(--moss)', fontWeight: 600, textDecoration: 'none' }}>
                    Create account
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Tangible Workspace Window Preview */}
        <div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Window Frame Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                background: 'var(--paper)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--ink-soft)',
                }}
              >
                Checkout Redesign v2.4 — Release Risk Map
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', opacity: 0.5 }}>⌘K</span>
            </div>

            {/* Window Content */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Release Header Strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    Checkout Redesign v2.4
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                    Target: Friday, 20 Nov · 3 of 8 complete
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>1 Release Blocker</span>
                </span>
              </div>

              {/* The Visual Causal Chain (The Hero Feature) */}
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-soft)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Causal Dependency Chain
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '0.65rem',
                    alignItems: 'center',
                  }}
                >
                  {/* Node 1 */}
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className="bi bi-exclamation-octagon-fill"></i>
                      <span>BLOCKER · OVERDUE</span>
                    </span>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--ink)', display: 'block', lineHeight: 1.25 }}>
                      Get bank approval &amp; keys
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Sarah K. · Nov 13</span>
                  </div>

                  {/* Arrow */}
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>blocks</span>
                    <i className="bi bi-arrow-right"></i>
                  </div>

                  {/* Node 2 */}
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderLeft: '3px solid #f59e0b',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className="bi bi-pause-circle-fill"></i>
                      <span>PAUSED WORK</span>
                    </span>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--ink)', display: 'block', lineHeight: 1.25 }}>
                      Test checkout payments
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Alex M. · Awaiting keys</span>
                  </div>
                </div>
              </div>

              {/* Blocker Action & Attached Decision Callout */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: '#ef4444' }}>Next Action: </strong>
                  <span style={{ color: 'var(--ink)' }}>
                    Escalate partner bank meeting at 3:00 PM for OAuth sandbox tokens.
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--moss-soft)',
                    border: '1px solid rgba(45, 90, 63, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    lineHeight: 1.45,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.35rem',
                  }}
                >
                  <strong style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="bi bi-check2-circle"></i>
                    <span>Decision Trail:</span>
                  </strong>
                  <span style={{ color: 'var(--ink)' }}>
                    Allow checkout without account to avoid 18% cart drop-off (Elena R. · Nov 11).
                  </span>
                </div>
              </div>

              {/* Enter Live Workspace Action inside Preview */}
              <button
                type="button"
                onClick={handleExploreDemo}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--moss)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <span>Open Live Workspace &amp; Trace Blocker</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Case Study Modal */}
      <CaseStudyDrawer isOpen={isCaseStudyOpen} onClose={() => setIsCaseStudyOpen(false)} />
    </div>
  );
}
