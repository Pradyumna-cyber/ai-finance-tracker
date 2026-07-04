import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import { CategoryExpense, Expense } from '@/types';
import { getSalaryCycleForDate, getRecentSalaryCycles } from '@/utils/salaryCycle';
import { getTransactionSignedAmount, isDebitTransaction } from '@/store/expenseStore';

export const useDashboard = (date: Date) => {
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();

  const cycle = getSalaryCycleForDate(date, salaryCreditType, fixedCreditDate);
  const cycleTransactions = expenses.filter((e) => e.salaryCycleId === cycle.id);
  const cycleExpenses = cycleTransactions.filter(isDebitTransaction);
  const totalCycle = cycleExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netCycle = cycleTransactions.reduce((sum, e) => sum + getTransactionSignedAmount(e), 0);

  const categoryExpenses: CategoryExpense[] = categories
    .map((cat) => {
      const catExpenses = cycleExpenses.filter((e) => e.categoryId === cat.id);
      const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        total,
        percentage: totalCycle > 0 ? (total / totalCycle) * 100 : 0,
        count: catExpenses.length,
      };
    })
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const topCategory = categoryExpenses[0];
  const recentExpenses = [...cycleTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    totalCycle: totalCycle,
    netCycle,
    categoryExpenses,
    topCategory: topCategory || null,
    recentExpenses,
    expenseCount: cycleExpenses.length,
    transactionCount: cycleTransactions.length,
    cycleName: cycle.name,
  };
};

export const useExpensesByCategory = (expenses: Expense[]) => {
  const { categories } = useCategoryStore();

  return categories
    .map((cat) => {
      const categoryExpenses = expenses.filter((e) => e.categoryId === cat.id && isDebitTransaction(e));
      const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        category: cat,
        expenses: categoryExpenses,
        total,
        count: categoryExpenses.length,
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
};

export const useMonthlyTrend = (months: number = 6) => {
  const { expenses } = useExpenseStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();

  const recentCycles = getRecentSalaryCycles(salaryCreditType, fixedCreditDate, months);
  
  // Reverse to make it chronological (left to right in charts)
  return recentCycles.reverse().map((cycle) => {
    const total = expenses
      .filter((exp) => exp.salaryCycleId === cycle.id && isDebitTransaction(exp))
      .reduce((sum, exp) => sum + exp.amount, 0);

    const parts = cycle.id.split('-');
    const cycleDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    const label = cycleDate.toLocaleString('en-IN', { month: 'short', year: '2-digit' });

    return {
      month: label,
      total,
      date: cycle.startDate.toISOString().split('T')[0],
    };
  });
};

export const useExpenseStats = () => {
  const { expenses } = useExpenseStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();

  const currentCycle = getSalaryCycleForDate(
    new Date(),
    salaryCreditType,
    fixedCreditDate
  );

  const previousDate = new Date(currentCycle.startDate);
  previousDate.setDate(previousDate.getDate() - 1);

  const previousCycle = getSalaryCycleForDate(
    previousDate,
    salaryCreditType,
    fixedCreditDate
  );

  const currentCycleExpenses = expenses.filter((e) => e.salaryCycleId === currentCycle.id && isDebitTransaction(e));
  const previousCycleExpenses = expenses.filter((e) => e.salaryCycleId === previousCycle.id && isDebitTransaction(e));

  const currentCycleTotal = currentCycleExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousCycleTotal = previousCycleExpenses.reduce((sum, e) => sum + e.amount, 0);

  const percentageChange =
    previousCycleTotal === 0
      ? 0
      : ((currentCycleTotal - previousCycleTotal) /
          previousCycleTotal) *
        100;

  return {
    currentCycleTotal,
    previousCycleTotal,
    percentageChange,
    currentCycle,
    previousCycle,
    currentCycleCount: currentCycleExpenses.length,
    previousCycleCount: previousCycleExpenses.length,
  };
};
