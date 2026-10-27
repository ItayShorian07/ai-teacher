import { applicationName } from '@/lib/site-metadata';
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: `${applicationName} · Your way to understand`,
  applicationName,
  description:
    'A personal learning space for mathematics, computer science, and learning with AI. בעברית ובאנגלית.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('limud-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch{}`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          דילוג לתוכן · Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
