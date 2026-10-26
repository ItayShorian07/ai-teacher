import Link from 'next/link';
import ThemeToggle from '@/components/theme-toggle';
export const metadata = { title: 'יצירת קשר ועזרה | Limud' };
export default function Contact() {
  return (
    <main id="main-content" className="help-page" dir="rtl">
      <header>
        <Link className="brand" href="/">
          limud.
        </Link>
        <ThemeToggle />
      </header>
      <span className="auth-card-label">כאן כדי לעזור</span>
      <h1>בואו נדבר.</h1>
      <p>שאלה, רעיון או משהו שלא עובד? נשמח לשמוע.</p>
      <a className="primary-button" href="mailto:itaymyphotos1@gmail.com">
        itaymyphotos1@gmail.com
      </a>
      <p className="auth-field-note">
        אל תשלחו סיסמאות, קודי אימות או מסמכים אישיים במייל.
      </p>
      <h2>שאלות נפוצות</h2>
      {[
        [
          'אפשר לנסות בלי להירשם?',
          'כן. הדמו פתוח לכולם ומאפשר להתנסות בסיפורים ובתרגול מקומי. יצירת תוכן חדש עם AI זמינה בחשבון מחובר כשהשירות פעיל.',
        ],
        [
          'איך מתחברים?',
          'באמצעות קוד חד־פעמי למייל, או Google לאחר הפעלת השירות. אין סיסמה שצריך לזכור.',
        ],
        [
          'מה כולל Pro?',
          'ליווי AI במהלך כתיבת הפתרון: זיהוי טעויות, הסבר על נושאי הבסיס ובדיקת הבנה. בגרסת הניסוי מעניקים Pro ידנית, ללא חיוב.',
        ],
        [
          'האם אפשר לענות בכתב יד?',
          'בחשבון מחובר ניתן לצרף PDF עד 3MB. מאשרים או מתקנים את הטקסט שזוהה לפני שליחתו לבדיקה.',
        ],
        [
          'איך מוחקים את החשבון?',
          'בעמוד החשבון בוחרים מחיקת חשבון ומאשרים את הפעולה. המחיקה מסירה את הפרופיל ואת הנתונים הפרטיים המקושרים לחשבון.',
        ],
        [
          'נתקלתי בקושי בנגישות',
          'אפשר להשתמש במקלדת, להגדיל את הדף ולהחליף מצב כהה ובהיר. אם משהו מקשה על השימוש, כתבו לנו מה קרה ובאיזה מכשיר.',
        ],
      ].map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <nav className="help-links">
        <Link href="/">התחברות</Link>
        <Link href="/register">הרשמה</Link>
        <Link href="/demo">כניסה לדמו</Link>
      </nav>
    </main>
  );
}
