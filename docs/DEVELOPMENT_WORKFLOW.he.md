# סביבות עבודה ותהליך שחרור

לפרויקט יש שלוש סביבות שימוש, עם שני מסדי נתונים נפרדים:

| סביבה | קוד | מסד נתונים | שימוש |
| --- | --- | --- | --- |
| Local | מחשב הפיתוח | Supabase Development | עבודה יומיומית |
| Preview | כל ענף ו־Pull Request ב־Vercel | Supabase Development | בדיקה לפני מיזוג |
| Production | הענף `main` | Supabase Production | האתר למשתמשים |

אין צורך בענף `develop` קבוע. יוצרים ענף קצר לכל שינוי, בודקים את כתובת ה־Preview, פותחים Pull Request וממזגים ל־`main` רק אחרי שהבדיקות עברו.

## 1. יצירת Supabase Development

1. משאירים את פרויקט Supabase הקיים בתור Production.
2. יוצרים פרויקט נוסף בשם `AI Teacher Development`.
3. מריצים בפרויקט החדש את `database/setup.sql` דרך SQL Editor.
4. ב־Authentication > URL Configuration מוסיפים ל־Redirect URLs:
   - `http://127.0.0.1:3000/**`
   - `http://localhost:3000/**`
   - `https://*-itayshorian07s-projects.vercel.app/**`
5. מגדירים אימות מייל ו־SMTP גם בפרויקט הפיתוח. אפשר להשתמש באותו שולח בתקופת ה־POC, אך המשתמשים והנתונים נשארים בפרויקט הפיתוח בלבד.

## 2. משתנים ב־Vercel

ב־Project Settings > Environment Variables מוסיפים את המשתנים הבאים. חשוב לבחור את הסביבה המתאימה לכל ערך.

### Production

```text
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=<production project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<production publishable key>
SUPABASE_SERVICE_ROLE_KEY=<production service role key>
NEXT_PUBLIC_SITE_URL=https://ai-teacher-three-pied.vercel.app
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<production site key>
TURNSTILE_SECRET_KEY=<production secret key>
```

### Preview

```text
NEXT_PUBLIC_APP_ENV=preview
NEXT_PUBLIC_SUPABASE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=<development project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<development publishable key>
SUPABASE_SERVICE_ROLE_KEY=<development service role key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

לא מגדירים `NEXT_PUBLIC_SITE_URL` ב־Preview. הקוד משתמש בכתובת ש־Vercel יצר עבור הפריסה. מפתחות Turnstile שמופיעים כאן הם מפתחות בדיקה רשמיים ותמיד מצליחים; אסור להגדיר אותם ב־Production.

את `GEMINI_API_KEY` אפשר לשייך זמנית גם ל־Preview, ועדיף להשתמש במפתח פיתוח נפרד עם מכסה נמוכה.

לאחר שינוי משתנים מבצעים Redeploy לפריסות הרלוונטיות.

## 3. פיתוח מקומי

מעתיקים את `.env.example` אל `.env.local` ומכניסים רק את פרטי Supabase Development. הקובץ `.env.local` אינו נכנס ל־Git.

```sh
npm ci
npm run dev
```

## 4. הגנת GitHub ו־Preview

ב־GitHub יוצרים Ruleset עבור `main`: דורשים Pull Request, דורשים שהבדיקה `validate` תעבור, וחוסמים מחיקה ו־force push.

ב־Vercel אפשר להפעיל Settings > Deployment Protection > Vercel Authentication עבור Preview. כתובת Production נשארת ציבורית.

## 5. בדיקה לפני מיזוג

```sh
npm test
npm run typecheck
npm run build
npm run check:connections
```

הקוד חוסם התאמה מסוכנת: Production חייב להשתמש בנתוני Production, ו־Local או Preview חייבים להשתמש בנתוני Development. זו שכבת הגנה נוספת; ההפרדה בפועל מתקבלת משני פרויקטי Supabase וממפתחות Vercel נפרדים.
