export type CategoryId = string;
export type ExpenseId = string;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: ExpenseId;
  amount: number;
  categoryId: CategoryId;
  note: string;
  date: Date;
  createdAt: Date;
  salaryCycleId: string;
}

export interface DashboardSummary {
  totalMonthly: number;
  budgetRemaining: number;
  topCategory: Category | null;
  topCategoryAmount: number;
  recentTransactions: Expense[];
}

export interface CategoryExpense {
  categoryId: CategoryId;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
}
