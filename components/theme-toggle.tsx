'use client';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function isDarkTheme() {
  return document.documentElement.dataset.theme === 'dark';
}

function serverTheme() {
  return false;
}

export default function ThemeToggle({
  language = 'he',
}: {
  language?: 'he' | 'en';
}) {
  const dark = useSyncExternalStore(subscribeToTheme, isDarkTheme, serverTheme);
  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('limud-theme', next ? 'dark' : 'light');
    } catch {}
  }
  const label =
    language === 'he'
      ? dark
        ? 'מעבר למצב בהיר'
        : 'מעבר למצב כהה'
      : dark
        ? 'Switch to light mode'
        : 'Switch to dark mode';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
