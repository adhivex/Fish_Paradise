'use client';

/**
 * Last-resort boundary when the root layout itself fails (e.g. the catalogue can't be loaded).
 * It replaces the whole document, so it carries its own minimal markup and styles.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7F2E8',
          color: '#0A2A2F',
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <main role="alert">
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: '0 0 8px' }}>
            Fish Paradise is taking a short break
          </h1>
          <p style={{ color: '#4F6A6C', margin: '0 0 20px' }}>
            We couldn&apos;t load the shop. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 52,
              padding: '0 28px',
              borderRadius: 16,
              border: 0,
              background: '#0A2A2F',
              color: '#F7F2E8',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
