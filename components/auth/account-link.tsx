'use client';
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function AccountLink({ language }: { language: 'he' | 'en' }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/account/status', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => setSignedIn(data.signedIn === true))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <Link
      className="account-nav-link"
      href={signedIn ? '/account' : `/login?lang=${language}`}
    >
      <UserRound size={17} />
      <span>
        {signedIn
          ? language === 'he'
            ? 'החשבון שלי'
            : 'My account'
          : language === 'he'
            ? 'התחברות'
            : 'Sign in'}
      </span>
    </Link>
  );
}
