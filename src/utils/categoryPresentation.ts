import { Category } from '@/types';

export const SMART_CATEGORY_COLORS = [
  'from-orange-400 to-red-500',
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-green-600',
  'from-pink-400 to-rose-600',
  'from-amber-300 to-orange-500',
  'from-cyan-400 to-teal-600',
  'from-fuchsia-400 to-pink-600',
  'from-lime-400 to-emerald-600',
  'from-indigo-400 to-blue-700',
  'from-red-400 to-rose-700',
  'from-yellow-300 to-amber-600',
  'from-purple-400 to-fuchsia-600',
  'from-teal-400 to-cyan-700',
  'from-blue-400 to-indigo-700',
  'from-rose-400 to-red-700',
  'from-green-400 to-teal-700',
  'from-orange-300 to-amber-600',
  'from-cyan-300 to-sky-600',
  'from-violet-300 to-indigo-600',
  'from-pink-300 to-fuchsia-600',
  'from-emerald-300 to-lime-600',
  'from-slate-400 to-slate-600',
  'from-amber-400 to-red-600',
];

const ICON_RULES: Array<[string[], string]> = [
  [['food', 'meal', 'lunch', 'dinner', 'breakfast', 'restaurant'], '🍔'],
  [['coffee', 'cafe', 'tea'], '☕'],
  [['grocery', 'groceries', 'supermarket'], '🛒'],
  [['milk', 'dairy', 'butter', 'cheese', 'yogurt'], '🥛'],
  [['travel', 'flight', 'trip', 'vacation'], '✈️'],
  [['fuel', 'petrol', 'diesel', 'gas'], '⛽'],
  [['car', 'vehicle', 'cab', 'taxi', 'uber'], '🚗'],
  [['train', 'metro', 'bus', 'transport'], '🚆'],
  [['rent', 'home', 'house'], '🏠'],
  [['emi', 'loan', 'bank'], '🏦'],
  [['sip', 'investment', 'stocks', 'mutual fund'], '📈'],
  [['saving', 'savings', 'rd'], '💰'],
  [['shopping', 'clothes', 'fashion'], '🛍️'],
  [['entertainment', 'movie', 'cinema'], '🎬'],
  [['gaming', 'game'], '🎮'],
  [['music', 'spotify'], '🎵'],
  [['subscription', 'netflix', 'prime'], '📺'],
  [['bill', 'electricity', 'water', 'internet'], '🧾'],
  [['health', 'doctor', 'medical', 'medicine'], '🩺'],
  [['gym', 'fitness', 'workout', 'sport'], '🏋️'],
  [['education', 'school', 'course', 'book'], '📚'],
  [['gift', 'birthday'], '🎁'],
  [['pet', 'dog', 'cat'], '🐶'],
  [['phone', 'mobile'], '📱'],
  [['computer', 'laptop', 'tech', 'software'], '💻'],
  [['salary', 'income'], '💳'],
];

export const suggestCategoryIcon = (name: string) => {
  const normalizedName = name.trim().toLowerCase();
  const rule = ICON_RULES.find(([keywords]) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  )?.[1];

  if (rule) return rule;

  // Fallback: pick a stable icon from a small palette using a hash
  const FALLBACK_ICONS = [
    '✨', '💳', '🧾', '💰', '🛒', '🍔', '☕', '🎮', '🎬', '🏠', '🚗', '📚', '📈', '🩺', '🏋️', '📺', '🎵', '💻'
  ];

  const idx = hashName(name) % FALLBACK_ICONS.length;
  return FALLBACK_ICONS[idx];
};

const hashName = (name: string) =>
  [...name.toLowerCase()].reduce((hash, character) => hash + character.charCodeAt(0), 0);

export const getUniqueCategoryColor = (name: string, categories: Category[], excludedId?: string) => {
  const usedColors = new Set(
    categories.filter((category) => category.id !== excludedId).map((category) => category.color)
  );
  const startIndex = hashName(name) % SMART_CATEGORY_COLORS.length;

  for (let offset = 0; offset < SMART_CATEGORY_COLORS.length; offset += 1) {
    const color = SMART_CATEGORY_COLORS[(startIndex + offset) % SMART_CATEGORY_COLORS.length];
    if (!usedColors.has(color)) return color;
  }

  return SMART_CATEGORY_COLORS[startIndex];
};

export const refineCategoryPresentations = (categories: Category[]) => {
  const refined: Category[] = [];
  const usedColors = new Set<string>();

  categories.forEach((category) => {
    const icon = !category.icon || category.icon === '✨' ? suggestCategoryIcon(category.name) : category.icon;

    // If existing color is present and not already used, keep it.
    let color = category.color;
    if (!color || usedColors.has(color)) {
      color = getUniqueCategoryColor(category.name, refined);
    }

    usedColors.add(color);

    refined.push({
      ...category,
      icon,
      color,
    });
  });

  return refined;
};
