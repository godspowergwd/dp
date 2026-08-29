import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Private Dropshipping OS',
  description:
    'Private single-operator commerce command center for research, suppliers, AI assets, publishing and orders.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
