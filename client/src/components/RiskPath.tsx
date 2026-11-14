import type { Card } from '../types';
import { playHaptic } from '../lib/sound';

interface RiskPathProps {
  cards: Card[];
  onSelectCard: (card: Card) => void;
  onResolveBlocker: () => Promise<void>;
  onResetScenario: () => Promise<void>;
  isResolving?: boolean;
}

export default function RiskPath({
  cards,
  onSelectCard,
  onResolveBlocker,
  onResetScenario,
  isResolving = false,
}: RiskPathProps) {
  // Find the blocker card and the dependent card
  const blockerCard = cards.find((c) => c.isBlocker || c.id === 'card-api-approval');
  const dependentCard = cards.find((c) => c.blockedBy || c.id === 'card-payment-testing');

  // Check if blocker is resolved (e.g. status is done or isBlocker is false)
  const isBlockerResolved = blockerCard?.status === 'done' || !blockerCard?.isBlocker;

  const handleNodeClick = (card?: Card) => {
    if (card) {
      playHaptic('click');
      onSelectCard(card);
    }
  };

  return (
    <section
      aria-label="Release Risk Path"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Risk Path Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="bi bi-diagram-3-fill" style={{ color: 'var(--moss)' }}></i> Release Risk Path
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              background: isBlockerResolved
                ? 'rgba(45, 90, 63, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              color: isBlockerResolved ? 'var(--moss)' : '#ef4444',
              border: `1px solid ${
                isBlockerResolved ? 'rgba(45, 90, 63, 0.25)' : 'rgba(239, 68, 68, 0.25)'
              }`,
            }}
          >
            <i className={isBlockerResolved ? "bi bi-check-circle-fill" : "bi bi-exclamation-octagon-fill"} style={{ fontSize: '0.7rem' }}></i>
            <span>{isBlockerResolved ? 'ON TRACK — CLEAR TO SHIP' : 'AT RISK — DELIVERY BLOCKED'}</span>
          </span>
        </div>

        {/* Interactive Simulation Controls for Reviewers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isBlockerResolved ? (
            <button
              onClick={() => {
                playHaptic('complete');
                onResolveBlocker();
              }}
              disabled={isResolving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--moss)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.75rem',
                cursor: isResolving ? 'not-allowed' : 'pointer',
                opacity: isResolving ? 0.7 : 1,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
              title="Test resolving the blocker and unblocking payment testing"
            >
              <i className="bi bi-lightning-charge-fill"></i>
              <span>{isResolving ? 'Resolving...' : 'Simulate Clearing Blocker'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playHaptic('pickup');
                onResetScenario();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.74rem',
                fontWeight: 500,
                color: 'var(--ink-soft)',
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.65rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Reset scenario back to initial blocked state"
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Reset Scenario</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Node Causal Pipeline */}
      <div className="risk-path-pipeline">
        {/* Node 1: Root Blocker */}
        <div
          onClick={() => handleNodeClick(blockerCard)}
          style={{
            background: 'var(--surface)',
            border: `1px solid ${
              isBlockerResolved ? 'var(--border)' : 'rgba(239, 68, 68, 0.4)'
            }`,
            borderLeft: `3.5px solid ${isBlockerResolved ? 'var(--moss)' : '#ef4444'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
            cursor: blockerCard ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
          }}
          title={blockerCard ? 'Click to inspect blocker details' : undefined}
          onMouseEnter={(e) => {
            if (blockerCard) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: isBlockerResolved ? 'var(--moss)' : '#ef4444',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              {isBlockerResolved ? (
                <>
                  <i className="bi bi-check-circle-fill"></i> RESOLVED
                </>
              ) : (
                <>
                  <i className="bi bi-exclamation-octagon-fill"></i> ROOT BLOCKER
                </>
              )}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                color: 'var(--ink-soft)',
              }}
            >
              #TF-OVAL
            </span>
          </div>

          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.3,
              marginBottom: '0.25rem',
            }}
          >
            {blockerCard?.title || 'Get bank approval & sandbox keys'}
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--ink-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Sarah K.</span>
            <span>·</span>
            <span style={{ color: isBlockerResolved ? 'var(--moss)' : '#ef4444' }}>
              {isBlockerResolved ? 'Keys provisioned' : 'Overdue Nov 13'}
            </span>
          </div>
        </div>

        {/* Connector 1 (Desktop Horizontal) */}
        <div
          className="risk-connector-horizontal"
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.25rem',
            color: isBlockerResolved ? 'var(--moss)' : '#ef4444',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.66rem',
            fontWeight: 700,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          <span>{isBlockerResolved ? 'cleared' : 'blocks'}</span>
          <i className="bi bi-arrow-right" style={{ fontSize: '0.95rem' }}></i>
        </div>

        {/* Connector 1 (Mobile Vertical) */}
        <div
          className="risk-connector-vertical"
          style={{
            color: isBlockerResolved ? 'var(--moss)' : '#ef4444',
          }}
        >
          <span>{isBlockerResolved ? 'cleared' : 'blocks'}</span>
          <i className="bi bi-arrow-down" style={{ fontSize: '0.9rem' }}></i>
        </div>

        {/* Node 2: Dependent Work */}
        <div
          onClick={() => handleNodeClick(dependentCard)}
          style={{
            background: 'var(--surface)',
            border: `1px solid ${
              isBlockerResolved ? 'var(--border)' : 'rgba(245, 158, 11, 0.4)'
            }`,
            borderLeft: `3.5px solid ${isBlockerResolved ? 'var(--moss)' : '#f59e0b'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
            cursor: dependentCard ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
          }}
          title={dependentCard ? 'Click to inspect dependent work' : undefined}
          onMouseEnter={(e) => {
            if (dependentCard) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: isBlockerResolved ? 'var(--moss)' : '#f59e0b',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              {isBlockerResolved ? (
                <>
                  <i className="bi bi-check-circle-fill"></i> UNBLOCKED
                </>
              ) : (
                <>
                  <i className="bi bi-pause-circle-fill"></i> PAUSED WORK
                </>
              )}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                color: 'var(--ink-soft)',
              }}
            >
              #TF-TING
            </span>
          </div>

          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.3,
              marginBottom: '0.25rem',
            }}
          >
            {dependentCard?.title || 'Test checkout payments & 3D Secure'}
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--ink-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Alex M.</span>
            <span>·</span>
            <span>{isBlockerResolved ? 'Ready to execute' : 'Waiting on keys'}</span>
          </div>
        </div>

        {/* Connector 2 (Desktop Horizontal) */}
        <div
          className="risk-connector-horizontal"
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.25rem',
            color: isBlockerResolved ? 'var(--moss)' : 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.66rem',
            fontWeight: 700,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          <span>{isBlockerResolved ? 'enables' : 'threatens'}</span>
          <i className="bi bi-arrow-right" style={{ fontSize: '0.95rem' }}></i>
        </div>

        {/* Connector 2 (Mobile Vertical) */}
        <div
          className="risk-connector-vertical"
          style={{
            color: isBlockerResolved ? 'var(--moss)' : 'var(--ink-soft)',
          }}
        >
          <span>{isBlockerResolved ? 'enables' : 'threatens'}</span>
          <i className="bi bi-arrow-down" style={{ fontSize: '0.9rem' }}></i>
        </div>

        {/* Node 3: Release Target */}
        <div
          style={{
            background: 'var(--surface)',
            border: `1px solid ${
              isBlockerResolved ? 'rgba(45, 90, 63, 0.4)' : 'var(--border)'
            }`,
            borderLeft: `3.5px solid ${isBlockerResolved ? 'var(--moss)' : 'var(--ink)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.85rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: isBlockerResolved ? 'var(--moss)' : 'var(--ink)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <i className="bi bi-flag-fill"></i> RELEASE MILESTONE
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                color: 'var(--ink-soft)',
              }}
            >
              v2.4
            </span>
          </div>

          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--ink)',
              lineHeight: 1.3,
              marginBottom: '0.25rem',
            }}
          >
            Checkout Redesign Launch
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--ink-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Target: Friday, 20 Nov</span>
            <span>·</span>
            <span
              style={{
                color: isBlockerResolved ? 'var(--moss)' : '#ef4444',
                fontWeight: 600,
              }}
            >
              {isBlockerResolved ? 'Ready to ship' : 'At Risk'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
