export type SalaryInsightRiskLevel = 'low' | 'medium' | 'high';

export interface SalaryInsightCategory {
  name: string;
  amount: number;
  percentage: number;
}

export interface SalaryInsightInput {
  cycleId: string;
  cycleLabel: string;
  cycleStartDate: string;
  cycleEndDate: string;
  salary: number;
  spent: number;
  remaining: number;
  daysUntilSalary: number;
  elapsedDays: number;
  totalCycleDays: number;
  dailySpendingPace: number;
  safeDailySpend: number;
  predictedSavings: number;
  previousCycleSpent: number;
  percentageChangeFromPreviousCycle: number;
  topCategories: SalaryInsightCategory[];
}

export interface SalaryInsightOutput {
  riskLevel: SalaryInsightRiskLevel;
  headline: string;
  message: string;
  recommendedAction: string;
  predictedSavingsText: string;
}
