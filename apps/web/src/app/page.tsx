import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1>Private Dropshipping OS</h1>
      <p style={{ color: 'var(--muted)' }}>
        Private single-operator commerce command center — research products,
        manage suppliers, generate AI assets, publish to stores, and monitor
        orders &amp; performance.
      </p>

      <h2>Modules</h2>
      <ul>
        <li>Product Research</li>
        <li>Product &amp; Supplier Management</li>
        <li>Storefront Integrations</li>
        <li>AI Studio</li>
        <li>Marketing &amp; Social Publishing</li>
        <li>Orders &amp; Fulfillment</li>
        <li>Analytics</li>
        <li>Settings &amp; Integrations</li>
      </ul>

      <h2>Getting started</h2>
      <p style={{ color: 'var(--muted)' }}>
        This frontend is a static scaffold. Log in through{' '}
        <Link href="/login">/login</Link> once the API is running.
      </p>
    </main>
  );
}
