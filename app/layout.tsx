import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Limud · Your way to understand', description: 'A personal learning space for mathematics, computer science, and learning with AI. בעברית ובאנגלית.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
