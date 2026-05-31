import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, ExpenseId } from '@/types';
import { useBudgetStore } from '@/store/budgetStore';
import { getSalaryCycleForDate } from '@/utils/salaryCycle';

interface ExpenseStore {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'salaryCycleId'> & { salaryCycleId?: string }) => void;
  updateExpense: (id: ExpenseId, expense: Partial<Expense>) => void;
  deleteExpense: (id: ExpenseId) => void;
  getExpenseById: (id: ExpenseId) => Expense | undefined;
  getExpensesByMonth: (date: Date) => Expense[];
  getExpensesBySalaryCycle: (cycleId: string) => Expense[];
  getRecentExpenses: (limit: number) => Expense[];
  getTotalByCategory: (categoryId: string) => number;
  getTotalMonthly: (date: Date) => number;
  getTotalForSalaryCycle: (cycleId: string) => number;
  recalculateSalaryCycleIds: () => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense: Omit<Expense, 'salaryCycleId'> & { salaryCycleId?: string }) => {
        const { salaryCreditType, fixedCreditDate } = useBudgetStore.getState();
        const cycle = getSalaryCycleForDate(new Date(expense.date), salaryCreditType, fixedCreditDate);
        const expenseWithCycle = {
          ...expense,
          salaryCycleId: expense.salaryCycleId || cycle.id,
        };
        set((state) => ({
          expenses: [...state.expenses, expenseWithCycle as Expense],
        }));
      },

      updateExpense: (id: ExpenseId, updates: Partial<Expense>) => {
        const { salaryCreditType, fixedCreditDate } = useBudgetStore.getState();
        set((state) => ({
          expenses: state.expenses.map((exp) => {
            if (exp.id !== id) return exp;
            const newDate = updates.date ? new Date(updates.date) : new Date(exp.date);
            const cycle = getSalaryCycleForDate(newDate, salaryCreditType, fixedCreditDate);
            return {
              ...exp,
              ...updates,
              salaryCycleId: updates.salaryCycleId || (updates.date ? cycle.id : exp.salaryCycleId),
            } as Expense;
          }),
        }));
      },

      deleteExpense: (id: ExpenseId) => {
        set((state) => ({
          expenses: state.expenses.filter((exp) => exp.id !== id),
        }));
      },

      getExpenseById: (id: ExpenseId) => {
        return get().expenses.find((exp) => exp.id === id);
      },

      getExpensesByMonth: (date: Date) => {
        const month = date.getMonth();
        const year = date.getFullYear();
        return get().expenses.filter((exp) => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === month && expDate.getFullYear() === year;
        });
      },

      getExpensesBySalaryCycle: (cycleId: string) => {
        return get().expenses.filter((exp) => exp.salaryCycleId === cycleId);
      },

      getRecentExpenses: (limit: number) => {
        return [...get().expenses]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      },

      getTotalByCategory: (categoryId: string) => {
        return get().expenses
          .filter((exp) => exp.categoryId === categoryId)
          .reduce((total, exp) => total + exp.amount, 0);
      },

      getTotalMonthly: (date: Date) => {
        return get()
          .getExpensesByMonth(date)
          .reduce((total, exp) => total + exp.amount, 0);
      },

      getTotalForSalaryCycle: (cycleId: string) => {
        return get()
          .getExpensesBySalaryCycle(cycleId)
          .reduce((total, exp) => total + exp.amount, 0);
      },

      recalculateSalaryCycleIds: () => {
        const { salaryCreditType, fixedCreditDate } = useBudgetStore.getState();
        set((state) => ({
          expenses: state.expenses.map((exp) => ({
            ...exp,
            salaryCycleId: getSalaryCycleForDate(
              new Date(exp.date),
              salaryCreditType,
              fixedCreditDate
            ).id,
          })),
        }));
      },
    }),
    {
      name: 'expense-store',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const state = persistedState as any;
          if (state && Array.isArray(state.expenses)) {
            state.expenses = state.expenses.map((exp: any) => {
              if (!exp.salaryCycleId) {
                const cycle = getSalaryCycleForDate(new Date(exp.date), 'last_working_day', 1);
                return { ...exp, salaryCycleId: cycle.id };
              }
              return exp;
            });
          }
          return state;
        }
        return persistedState;
      },
    }
  )
);
