'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="help-page">
      <h1>לא הצלחנו לטעון את הדף</h1>
      <p>החיבור לשירות אינו זמין כרגע. נסו שוב בעוד רגע.</p>
      <button className="primary-button" onClick={reset}>
        ניסיון נוסף
      </button>
      <Link href="/demo">פתיחת הדמו</Link>
    </main>
  );
}
