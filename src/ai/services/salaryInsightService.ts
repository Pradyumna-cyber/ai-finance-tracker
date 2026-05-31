import {
  SalaryInsightInput,
  SalaryInsightOutput,
  SalaryInsightRiskLevel,
} from '@/ai/schemas/salaryInsightSchema';
import { formatCurrency } from '@/utils/formatters';

const getRiskLevel = (input: SalaryInsightInput): SalaryInsightRiskLevel => {
  const spentPercent = input.salary > 0 ? (input.spent / input.salary) * 100 : 0;
  const projectedOverspend = input.predictedSavings <= 0 && input.spent > 0;

  if (spentPercent >= 85 || projectedOverspend) return 'high';
  if (spentPercent >= 60 || input.percentageChangeFromPreviousCycle > 25) return 'medium';
  return 'low';
};

export async function generateSalaryInsight(
  input: SalaryInsightInput
): Promise<SalaryInsightOutput> {
  const riskLevel = getRiskLevel(input);
  const topCategory = input.topCategories[0];
  const categoryText = topCategory
    ? `${topCategory.name} is your top category at ${formatCurrency(topCategory.amount)}`
    : 'No category is dominating your cycle yet';

  if (input.spent === 0) {
    return {
      riskLevel: 'low',
      headline: 'Fresh salary cycle, clean slate',
      message: `You have ${formatCurrency(input.salary)} available for ${input.cycleLabel}.`,
      recommendedAction: `Keep daily spending near ${formatCurrency(input.safeDailySpend)} to stay comfortable.`,
      predictedSavingsText: `Potential savings: ${formatCurrency(input.predictedSavings)}`,
    };
  }

  if (riskLevel === 'high') {
    return {
      riskLevel,
      headline: 'Spending pace is risky',
      message: `You have spent ${formatCurrency(input.spent)} with ${input.daysUntilSalary} days until salary. ${categoryText}.`,
      recommendedAction: `Try to stay below ${formatCurrency(input.safeDailySpend)} per day for the rest of this cycle.`,
      predictedSavingsText: `Projected savings: ${formatCurrency(input.predictedSavings)}`,
    };
  }

  if (riskLevel === 'medium') {
    return {
      riskLevel,
      headline: 'Watch this cycle closely',
      message: `Your current pace is manageable, but spending is ${input.percentageChangeFromPreviousCycle.toFixed(0)}% different from last cycle. ${categoryText}.`,
      recommendedAction: `Review non-essential spends before adding more this week.`,
      predictedSavingsText: `Likely savings: ${formatCurrency(input.predictedSavings)}`,
    };
  }

  return {
    riskLevel,
    headline: 'You are on track',
    message: `You have ${formatCurrency(input.remaining)} left and ${input.daysUntilSalary} days until salary. ${categoryText}.`,
    recommendedAction: `You can spend about ${formatCurrency(input.safeDailySpend)} per day and still stay within this cycle.`,
    predictedSavingsText: `Likely savings: ${formatCurrency(input.predictedSavings)}`,
  };
}
