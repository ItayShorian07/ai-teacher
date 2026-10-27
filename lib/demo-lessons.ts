import { bilingualText, type Language, type LocalizedText } from './i18n';
export type Subject = 'math' | 'cs' | 'ai';
export type SchoolStage = 'primary' | 'middle' | 'high';
export type Hobby = 'football' | 'gaming' | 'music' | 'space';
export type LearningPreferences = {
  lang: Language;
  subject: Subject;
  stage: SchoolStage;
  hobby: Hobby;
};
export const subjects = {
  math: bilingualText('Mathematics', 'מתמטיקה'),
  cs: bilingualText('Computer science', 'מדעי המחשב'),
  ai: bilingualText('Learning with AI', 'ללמוד עם AI'),
};
export const stages = {
  primary: bilingualText('Primary · Grades 4–6', 'יסודי · כיתות ד׳–ו׳'),
  middle: bilingualText('Middle · Grades 7–9', 'חטיבה · כיתות ז׳–ט׳'),
  high: bilingualText('High · Grades 10–12', 'תיכון · כיתות י׳–י״ב'),
};
export const hobbies = {
  football: bilingualText('Football', 'כדורגל'),
  gaming: bilingualText('Gaming', 'גיימינג'),
  music: bilingualText('Music', 'מוזיקה'),
  space: bilingualText('Space', 'חלל'),
};
export type PracticeQuestion = {
  id: string;
  title: LocalizedText;
  prompt: LocalizedText;
  expression: string;
  answer: number;
  variable?: string;
  hint: LocalizedText;
  explanation: LocalizedText;
  recovery: string;
  recoveryAnswer: number;
  source: LocalizedText;
  level: number;
  kind: 'linear' | 'numeric' | 'quadratic';
};
export function getLessonTopic(
  preferences: LearningPreferences,
): LocalizedText {
  if (preferences.subject === 'ai')
    return bilingualText(
      'Think first. Ask better.',
      'חושבים קודם. שואלים טוב יותר.',
    );
  if (preferences.subject === 'cs')
    return preferences.stage === 'primary'
      ? bilingualText('Patterns & instructions', 'תבניות והוראות')
      : preferences.stage === 'middle'
        ? bilingualText('Loops & variables', 'לולאות ומשתנים')
        : bilingualText('Recursion, step by step', 'רקורסיה, צעד אחר צעד');
  return preferences.stage === 'primary'
    ? bilingualText('Multiplication in the real world', 'כפל בעולם האמיתי')
    : preferences.stage === 'middle'
      ? bilingualText('Making sense of equations', 'מבינים משוואות')
      : bilingualText(
          'Exploring quadratic equations',
          'מגלים משוואות ריבועיות',
        );
}
export function createDemoQuestion(
  preferences: LearningPreferences,
  level = 1,
  variant = 0,
): PracticeQuestion {
  const variantOffset = variant % 5;
  const hobbyLabel = hobbies[preferences.hobby];
  const baseQuestion: PracticeQuestion = {
    id: `${preferences.subject}-${preferences.stage}-${level}-${variant}`,
    title: getLessonTopic(preferences),
    prompt: bilingualText('', ''),
    expression: '',
    answer: 0,
    hint: bilingualText('', ''),
    explanation: bilingualText('', ''),
    recovery: '',
    recoveryAnswer: 7,
    source: bilingualText('Original demo exercise', 'תרגיל מקורי להדגמה'),
    level,
    kind: 'numeric',
  };
  if (preferences.subject === 'ai') {
    const firstFactor = 7 + variantOffset;
    const secondFactor = 7 + level;
    return {
      ...baseQuestion,
      prompt: bilingualText(
        `An AI says ${firstFactor} × ${secondFactor} = ${firstFactor * secondFactor - 2}. Check the claim independently. What is the correct result?`,
        `כלי AI טוען ש־${firstFactor} × ${secondFactor} = ${firstFactor * secondFactor - 2}. בדקו את הטענה בעצמכם. מה התוצאה הנכונה?`,
      ),
      expression: `${firstFactor} × ${secondFactor} = ?`,
      answer: firstFactor * secondFactor,
      hint: bilingualText(
        `Break ${secondFactor} into two smaller numbers, multiply each by ${firstFactor}, and add.`,
        `פרקו את ${secondFactor} לשני מספרים קטנים, הכפילו כל אחד ב־${firstFactor} וחברו.`,
      ),
      explanation: bilingualText(
        'An AI can sound confident and still make a mistake. Use a calculation, a reliable source, or a second method to check its answer.',
        'AI יכול להישמע בטוח ובכל זאת לטעות. בדקו את התשובה בעזרת חישוב, מקור אמין או דרך פתרון נוספת.',
      ),
      recovery: '6 × 4 = ?',
      recoveryAnswer: 24,
    };
  }
  if (preferences.subject === 'cs') {
    const limit = 3 + level + variantOffset;
    if (preferences.stage === 'primary')
      return {
        ...baseQuestion,
        prompt: bilingualText(
          `A robot starts at square 0. It repeats “move ${level + 1} squares” ${limit} times. Which square does it reach?`,
          `רובוט מתחיל במשבצת 0 וחוזר ${limit} פעמים על ״התקדם ${level + 1} משבצות״. באיזו משבצת הוא יסיים?`,
        ),
        expression: `repeat ${limit} times:\n    move ${level + 1}`,
        answer: limit * (level + 1),
        hint: bilingualText(
          'Add the movement once for every repetition.',
          'הוסיפו את מספר הצעדים בכל חזרה.',
        ),
        explanation: bilingualText(
          'A loop repeats one instruction. Moving 2 squares three times means 2 + 2 + 2 = 6.',
          'לולאה חוזרת על הוראה. תנועה של 2 משבצות שלוש פעמים היא 2 + 2 + 2 = 6.',
        ),
        recovery: '2 + 2 + 2 = ?',
        recoveryAnswer: 6,
      };
    if (preferences.stage === 'middle')
      return {
        ...baseQuestion,
        prompt: bilingualText(
          'Trace the loop. What number will this Python program print?',
          'עקבו אחרי הלולאה. איזה מספר תוכנית ה־Python תדפיס?',
        ),
        expression: `total = 0\nfor n in range(1, ${limit + 1}):\n    total += n\nprint(total)`,
        answer: (limit * (limit + 1)) / 2,
        hint: bilingualText(
          `range(1, ${limit + 1}) includes 1 through ${limit}. Keep a running total.`,
          `range(1, ${limit + 1}) כולל את המספרים מ־1 עד ${limit}. עקבו אחר הסכום המצטבר.`,
        ),
        explanation: bilingualText(
          'The upper end of range is excluded. In range(1, 4), n is 1, then 2, then 3. The total becomes 1, 3, then 6.',
          'הגבול העליון של range אינו כלול. ב־range(1, 4), הערך של n הוא 1, אחר כך 2 ואז 3. הסכום הוא 1, 3 ואז 6.',
        ),
        recovery: '1 + 2 + 3 = ?',
        recoveryAnswer: 6,
      };
    return {
      ...baseQuestion,
      prompt: bilingualText(
        'Follow the recursive calls down to the base case. What does this code print?',
        'עקבו אחרי הקריאות הרקורסיביות עד לתנאי העצירה. מה הקוד מדפיס?',
      ),
      expression: `def count(n):\n    if n == 0:\n        return 0\n    return n + count(n - 1)\n\nprint(count(${limit}))`,
      answer: (limit * (limit + 1)) / 2,
      hint: bilingualText(
        `Expand count(${limit}) into ${limit} + count(${limit - 1}). Stop at count(0).`,
        `פרקו את count(${limit}) ל־${limit} + count(${limit - 1}). עצרו ב־count(0).`,
      ),
      explanation: bilingualText(
        'Recursion solves a smaller version of the same problem until a base case. count(2) = 2 + count(1) = 2 + 1 + count(0) = 3.',
        'רקורסיה פותרת גרסה קטנה יותר של אותה בעיה עד לתנאי עצירה. count(2) = 2 + count(1) = 2 + 1 + count(0) = 3.',
      ),
      recovery: 'count(2) = ?',
      recoveryAnswer: 3,
    };
  }
  if (preferences.stage === 'primary') {
    const packCount = 3 + level;
    const stickersPerPack = 4 + variantOffset;
    const remove = level > 1 ? level + 2 : 0;
    return {
      ...baseQuestion,
      prompt: bilingualText(
        `Your ${hobbyLabel.en.toLowerCase()} club has ${packCount} packs with ${stickersPerPack} stickers each.${remove ? ` You give away ${remove} stickers.` : ''} How many stickers ${remove ? 'remain' : 'are there'}?`,
        `במועדון ה${hobbyLabel.he} שלכם יש ${packCount} חבילות, בכל אחת ${stickersPerPack} מדבקות.${remove ? ` נתתם ${remove} מדבקות לחבר.` : ''} כמה מדבקות ${remove ? 'נשארו' : 'יש בסך הכול'}?`,
      ),
      expression: `${packCount} × ${stickersPerPack}${remove ? ` − ${remove}` : ''} = ?`,
      answer: packCount * stickersPerPack - remove,
      hint: bilingualText(
        'First count all equal groups using multiplication. Then subtract anything given away.',
        'ספרו קודם את כל הקבוצות השוות בעזרת כפל. אחר כך הפחיתו את מה שנתתם.',
      ),
      explanation: bilingualText(
        'Multiplication counts equal groups. Three packs with four stickers each means 4 + 4 + 4 = 12 stickers.',
        'כפל סופר קבוצות שוות. שלוש חבילות עם ארבע מדבקות בכל אחת הן 4 + 4 + 4 = 12 מדבקות.',
      ),
      recovery: '3 × 4 = ?',
      recoveryAnswer: 12,
    };
  }
  if (preferences.stage === 'high') {
    const root = 3 + variantOffset;
    const coefficient = level;
    return {
      ...baseQuestion,
      kind: 'quadratic',
      variable: 'x',
      prompt: bilingualText(
        'Find the positive solution of this quadratic equation. You may submit your working one step at a time.',
        'מצאו את הפתרון החיובי של המשוואה הריבועית. אפשר לשלוח את דרך הפתרון צעד אחר צעד.',
      ),
      expression: `${coefficient > 1 ? coefficient : ''}x² − ${coefficient * root * root} = 0`,
      answer: root,
      hint: bilingualText(
        'Isolate x² first. A positive square root is the positive number whose square gives that value.',
        'בודדו קודם את x². השורש החיובי הוא המספר החיובי שהריבוע שלו נותן את הערך הזה.',
      ),
      explanation: bilingualText(
        'If x² = 16, then x = 4 or x = −4. When a question asks for the positive solution, choose 4.',
        'אם x² = 16, אז x = 4 או x = −4. כשמבקשים את הפתרון החיובי, בוחרים 4.',
      ),
      recovery: 'y² = 25; y > 0. y = ?',
      recoveryAnswer: 5,
    };
  }
  const packCount = 2 + level;
  const stickersPerPack = 5 + variantOffset;
  const extraStickers = 4 + 2 * level;
  return {
    ...baseQuestion,
    variable: 'x',
    kind: 'linear',
    prompt: bilingualText(
      `You’re organizing a ${hobbyLabel.en.toLowerCase()} meetup. ${packCount} equal packs and ${extraStickers} extra stickers give you ${packCount * stickersPerPack + extraStickers} stickers in total. How many stickers are in each pack?`,
      `אתם מארגנים מפגש ${hobbyLabel.he}. ב־${packCount} חבילות זהות ועוד ${extraStickers} מדבקות בודדות יש יחד ${packCount * stickersPerPack + extraStickers} מדבקות. כמה מדבקות יש בכל חבילה?`,
    ),
    expression: `${packCount}x + ${extraStickers} = ${packCount * stickersPerPack + extraStickers}`,
    answer: stickersPerPack,
    hint: bilingualText(
      `What operation cancels +${extraStickers}? Apply it to both sides before dividing.`,
      `איזו פעולה מבטלת את ${extraStickers}+? בצעו אותה בשני האגפים לפני החלוקה.`,
    ),
    explanation: bilingualText(
      'An equation is a balance. Doing the same operation to both sides keeps it equal. For 2y + 4 = 18, subtract 4 from both sides to get 2y = 14, then divide both sides by 2.',
      'משוואה היא כמו מאזניים. אותה פעולה בשני האגפים שומרת על השוויון. ב־2y + 4 = 18 מחסרים 4 משני האגפים ומקבלים 2y = 14, ואז מחלקים את שני האגפים ב־2.',
    ),
    recovery: 'y + 4 = 11. y = ?',
    recoveryAnswer: 7,
  };
}
export function getDemoLesson(preferences: LearningPreferences): {
  title: LocalizedText;
  paragraphs: LocalizedText[];
  takeaway: LocalizedText;
  source: LocalizedText;
} {
  const hobbyLabel = hobbies[preferences.hobby];
  let paragraphs: LocalizedText[];
  let takeaway: LocalizedText;
  if (preferences.subject === 'math' && preferences.stage === 'middle') {
    paragraphs = [
      bilingualText(
        `Imagine planning a ${hobbyLabel.en.toLowerCase()} meetup with your friends. You have three identical mystery packs of stickers, plus six loose stickers. Altogether, you count 21.`,
        `דמיינו שאתם מתכננים מפגש ${hobbyLabel.he} עם חברים. יש לכם שלוש חבילות מסתוריות וזהות של מדבקות ועוד שש מדבקות בודדות. בסך הכול ספרתם 21.`,
      ),
      bilingualText(
        'How many stickers are hiding in each pack? Call that unknown number x. Your story becomes an equation: 3x + 6 = 21.',
        'כמה מדבקות מסתתרות בכל חבילה? נקרא למספר הלא ידוע x. הסיפור שלכם הופך למשוואה: 3x + 6 = 21.',
      ),
      bilingualText(
        'Set the six loose stickers aside: 15 remain in the packs. Share them equally across three packs and you discover five in each. You just solved for x.',
        'מניחים בצד את שש המדבקות הבודדות: נשארו 15 בחבילות. מחלקים אותן שווה בשווה בין שלוש חבילות ומגלים חמש בכל חבילה. הרגע מצאתם את x.',
      ),
    ];
    takeaway = bilingualText(
      'Keep both sides balanced. Undo addition first, then multiplication.',
      'שומרים על איזון בשני האגפים. מבטלים קודם את החיבור, ואז את הכפל.',
    );
  } else if (
    preferences.subject === 'math' &&
    preferences.stage === 'primary'
  ) {
    paragraphs = [
      bilingualText(
        `Your ${hobbyLabel.en.toLowerCase()} club makes four sticker packs. Each pack has four stickers. You could count every sticker, but equal groups give you a shortcut.`,
        `במועדון ה${hobbyLabel.he} שלכם מכינים ארבע חבילות מדבקות. בכל חבילה ארבע מדבקות. אפשר לספור מדבקה אחרי מדבקה, אבל קבוצות שוות נותנות קיצור דרך.`,
      ),
      bilingualText(
        'Four groups of four is 4 + 4 + 4 + 4. Multiplication writes the same idea as 4 × 4 = 16.',
        'ארבע קבוצות של ארבע הן 4 + 4 + 4 + 4. כפל כותב את אותו הרעיון בתור 4 × 4 = 16.',
      ),
      bilingualText(
        'If you share three stickers with a friend, subtract them after counting the whole collection: 16 − 3 = 13.',
        'אם נותנים שלוש מדבקות לחבר, מפחיתים אותן אחרי שסופרים את כל האוסף: 16 − 3 = 13.',
      ),
    ];
    takeaway = bilingualText(
      'Multiply equal groups. Subtract what you give away.',
      'כופלים קבוצות שוות. מפחיתים את מה שנותנים.',
    );
  } else if (preferences.subject === 'math') {
    paragraphs = [
      bilingualText(
        `You’re designing a square display for your ${hobbyLabel.en.toLowerCase()} club. It needs an area of 16 square metres. How long should each side be?`,
        `אתם מעצבים מתחם ריבועי למועדון ה${hobbyLabel.he} שלכם. השטח צריך להיות 16 מטרים רבועים. מה יהיה האורך של כל צלע?`,
      ),
      bilingualText(
        'Area is side × side, so x² = 16. Both 4² and (−4)² equal 16, but a physical length must be positive.',
        'שטח ריבוע הוא צלע כפול צלע, לכן x² = 16. גם 4² וגם (−4)² שווים 16, אבל אורך פיזי חייב להיות חיובי.',
      ),
      bilingualText(
        'Each side is 4 metres. The context helped us choose the positive solution from two mathematical possibilities.',
        'האורך של כל צלע הוא 4 מטרים. ההקשר עזר לנו לבחור את הפתרון החיובי מתוך שתי אפשרויות מתמטיות.',
      ),
    ];
    takeaway = bilingualText(
      'A square equation may have two solutions. Check which ones fit the question.',
      'למשוואה ריבועית יכולים להיות שני פתרונות. בודקים אילו מהם מתאימים לשאלה.',
    );
  } else if (preferences.subject === 'cs') {
    paragraphs =
      preferences.stage === 'high'
        ? [
            bilingualText(
              `Your ${hobbyLabel.en.toLowerCase()} club tracks a challenge: earn 1 point on day one, 2 on day two, and so on. How can code calculate the total?`,
              `מועדון ה${hobbyLabel.he} שלכם עוקב אחרי אתגר: נקודה ביום הראשון, שתי נקודות ביום השני, וכן הלאה. איך קוד יכול לחשב את הסכום?`,
            ),
            bilingualText(
              'Define count(n) as n + count(n − 1). Each call handles one day and asks a smaller version of the same question.',
              'נגדיר count(n) בתור n + count(n − 1). כל קריאה מטפלת ביום אחד ושואלת גרסה קטנה יותר של אותה שאלה.',
            ),
            bilingualText(
              'The base case count(0) = 0 stops the calls. For three days: 3 + 2 + 1 + 0 = 6.',
              'תנאי העצירה count(0) = 0 עוצר את הקריאות. עבור שלושה ימים: 3 + 2 + 1 + 0 = 6.',
            ),
          ]
        : [
            bilingualText(
              `Imagine a robot helping at your ${hobbyLabel.en.toLowerCase()} club. Instead of giving the same instruction again and again, you teach it to repeat.`,
              `דמיינו רובוט שעוזר במועדון ה${hobbyLabel.he} שלכם. במקום לתת את אותה הוראה שוב ושוב, מלמדים אותו לחזור עליה.`,
            ),
            bilingualText(
              'A loop runs an instruction a chosen number of times. A variable remembers a value that can change during each repetition.',
              'לולאה מפעילה הוראה מספר מסוים של פעמים. משתנה זוכר ערך שיכול להשתנות בכל חזרה.',
            ),
            bilingualText(
              'Track each repetition on paper. If you add 1, then 2, then 3 to a total that starts at zero, the final total is 6.',
              'עקבו על הנייר אחרי כל חזרה. אם מוסיפים 1, אחר כך 2 ואז 3 לסכום שמתחיל באפס, הסכום הסופי הוא 6.',
            ),
          ];
    takeaway =
      preferences.stage === 'high'
        ? bilingualText(
            'Find the base case, then trace the calls back up.',
            'מוצאים את תנאי העצירה, ואז עוקבים חזרה אחרי הקריאות.',
          )
        : bilingualText(
            'Trace one repetition at a time. Watch what changes.',
            'עוקבים אחרי חזרה אחת בכל פעם ובודקים מה משתנה.',
          );
  } else {
    paragraphs = [
      bilingualText(
        `You ask AI to help plan a ${hobbyLabel.en.toLowerCase()} challenge. It gives you a confident answer. Does confidence mean it is correct?`,
        `ביקשתם מ־AI עזרה בתכנון אתגר ${hobbyLabel.he}. הוא נתן תשובה בטוחה. האם ביטחון אומר שהתשובה נכונה?`,
      ),
      bilingualText(
        'Start with your own attempt. Ask for one hint, then explain the next step in your own words. This makes AI a learning partner.',
        'מתחילים בניסיון עצמאי. מבקשים רמז אחד, ואז מסבירים את הצעד הבא במילים שלכם. כך AI הופך לשותף ללמידה.',
      ),
      bilingualText(
        'Check factual claims against a trusted source and calculations with another method. Never include your address, school, passwords, or identifying details in a prompt.',
        'בודקים טענות בעזרת מקור אמין וחישובים בדרך נוספת. לא מכניסים לשאלה כתובת, שם בית הספר, סיסמאות או פרטים מזהים.',
      ),
    ];
    takeaway = bilingualText(
      'Try → ask for a hint → verify → explain it yourself.',
      'מנסים ← מבקשים רמז ← בודקים ← מסבירים בעצמנו.',
    );
  }
  return {
    title: bilingualText(
      `A little ${hobbyLabel.en.toLowerCase()}. A new way to understand.`,
      `קצת ${hobbyLabel.he}. דרך חדשה להבין.`,
    ),
    paragraphs,
    takeaway,
    source: bilingualText(
      'Curated demo lesson · not an official curriculum source',
      'שיעור הדגמה מקורי · אינו מקור רשמי של תוכנית הלימודים',
    ),
  };
}
