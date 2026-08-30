'use client';

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Owner login</h1>
      <form
        style={{ display: 'grid', gap: '0.75rem' }}
        onSubmit={(e) => e.preventDefault()}
      >
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            style={inputStyle}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            style={inputStyle}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" style={buttonStyle}>
          Sign in
        </button>
      </form>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
        The API client lives in <code>src/lib/api.ts</code> and only talks to the
        server-side gateway — never to providers directly.
      </p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  marginTop: '0.25rem',
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};
