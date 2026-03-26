import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CE Ticket App',
  description: 'Contractor Engage ticket operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
