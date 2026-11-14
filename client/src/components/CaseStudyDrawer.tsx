interface CaseStudyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseStudyDrawer({ isOpen, onClose }: CaseStudyDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 29, 41, 0.4)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 95,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Slide-over Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Case Study and Design Decisions"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '580px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--moss)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '0.2rem',
              }}
            >
              <i className="bi bi-journal-bookmark-fill"></i> Design Engineering Case Study
            </span>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              TaskFlow — Release Risk Architecture
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.65rem',
              color: 'var(--ink-soft)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.72rem' }}></i>
            <span>Close</span>
            <kbd
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                background: 'var(--paper)',
                padding: '0.1rem 0.35rem',
                borderRadius: '3px',
                border: '1px solid var(--border)',
              }}
            >
              Esc
            </kbd>
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            lineHeight: 1.6,
            color: 'var(--ink)',
            fontSize: '0.9rem',
          }}
        >
          {/* Metadata pill */}
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              fontSize: '0.78rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--ink-soft)' }}>Role: </span>
              <strong>Design Engineer & Full-Stack</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)' }}>Project: </span>
              <strong>TaskFlow Workspace</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)' }}>Thesis: </span>
              <strong>Release Risk vs Task Lists</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-soft)' }}>Demo State: </span>
              <strong>Preloaded (Checkout v2.4)</strong>
            </div>
          </div>

          {/* 1. The Core Problem */}
          <section>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '0.45rem',
              }}
            >
              1. The Problem: Task managers hide delivery risk
            </h3>
            <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
              Typical team tools treat tasks as isolated cards inside columns. A board might show{' '}
              <em>3 of 8 tasks complete</em> and look healthy, while concealing that the single most
              critical payment gateway test is completely blocked by an overdue external bank approval.
            </p>
            <p style={{ color: 'var(--ink-soft)', marginTop: '0.5rem' }}>
              <strong>The design question:</strong> How do we make the causal chain between root blockers,
              downstream dependencies, and release targets impossible to overlook?
            </p>
          </section>

          {/* 2. Key Architectural Decisions */}
          <section>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '0.45rem',
              }}
            >
              2. Key Design & Engineering Decisions
            </h3>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--ink-soft)' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--ink)' }}>The Visual Risk Path:</strong> Rather than forcing
                users to mentally connect cards across columns, a dedicated 3-node causal pipeline (
                <code>Bank API Approval ➔ Payment Testing ➔ Release Launch</code>) sits directly above the board.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--ink)' }}>Exception-First Visual Weight:</strong> Regular cards
                have clean hairline borders. Saturated colors (red, amber) are reserved strictly for true
                exceptions: release blockers and blocked downstream tasks.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--ink)' }}>Decisions Attached to Work:</strong> Scope trade-offs
                (e.g., keeping guest checkout in scope to reduce cart abandonment) are recorded as first-class
                decision trails with date, author, and rationale—not lost in buried comments.
              </li>
              <li>
                <strong style={{ color: 'var(--ink)' }}>Deterministic Reviewer Sandbox:</strong> The demo
                includes zero-credential 1-click access and an interactive resolution simulator so evaluators
                can test the consequence loop immediately.
              </li>
            </ul>
          </section>

          {/* 3. Deliberately Left Out */}
          <section>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '0.45rem',
              }}
            >
              3. What Was Deliberately Left Out
            </h3>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--ink-soft)' }}>
              <li style={{ marginBottom: '0.4rem' }}>
                <strong>No Arbitrary AI "Risk Scores":</strong> Generating an unexplained 78% risk score erodes
                professional trust. Explaining the factual root cause (overdue bank API keys) is significantly
                more valuable.
              </li>
              <li style={{ marginBottom: '0.4rem' }}>
                <strong>No Gimmicky Marketing Walls:</strong> Avoided long marketing landing pages before entry.
                Reviewers evaluate working software, not marketing copy.
              </li>
              <li>
                <strong>No Third-Party Audio Bloat:</strong> Implemented tactile click and completion feedback
                using native browser Web Audio oscillators with 0ms network latency.
              </li>
            </ul>
          </section>

          {/* 4. Technical Implementation */}
          <section>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '0.45rem',
              }}
            >
              4. Full-Stack Implementation
            </h3>
            <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
              • <strong>Frontend:</strong> React 19, TypeScript, Vite, <code>@dnd-kit</code> physics with
              fractional reordering, CSS variable design token system.<br />
              • <strong>Backend:</strong> Node.js, Express, Socket.io real-time broadcast engine with
              deterministic local JSON datastore.<br />
              • <strong>Cloud:</strong> Cloudflare Pages Edge CDN paired with Render WebSockets.
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
