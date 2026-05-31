
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category, CategoryId } from '@/types';

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
  'from-orange-500 to-red-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-purple-500',
  'from-yellow-500 to-orange-500',
  'from-sky-500 to-blue-500',
  'from-cyan-500 to-blue-500',
  'from-red-500 to-pink-500',
  'from-lime-500 to-green-500',
  'from-amber-500 to-yellow-500',
  'from-violet-500 to-fuchsia-500',
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-red-500',
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
              category,
            ],
          }));
        },

        updateCategory: (
          id: CategoryId,
          updates: Partial<Category>
        ) => {
          set((state) => ({
            categories: state.categories.map(
              (cat) =>
                cat.id === id
                  ? { ...cat, ...updates }
                  : cat
            ),
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

          if (categories.length === 0) {
            set({
              categories: DEFAULT_CATEGORIES,
            });
          }
        },
      }),
      {
        name: 'category-store',
        version: 2,
      }
    )
  );

