import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AudioBook Hub',
  description: 'Your personal audiobook catalog',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
