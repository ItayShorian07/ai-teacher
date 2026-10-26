'use client';

import { createTranslator, type Language } from '@/lib/i18n';
import { useEffect, useState } from 'react';

export function useDocumentLanguage(language: Language) {
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);
}

export function useLanguage(initialLanguage: Language) {
  const [language, setLanguage] = useState(initialLanguage);
  useDocumentLanguage(language);
  return { language, setLanguage, translate: createTranslator(language) };
}
