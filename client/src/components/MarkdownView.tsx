interface MarkdownViewProps {
  content: string;
}

export default function MarkdownView({ content }: MarkdownViewProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div
      style={{
        fontSize: '0.86rem',
        lineHeight: 1.6,
        color: 'var(--ink)',
      }}
    >
      {lines.map((line, index) => {
        // Headings (### )
        if (line.startsWith('### ')) {
          return (
            <h5
              key={index}
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0.85rem 0 0.35rem 0',
                letterSpacing: '-0.01em',
              }}
            >
              {line.replace('### ', '')}
            </h5>
          );
        }

        // Bullet lists (- )
        if (line.trim().startsWith('- ')) {
          const bulletContent = line.trim().replace(/^- /, '');
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                marginLeft: '0.5rem',
                marginBottom: '0.25rem',
                color: 'var(--ink-soft)',
              }}
            >
              <span style={{ color: 'var(--moss)', fontSize: '0.8rem' }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletContent) }} />
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={index} style={{ height: '0.5rem' }} />;
        }

        // Normal paragraph
        return (
          <p
            key={index}
            style={{ margin: '0 0 0.4rem 0', color: 'var(--ink-soft)' }}
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
          />
        );
      })}
    </div>
  );
}

function formatInlineMarkdown(text: string): string {
  // Bold **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--ink);">$1</strong>');
  // Inline code `code`
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code style="font-family: var(--font-mono); font-size: 0.8em; background: var(--paper); border: 1px solid var(--border); padding: 0.1rem 0.35rem; border-radius: 3px;">$1</code>'
  );
  return formatted;
}
