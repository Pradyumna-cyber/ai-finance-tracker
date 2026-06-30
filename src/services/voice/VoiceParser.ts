import type { Category } from '@/types';

export interface PendingVoiceExpense {
  amount?: number;
  categoryId?: string;
  categoryName?: string;
  note?: string;
}

export interface VoiceParseResult {
  expense: PendingVoiceExpense;
  missingFields: Array<'amount' | 'category'>;
  transcript: string;
}

export interface VoiceExpenseParser {
  parseExpense: (transcript: string, categories: Category[]) => VoiceParseResult;
  applyEdit: (
    transcript: string,
    currentExpense: PendingVoiceExpense,
    categories: Category[]
  ) => VoiceParseResult & { cancelled: boolean };
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  food: ['food', 'groceries', 'grocery', 'vegetables', 'snacks', 'restaurant', 'dinner', 'lunch', 'breakfast'],
  travel: ['travel', 'cab', 'taxi', 'uber', 'ola', 'parking', 'train', 'bus', 'metro'],
  fuel: ['fuel', 'petrol', 'diesel', 'gas'],
  shopping: ['shopping', 'shop', 'clothes', 'clothing'],
  entertainment: ['entertainment', 'movie', 'movies', 'concert'],
  bills: ['bill', 'bills', 'electricity', 'water', 'internet', 'wifi', 'phone'],
  coffee: ['coffee', 'tea', 'cafe'],
  health: ['health', 'doctor', 'medicine', 'medical', 'pharmacy'],
  education: ['education', 'course', 'book', 'books', 'tuition'],
  subscription: ['subscription', 'netflix', 'spotify', 'prime'],
  gym: ['gym', 'fitness'],
  gaming: ['gaming', 'game', 'games'],
};

const COMMAND_WORDS = [
  'i',
  'please',
  'want',
  'to',
  'it',
  'add',
  'an',
  'a',
  'expense',
  'record',
  'spent',
  'spend',
  'paid',
  'pay',
  'payment',
  'of',
  'for',
  'on',
  'under',
  'rupees',
  'rupee',
  'rs',
  'inr',
  '₹',
];

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fourty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const NUMBER_WORDS = new Set([
  ...Object.keys(SMALL_NUMBERS),
  ...Object.keys(TENS),
  'hundred',
  'thousand',
  'lakh',
  'and',
]);

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/₹/g, ' ₹ ')
    .replace(/[.,!?]/g, ' ')
    .replace(/\bina\b/g, 'in a')
    .replace(/\bon fooding\b/g, 'on food')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeForDisplay = (value: string) =>
  value
    .replace(/\bina\b/gi, 'in a')
    .replace(/\s+/g, ' ')
    .trim();

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const findAmount = (normalizedTranscript: string) => {
  const match = normalizedTranscript.match(/(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)/i);
  if (match) {
    const amount = Number(match[1].replace(/,/g, ''));
    return Number.isFinite(amount) && amount > 0 ? amount : undefined;
  }

  return findSpokenAmount(normalizedTranscript);
};

const parseNumberWordSequence = (words: string[]) => {
  let total = 0;
  let current = 0;
  let consumed = false;

  words.forEach((word) => {
    if (word === 'and') return;

    if (SMALL_NUMBERS[word] !== undefined) {
      current += SMALL_NUMBERS[word];
      consumed = true;
      return;
    }

    if (TENS[word] !== undefined) {
      current += TENS[word];
      consumed = true;
      return;
    }

    if (word === 'hundred') {
      current = Math.max(current, 1) * 100;
      consumed = true;
      return;
    }

    if (word === 'thousand') {
      total += Math.max(current, 1) * 1000;
      current = 0;
      consumed = true;
      return;
    }

    if (word === 'lakh') {
      total += Math.max(current, 1) * 100000;
      current = 0;
      consumed = true;
    }
  });

  if (!consumed) return undefined;
  return total + current;
};

const findSpokenAmount = (normalizedTranscript: string) => {
  const words = normalizedTranscript.split(' ');
  const candidates: string[][] = [];
  let current: string[] = [];

  words.forEach((word) => {
    if (NUMBER_WORDS.has(word)) {
      current.push(word);
      return;
    }

    if (current.length) {
      candidates.push(current);
      current = [];
    }
  });

  if (current.length) candidates.push(current);

  for (const candidateWords of candidates) {
    if (candidateWords.length === 2) {
      const [first, second] = candidateWords;
      if (SMALL_NUMBERS[first] !== undefined && TENS[second] !== undefined) {
        return SMALL_NUMBERS[first] * 100 + TENS[second];
      }
    }

    const directValue = parseNumberWordSequence(candidateWords);
    if (directValue && directValue > 0) return directValue;
  }

  return undefined;
};

const wordsForCategory = (category: Category) => {
  const categoryName = normalize(category.name);
  return new Set([
    categoryName,
    category.id.toLowerCase(),
    ...(CATEGORY_ALIASES[category.id.toLowerCase()] || []),
    ...(CATEGORY_ALIASES[categoryName] || []),
  ]);
};

