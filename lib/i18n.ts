export type Language = 'en' | 'he';
export type LocalizedText = Record<Language, string>;
export type Translate = (english: string, hebrew: string) => string;

export function bilingualText(english: string, hebrew: string): LocalizedText {
  return { en: english, he: hebrew };
}

export function createTranslator(language: Language): Translate {
  return (english, hebrew) => (language === 'he' ? hebrew : english);
}
