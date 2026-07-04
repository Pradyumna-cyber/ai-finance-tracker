import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { getTransactionSignedAmount, isDebitTransaction } from '@/store/expenseStore';
import { SalaryInsightInput } from '@/ai/schemas/salaryInsightSchema';
import { formatDateShort } from '@/utils/formatters';
import { getCalendarDayDiff, getSalaryCycleForDate } from '@/utils/salaryCycle';

export function buildSalaryInsightInput(date: Date = new Date()): SalaryInsightInput {
  const { expenses } = useExpenseStore.getState();
  const { categories } = useCategoryStore.getState();
  const { monthlySalary, salaryCreditType, fixedCreditDate } = useBudgetStore.getState();

  const currentCycle = getSalaryCycleForDate(date, salaryCreditType, fixedCreditDate);
  const previousCycleDate = new Date(currentCycle.startDate);
  previousCycleDate.setDate(previousCycleDate.getDate() - 1);
  const previousCycle = getSalaryCycleForDate(previousCycleDate, salaryCreditType, fixedCreditDate);

  const currentCycleTransactions = expenses.filter((expense) => expense.salaryCycleId === currentCycle.id);
  const currentCycleExpenses = currentCycleTransactions.filter(isDebitTransaction);
  const previousCycleExpenses = expenses.filter((expense) => expense.salaryCycleId === previousCycle.id && isDebitTransaction(expense));

  const spent = currentCycleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousCycleSpent = previousCycleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netCashFlow = currentCycleTransactions.reduce((sum, expense) => sum + getTransactionSignedAmount(expense), 0);
  const remaining = Math.max(0, monthlySalary + netCashFlow);
  const totalCycleDays = Math.max(1, getCalendarDayDiff(currentCycle.startDate, currentCycle.nextSalaryDate));
  const elapsedDays = Math.max(1, getCalendarDayDiff(currentCycle.startDate, date) + 1);
  const daysUntilSalary = Math.max(0, getCalendarDayDiff(date, currentCycle.nextSalaryDate));
  const dailySpendingPace = spent / elapsedDays;
  const safeDailySpend = daysUntilSalary > 0 ? remaining / daysUntilSalary : remaining;
  const predictedSavings = Math.max(0, monthlySalary - dailySpendingPace * totalCycleDays);
  const percentageChangeFromPreviousCycle =
    previousCycleSpent > 0 ? ((spent - previousCycleSpent) / previousCycleSpent) * 100 : 0;

  const topCategories = categories
    .map((category) => {
      const amount = currentCycleExpenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        name: category.name,
        amount,
        percentage: spent > 0 ? (amount / spent) * 100 : 0,
      };
    })
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    cycleId: currentCycle.id,
    cycleLabel: currentCycle.name,
    cycleStartDate: currentCycle.startDate.toISOString(),
    cycleEndDate: currentCycle.endDate.toISOString(),
    salary: monthlySalary,
    spent,
    remaining,
    daysUntilSalary,
    elapsedDays,
    totalCycleDays,
    dailySpendingPace,
    safeDailySpend,
    predictedSavings,
    previousCycleSpent,
    percentageChangeFromPreviousCycle,
    topCategories,
  };
}

export function getSalaryInsightCacheKey(input: SalaryInsightInput) {
  return [
    'salary-insight',
    input.cycleId,
    input.salary,
    input.spent,
    formatDateShort(input.cycleEndDate),
  ].join(':');
}
