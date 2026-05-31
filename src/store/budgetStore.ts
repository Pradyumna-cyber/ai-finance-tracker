import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSalaryCycleForDate, SalaryCreditType } from '@/utils/salaryCycle';

export interface BudgetDeduction {
  id: string;
  name: string;
  amount: number;
  category: 'rent' | 'bills' | 'emi' | 'sip' | 'savings' | 'investment' | 'other';
  isActive: boolean;
}

interface BudgetStore {
  monthlySalary: number;
  deductions: BudgetDeduction[];
  salaryCreditType: SalaryCreditType;
  fixedCreditDate: number;
  salaryReviewNextCycleId: string | null;
  setMonthlySalary: (salary: number) => void;
  addDeduction: (deduction: BudgetDeduction) => void;
  updateDeduction: (id: string, updates: Partial<BudgetDeduction>) => void;
  deleteDeduction: (id: string) => void;
  getActiveDeductionsTotal: () => number;
  getDisposableBudget: () => number;
  toggleDeduction: (id: string) => void;
  setSalaryCreditType: (type: SalaryCreditType) => void;
  setFixedCreditDate: (date: number) => void;
  initializeSalaryReviewReminder: (date?: Date) => void;
  completeSalaryReview: (date?: Date) => void;
}

const getNextSalaryReviewCycleId = (
  date: Date,
  type: SalaryCreditType,
  fixedDate: number
) => {
  const currentCycle = getSalaryCycleForDate(date, type, fixedDate);
  return getSalaryCycleForDate(currentCycle.nextSalaryDate, type, fixedDate).id;
};

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      monthlySalary: 0,
      deductions: [],
      salaryCreditType: 'last_working_day',
      fixedCreditDate: 1,
      salaryReviewNextCycleId: null,

      setMonthlySalary: (salary: number) => {
        set({ monthlySalary: Math.max(0, salary) });
      },

      addDeduction: (deduction: BudgetDeduction) => {
        set((state) => ({
          deductions: [...state.deductions, deduction],
        }));
      },

      updateDeduction: (id: string, updates: Partial<BudgetDeduction>) => {
        set((state) => ({
          deductions: state.deductions.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      deleteDeduction: (id: string) => {
        set((state) => ({
          deductions: state.deductions.filter((d) => d.id !== id),
        }));
      },

      getActiveDeductionsTotal: () => {
        return get()
          .deductions.filter((d) => d.isActive)
          .reduce((sum, d) => sum + d.amount, 0);
      },

      getDisposableBudget: () => {
        const { monthlySalary } = get();
        const totalDeductions = get().getActiveDeductionsTotal();
        return Math.max(0, monthlySalary - totalDeductions);
      },

      toggleDeduction: (id: string) => {
        set((state) => ({
          deductions: state.deductions.map((d) =>
            d.id === id ? { ...d, isActive: !d.isActive } : d
          ),
        }));
      },

      setSalaryCreditType: (type: SalaryCreditType) => {
        set({ salaryCreditType: type });
      },

      setFixedCreditDate: (date: number) => {
        set({ fixedCreditDate: Math.min(31, Math.max(1, date)) });
      },

      initializeSalaryReviewReminder: (date: Date = new Date()) => {
        const { salaryReviewNextCycleId, salaryCreditType, fixedCreditDate } = get();
        if (salaryReviewNextCycleId) return;

        set({
          salaryReviewNextCycleId: getNextSalaryReviewCycleId(
            date,
            salaryCreditType,
            fixedCreditDate
          ),
        });
      },

      completeSalaryReview: (date: Date = new Date()) => {
        const { salaryCreditType, fixedCreditDate } = get();
        set({
          salaryReviewNextCycleId: getNextSalaryReviewCycleId(
            date,
            salaryCreditType,
            fixedCreditDate
          ),
        });
      },
    }),
    {
      name: 'budget-store',
      version: 2,
      migrate: (persistedState: any) => ({
        ...persistedState,
        salaryReviewNextCycleId: persistedState?.salaryReviewNextCycleId ?? null,
      }),
    }
  )
);
