interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export default function Logo({ size = 'md', showBadge = true }: LogoProps) {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;
  const fontSize = size === 'sm' ? '1.15rem' : size === 'lg' ? '1.85rem' : '1.45rem';
  const badgeSize = size === 'sm' ? '0.65rem' : size === 'lg' ? '0.78rem' : '0.72rem';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? '0.55rem' : '0.75rem' }}>
      {/* Precision Geometric TaskFlow Mark: 3 dynamic velocity bars */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(74, 222, 128, 0.2))' }}
      >
        <defs>
          <linearGradient id="tf-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="tf-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="tf-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>

        {/* Outer subtle shield container */}
        <rect width="40" height="40" rx="10" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.2" />

        {/* Column 1: In Flight Progress (Tilted Flow Bar) */}
        <rect x="8" y="10" width="6" height="20" rx="3" fill="url(#tf-grad-1)" />

        {/* Column 2: Peak Velocity (Tall Center Bar) */}
        <rect x="17" y="6" width="6" height="28" rx="3" fill="url(#tf-grad-2)" />

        {/* Column 3: Completed Target (Stepped Flow Bar) */}
        <rect x="26" y="14" width="6" height="16" rx="3" fill="url(#tf-grad-3)" />

        {/* Dynamic velocity dot accent */}
        <circle cx="20" cy="11" r="1.5" fill="#ffffff" />
      </svg>

      {/* Brand Wordmark with Modern Geometry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            color: 'var(--ink)',
            lineHeight: 1,
          }}
        >
          TaskFlow
        </span>

        {showBadge && (
          <span
            style={{
              fontSize: badgeSize,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--moss)',
              background: 'var(--moss-soft)',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid rgba(74, 222, 128, 0.25)',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            PRO
          </span>
        )}
      </div>
    </div>
  );
}