const findCategory = (normalizedTranscript: string, categories: Category[]) => {
  let bestMatch: Category | undefined;
  let bestLength = 0;

  categories.forEach((category) => {
    wordsForCategory(category).forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
      if (pattern.test(normalizedTranscript) && word.length > bestLength) {
        bestMatch = category;
        bestLength = word.length;
      }
    });
  });

  return bestMatch;
};

const extractNote = (
  originalTranscript: string,
  normalizedTranscript: string,
  amount?: number,
  category?: Category
) => {
  const displayTranscript = normalizeForDisplay(originalTranscript);
  const explicitNoteMatch = displayTranscript.match(/\b(?:note|notes|with note|memo|description)\b\s*(.+)$/i);
  if (explicitNoteMatch?.[1]) {
    return toTitleCase(explicitNoteMatch[1]);
  }

  const contextualNoteMatch = displayTranscript.match(/\b(?:at|in|inside|from|with)\s+(?:a\s+|an\s+|the\s+)?(.+)$/i);
  if (contextualNoteMatch?.[1]) {
    const note = contextualNoteMatch[1]
      .replace(/\b(?:restaurant|restaurent|restraunt)\b/i, 'restaurant')
      .trim();

    if (note && !category?.name.toLowerCase().includes(note.toLowerCase())) {
      return toTitleCase(note);
    }
  }

  let cleaned = normalizedTranscript;
  if (amount) {
    cleaned = cleaned.replace(new RegExp(`\\b${String(amount).replace('.', '\\.')}\\b`), ' ');
  }

  if (category) {
    wordsForCategory(category).forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'gi'), ' ');
    });
  }

  COMMAND_WORDS.forEach((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ');
  });

  NUMBER_WORDS.forEach((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ');
  });

  const note = cleaned
    .replace(/\b(?:at|in|inside|from|with)\s+(?:a\s+|an\s+|the\s+)?/gi, '')
    .replace(/\b(?:restaurant|restaurent|restraunt)\b/i, 'restaurant')
    .replace(/\s+/g, ' ')
    .trim();
  return note ? toTitleCase(note) : undefined;
};

const missingFieldsFor = (expense: PendingVoiceExpense): Array<'amount' | 'category'> => {
  const missingFields: Array<'amount' | 'category'> = [];
  if (!expense.amount) missingFields.push('amount');
  if (!expense.categoryId) missingFields.push('category');
  return missingFields;
};

const findCategoryAfterCommand = (normalizedTranscript: string, categories: Category[]) => {
  const match = normalizedTranscript.match(/\b(?:change|set|make|update)\s+(?:the\s+)?category\s+(?:to|as)?\s+(.+)$/i);
  if (!match?.[1]) return undefined;
  return findCategory(match[1], categories);
};

const findNoteAfterCommand = (transcript: string) => {
  const match = transcript.match(/\b(?:change|set|make|update)\s+(?:the\s+)?note\s+(?:to|as)?\s+(.+)$/i);
  return match?.[1] ? toTitleCase(match[1]) : undefined;
};

export class RuleBasedVoiceParser implements VoiceExpenseParser {
  parseExpense(transcript: string, categories: Category[]): VoiceParseResult {
    const normalizedTranscript = normalize(transcript);
    const amount = findAmount(normalizedTranscript);
    const category = findCategory(normalizedTranscript, categories);
    const note = extractNote(transcript, normalizedTranscript, amount, category);

    const expense: PendingVoiceExpense = {
      amount,
      categoryId: category?.id,
      categoryName: category?.name,
      note,
    };

    return {
      expense,
      missingFields: missingFieldsFor(expense),
      transcript,
    };
  }

  applyEdit(
    transcript: string,
    currentExpense: PendingVoiceExpense,
    categories: Category[]
  ): VoiceParseResult & { cancelled: boolean } {
    const normalizedTranscript = normalize(transcript);

    if (/\b(cancel|stop|never mind|nevermind)\b/i.test(normalizedTranscript)) {
      return {
        cancelled: true,
        expense: currentExpense,
        missingFields: missingFieldsFor(currentExpense),
        transcript,
      };
    }

    const nextExpense: PendingVoiceExpense = { ...currentExpense };
    const amount = findAmount(normalizedTranscript);
    const category = findCategoryAfterCommand(normalizedTranscript, categories) || findCategory(normalizedTranscript, categories);
    const note = findNoteAfterCommand(transcript);

    if (/\b(remove|clear|delete)\s+(?:the\s+)?note\b/i.test(normalizedTranscript)) {
      nextExpense.note = '';
    } else if (note !== undefined) {
      nextExpense.note = note;
    }

    if (amount !== undefined && /\b(amount|make it|change|set|update|to)\b/i.test(normalizedTranscript)) {
      nextExpense.amount = amount;
    }

    if (category) {
      nextExpense.categoryId = category.id;
      nextExpense.categoryName = category.name;
    }

    return {
      cancelled: false,
      expense: nextExpense,
      missingFields: missingFieldsFor(nextExpense),
      transcript,
    };
  }
}

export const voiceParser = new RuleBasedVoiceParser();
