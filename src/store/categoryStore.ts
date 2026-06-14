
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category, CategoryId } from '@/types';
import {
  getUniqueCategoryColor,
  refineCategoryPresentations,
  SMART_CATEGORY_COLORS,
  suggestCategoryIcon,
} from '@/utils/categoryPresentation';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Food',
    icon: '🍔',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'emi',
    name: 'EMI',
    icon: '🏦',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'sip',
    name: 'SIP',
    icon: '📈',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'rd',
    name: 'RD',
    icon: '💰',
    color: 'from-teal-500 to-green-500',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'bills',
    name: 'Bills',
    icon: '📄',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'fuel',
    name: 'Fuel',
    icon: '⛽',
    color: 'from-sky-500 to-blue-500',
  },
  {
    id: 'subscription',
    name: 'Subscription',
    icon: '📺',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'health',
    name: 'Health',
    icon: '🩺',
    color: 'from-red-500 to-pink-500',
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: '🏋️',
    color: 'from-lime-500 to-green-500',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    icon: '☕',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'education',
    name: 'Education',
    icon: '📚',
    color: 'from-blue-600 to-indigo-600',
  },
];

export const CATEGORY_ICONS = [
  '🍔',
  '✈️',
  '🏦',
  '📈',
  '💰',
  '🛍️',
  '🎬',
  '📄',
  '⛽',
  '📺',
  '🩺',
  '🏋️',
  '☕',
  '🎮',
  '📚',
  '🚗',
  '🏠',
  '💳',
  '🧾',
  '🛒',
  '🎵',
  '🧑‍💻',
  '🐶',
  '🎁',
];

export const CATEGORY_COLORS = [
  ...SMART_CATEGORY_COLORS,
];

interface CategoryStore {
  categories: Category[];

  addCategory: (category: Category) => void;

  updateCategory: (
    id: CategoryId,
    category: Partial<Category>
  ) => void;

  deleteCategory: (id: CategoryId) => void;

  getCategoryById: (
    id: CategoryId
  ) => Category | undefined;

  initializeDefaultCategories: () => void;
}

export const useCategoryStore =
  create<CategoryStore>()(
    persist(
      (set, get) => ({
        categories: [],

        addCategory: (category: Category) => {
          set((state) => ({
            categories: [
              ...state.categories,
              {
                ...category,
                icon: category.icon || suggestCategoryIcon(category.name),
                color: category.color || getUniqueCategoryColor(category.name, state.categories),
              },
            ],
          }));
        },

        updateCategory: (
          id: CategoryId,
          updates: Partial<Category>
        ) => {
          set((state) => ({
            categories: state.categories.map((cat) => {
              if (cat.id !== id) return cat;

              const newName = updates.name ?? cat.name;
              const newIcon = updates.icon ?? (updates.name ? suggestCategoryIcon(String(newName)) : cat.icon);
              const newColor = updates.color ?? (updates.name ? getUniqueCategoryColor(String(newName), state.categories, id) : cat.color);

              return {
                ...cat,
                ...updates,
                icon: newIcon,
                color: newColor,
              };
            }),
          }));
        },

        deleteCategory: (id: CategoryId) => {
          set((state) => ({
            categories:
              state.categories.filter(
                (cat) => cat.id !== id
              ),
          }));
        },

        getCategoryById: (
          id: CategoryId
        ) => {
          return get().categories.find(
            (cat) => cat.id === id
          );
        },

        initializeDefaultCategories: () => {
          const { categories } = get();

          // If no categories exist, populate defaults with refined presentations
          if (categories.length === 0) {
            set({
              categories: refineCategoryPresentations(DEFAULT_CATEGORIES),
            });
            return;
          }

          // Check if any category is missing icon/color or if colors are duplicated
          const colorCounts: Record<string, number> = {};
          let hasMissing = false;

          categories.forEach((c) => {
            if (!c.icon || c.icon === '✨' || !c.color) hasMissing = true;
            colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
          });

          const hasDuplicates = Object.values(colorCounts).some((count) => count > 1);

          if (hasMissing || hasDuplicates) {
            const refined = refineCategoryPresentations(categories);
            set({ categories: refined });
          }
        },
      }),
      {
        name: 'category-store',
        version: 3,
        migrate: (persistedState: any, version: number) => {
          if (version < 3 && Array.isArray(persistedState?.categories)) {
            return {
              ...persistedState,
              categories: refineCategoryPresentations(persistedState.categories),
            };
          }
          return persistedState;
        },
      }
    )
  );
