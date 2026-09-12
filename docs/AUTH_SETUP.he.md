# הפעלת הרשמה והתחברות ב־Limud

האתר הציבורי: https://ai-teacher-three-pied.vercel.app

מסך התחברות: https://ai-teacher-three-pied.vercel.app/login

מסך הרשמה: https://ai-teacher-three-pied.vercel.app/register

הקוד לחיבור מוכן. כל עוד אין פרויקט Supabase ומשתני סביבה, האתר מציג שההרשמה עדיין לא פתוחה ואינו יוצר משתמשים או שולח הודעות. הדמו נשאר פתוח לציבור. לא נפתחו חשבונות אצל ספקים ולא נרכשו שירותים כחלק מהשינוי.

## הארכיטקטורה

- **Vercel** מארח את האתר ואת נתיבי השרת.
- **Supabase Auth** מנהל התחברות עם Google או קוד חד־פעמי במייל, עוגיות התחברות ואימות מספר טלפון.
- **Supabase Postgres** שומר את הפרופיל: שם פרטי, שם משפחה, עיר/יישוב, גיל בזמן יצירת/עדכון הפרופיל, מספר טלפון מבוקש ושפה. המייל, הטלפון המאומת ותאריכי האימות מנוהלים ב־Auth.
- **ספק SMTP** שולח את הודעות המייל. אפשר להשתמש ב־Resend או בספק SMTP קיים.
- **ספק SMS** כגון Twilio שולח את קודי הטלפון דרך Supabase. יש לבחור ספק התומך במספרים ישראליים ולהגדיר מגבלות הוצאה וקצב שליחה.

טבלת המשתמשים היא טבלה רגילה, ואינה אחד משני מאגרי הווקטורים. חומרי הלימוד והשאלות יישארו בשתי אוספים נפרדים לפי `database/schema.sql`; עדיין לא חוברו embeddings או LLM.

## 1. יצירת פרויקט Supabase

צרו פרויקט ב־https://supabase.com/dashboard. שמרו את סיסמת מסד הנתונים במנהל סיסמאות, לא בצ׳אט ולא ב־GitHub.

ב־SQL Editor הריצו את הקובץ `database/002_profiles.sql`. אין צורך להריץ כרגע את סכמת הווקטורים כדי להפעיל חשבונות.

הטבלה משתמשת ב־Row Level Security: משתמש מחובר רשאי לקרוא ולשנות רק את הרשומה שלו. אין ספריית משתמשים ציבורית. אי אפשר לשנות באמצעות הטבלה סטטוס אימות או תפקיד, ואין שימוש במפתח service_role בקוד האפליקציה.

## 2. משתני סביבה ב־Vercel

פתחו את הפרויקט **ai-teacher → Settings → Environment Variables** והגדירו לסביבת Production:

| שם | ערך |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL של Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | מפתח Publishable של הפרויקט, בדרך כלל מתחיל ב־`sb_publishable_` |
| `NEXT_PUBLIC_SITE_URL` | `https://ai-teacher-three-pied.vercel.app` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | אופציונלי: מפתח אתר CAPTCHA, אם הופעל Turnstile ב־Supabase |

מפתח Publishable מיועד לחשיפה בדפדפן; אבטחת הנתונים נאכפת ב־RLS. **אין להכניס מפתח Secret או service_role למשתנה שמתחיל ב־NEXT_PUBLIC_.**

לאחר השינוי הפעילו Redeploy. משתני NEXT_PUBLIC מוטמעים בזמן הבנייה; שמירתם בלבד לא מעדכנת בנייה קיימת.

לבדיקות מקומיות העתיקו את `.env.example` ל־`.env.local` והשתמשו ב־`NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`. הקובץ `.env.local` מוחרג מ־Git. כל דומיין Preview שמיועד לבדיקה צריך הגדרות מקור ו־OAuth תואמות; אל תגדירו wildcard רחב לפרודקשן.

## 3. הפעלת קודי מייל

ב־Supabase Auth:

1. הפעילו את ספק Email והשאירו את אימות המייל מופעל.
2. הגדירו Site URL לכתובת האתר והוסיפו את `/auth/callback` ל־Redirect URLs:
   `https://ai-teacher-three-pied.vercel.app/auth/callback`.
3. הגדירו **Custom SMTP**. שירות המייל המובנה מוגבל, ולכן אינו מתאים להרשמה ציבורית רגילה. יש לאמת כתובת/דומיין שולח אצל ספק המייל.
4. בתבנית **Magic Link** הכניסו את המשתנה `{{ .Token }}`. האפליקציה מבקשת להקליד קוד ולא להסתמך על קישור קסם. לדוגמה:

```html
<h2>קוד הכניסה שלכם ל־Limud</h2>
<p>הזינו באתר את הקוד הבא:</p>
<p style="font-size:28px;letter-spacing:4px;direction:ltr">{{ .Token }}</p>
<p>אם לא ביקשתם להתחבר, אפשר להתעלם מההודעה. אין לשתף את הקוד.</p>
```

ההרשמה יוצרת זהות מייל ושולחת קוד. רק קוד תקין יוצר התחברות מאומתת. בהתחברות חוזרת שולחים קוד נוסף, ולכן אין סיסמה לשמור או לאפס. הודעת השליחה במסך ההתחברות אינה חושפת אם כתובת מסוימת רשומה.

## 4. Continue with Google

ב־Google Cloud Console:

