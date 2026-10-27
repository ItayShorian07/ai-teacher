import type { Language } from './i18n';
export const getAuthErrorMessage = (code: string, language: Language) => {
  const messages: Record<string, [string, string]> = {
    invalid_login: [
      'Enter your username or email and password.',
      'הזינו שם משתמש או מייל וסיסמה.',
    ],
    invalid_credentials: [
      'The username/email or password is incorrect, or the email has not been verified. Use an email code or reset your password.',
      'שם המשתמש/המייל או הסיסמה שגויים, או שהמייל עדיין לא אומת. אפשר להיכנס בקוד למייל או לאפס סיסמה.',
    ],
    username_unavailable: [
      'This username is already taken. Please choose another.',
      'שם המשתמש הזה כבר תפוס. בחרו שם אחר.',
    ],
    weak_password: [
      'Use a password with 12–128 characters.',
      'בחרו סיסמה באורך 12–128 תווים.',
    ],
    password_mismatch: ['The passwords do not match.', 'הסיסמאות אינן זהות.'],
    same_password: [
      'Choose a password different from your current password.',
      'בחרו סיסמה שונה מהסיסמה הנוכחית.',
    ],
    delete_unavailable: [
      'Account deletion is temporarily unavailable. Please contact support.',
      'מחיקת החשבון אינה זמינה כרגע. פנו אלינו דרך יצירת קשר.',
    ],
    invalid_profile: [
      'Check the names, city, age, school and phone number.',
      'בדקו את השם, היישוב, הגיל, בית הספר ומספר הטלפון.',
    ],
    invalid_email: ['Enter a valid email address.', 'הזינו כתובת מייל תקינה.'],
    invalid_code: [
      'The code is invalid or expired. Check it or request a new code.',
      'הקוד שגוי או שפג תוקפו. בדקו אותו או בקשו קוד חדש.',
    ],
    rate_limit: [
      'Too many attempts. Wait a little before trying again.',
      'בוצעו יותר מדי ניסיונות. המתינו מעט לפני ניסיון נוסף.',
    ],
    captcha: [
      'Complete the security check and try again.',
      'השלימו את בדיקת האבטחה ונסו שוב.',
    ],
    not_configured: [
      'Registration isn’t open yet. Please use the demo for now.',
      'ההרשמה עדיין לא פתוחה. אפשר להשתמש בדמו בינתיים.',
    ],
    unauthorized: [
      'Your session expired. Please sign in again.',
      'פג תוקף ההתחברות. התחברו שוב.',
    ],
    email_required: [
      'Verify your email before adding your phone.',
      'אמתו את כתובת המייל לפני הוספת הטלפון.',
    ],
    profile_required: [
      'Complete and save your details first.',
      'השלימו ושמרו את הפרטים תחילה.',
    ],
    verification_incomplete: [
      'Verification is not complete yet. Please request a new code.',
      'האימות עדיין לא הושלם. בקשו קוד חדש.',
    ],
    callback: [
      'Google sign-in was cancelled or could not finish. Please try again.',
      'ההתחברות עם Google בוטלה או לא הושלמה. נסו שוב.',
    ],
  };
  return (messages[code] || [
    'We couldn’t complete the request. Try again later.',
    'לא הצלחנו להשלים את הבקשה. נסו שוב מאוחר יותר.',
  ])[language === 'he' ? 1 : 0];
};