1. הגדירו Google Auth Platform / OAuth consent screen עבור האפליקציה.
2. צרו OAuth Client מסוג Web application.
3. הוסיפו Authorized JavaScript Origin: `https://ai-teacher-three-pied.vercel.app`.
4. הוסיפו את כתובת החזרה שמספק Supabase, בתבנית:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
5. העתיקו Client ID ו־Client Secret להגדרות Google Provider ב־Supabase. הסוד נשאר שם ואינו מוכנס לקוד או לדפדפן.
6. כדי לאפשר כניסה לציבור, ודאו שה־OAuth audience וה־publishing status מאפשרים משתמשים חיצוניים, ולא רק רשימת בודקים. השלימו כל דרישה ש־Google מציג עבור האפליקציה.

חשוב להבחין בין שתי כתובות החזרה: Google חוזר ל־Supabase; Supabase מחזיר את המשתמש ל־`/auth/callback` באתר. שם קוד PKCE מוחלף ב־session וממשיכים להשלמת הפרופיל.

המייל של Google נחשב מאומת לפי רשומת Supabase Auth. המשתמש עדיין צריך להשלים שם, יישוב, גיל וטלפון, ולאמת את הטלפון ב־SMS. אין בקשה לקבל מהמשתמש סיסמת Google.

## 5. אימות SMS

ב־Supabase Auth הפעילו Phone והגדירו ספק SMS, למשל Twilio. השאירו **Confirm phone** מופעל. הגדירו את הרשאות המדינות, המספר השולח והמגבלות אצל הספק. חשבון ניסיון עשוי להגביל שליחה למספרים שהוגדרו מראש.

הזרימה שהקוד מפעיל:

1. המשתמש כבר מחובר לאחר אימות מייל או Google.
2. הפרופיל נשמר ברשומה של המשתמש המחובר.
3. `updateUser({ phone })` שולח קוד להוספת/שינוי הטלפון באותו חשבון.
4. `verifyOtp({ phone, token, type: 'phone_change' })` בודק את הקוד.
5. השרת קורא מחדש את רשומת Auth ומוודא שזה אותו משתמש, שהמייל מאומת, שהטלפון מאומת ושהמספר מתאים לפרופיל הנוכחי.

לא מופעלת כאן התחברות טלפונית נפרדת, כדי לא ליצור חשבון נוסף לאותו תלמיד. מספר בפורמט `050-123-4567` מומר ל־`+972501234567`. הקוד תומך גם במספרים בינלאומיים תקינים בפורמט E.164.

המתנה של 60 שניות לשליחה חוזרת היא נוחות בממשק. הגבלת שימוש אמיתית נשענת על מגבלות Supabase וספק השליחה; יש להגדירן לפני פתיחת ההרשמה. ניתן להפעיל Turnstile ב־Supabase ולהגדיר את מפתח האתר באפליקציה. סוד ה־CAPTCHA שייך להגדרות Supabase בלבד.

## 6. בדיקה לפני פתיחת ההרשמה

בדקו עם מייל וטלפון שבשליטתכם:

- משתמש חדש: פרטים → קוד מייל שגוי/תקין → SMS שגוי/תקין → חשבון מאומת.
- כניסה חוזרת בקוד מייל, יציאה מהחשבון וחזרה.
- Google מחשבון שאינו מנהל הפרויקט; השלמת פרופיל ו־SMS.
- רענון הדף בין השלבים ושליחה חוזרת לאחר פקיעת קוד.
- שינוי טלפון: המספר הישן המאומת אינו מאמת את המספר החדש.
- משתמש א׳ אינו יכול לקרוא או לעדכן פרופיל של משתמש ב׳ דרך REST.
- `/account` מפנה להתחברות בלי session, וחסימת הרשמה אינה חוסמת את הדמו הציבורי.

נתיבי השרת מוגדרים ללא cache, בודקים את המשתמש מול Supabase Auth, ומונעים כתיבת מזהה משתמש או דגל אימות מתוך הטופס. פיצ׳רים עתידיים המכילים נתוני תלמידים צריכים להשתמש באותן בדיקות וב־RLS.

לפני איסוף פרטים אמיתי של תלמידים, יש להשלים מדיניות פרטיות, תקופת שמירה ודרך למחיקת חשבון, ולהחליט על תהליך מתאים לחשבונות ילדים והורים. אלה החלטות מוצר שעדיין לא הוטמעו; אין באתר הצהרה להסכמה לתנאים שלא נכתבו.

## דומיין וגישה ציבורית

הכתובת `ai-teacher-three-pied.vercel.app` כבר נגישה ללא חשבון Vercel. אין צורך לשנות הרשאות כדי לפתוח את הדמו. אם הגישה משתנה בהמשך, בדקו **Vercel → Project Settings → Deployment Protection** והשתמשו בדומיין Production שמוגדר ציבורי.

אפשר להשאיר את כתובת Vercel בשלב הנוכחי. דומיין ממותג נרכש בנפרד ומחובר דרך **Settings → Domains**, לפי רשומות DNS ש־Vercel מציג. לאחר החלפת דומיין יש לעדכן גם `NEXT_PUBLIC_SITE_URL`, הרשאות redirect ב־Supabase ו־origins ב־Google.

דומיין אינו מחליף מסד נתונים: הוא הכתובת שבה מבקרים באתר. Supabase שומר את המשתמשים. דומיין שולח מאומת למייל עשוי להיות נחוץ אצל ספק SMTP, גם אם כתובת האתר נשארת תחת Vercel.

## מקורות רשמיים

- [Supabase עם Next.js ו־SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [קודי התחברות במייל](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [אימות טלפון וספקי SMS](https://supabase.com/docs/guides/auth/phone-login)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [ניהול נתוני משתמשים](https://supabase.com/docs/guides/auth/managing-user-data)
- [Deployment Protection ב־Vercel](https://vercel.com/docs/deployment-protection)
- [הוספת דומיין ב־Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
