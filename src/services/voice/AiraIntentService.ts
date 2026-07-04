import type { Category, Expense } from '@/types';
import type { BudgetDeduction } from '@/store/budgetStore';
import { getTransactionSignedAmount, isCreditTransaction, isDebitTransaction } from '@/store/expenseStore';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import { getSalaryCycleForDate } from '@/utils/salaryCycle';
import { voiceParser, type PendingVoiceExpense } from '@/services/voice/VoiceParser';

type FinanceTopic =
  | 'salary'
  | 'expense'
  | 'income'
  | 'balance'
  | 'savings'
  | 'budget'
  | 'category'
  | 'trend'
  | 'transaction'
  | 'bills'
  | 'investments';

interface DateRange {
  label: string;
  start: Date;
  end: Date;
}

export interface AiraConversationMemory {
  topic?: FinanceTopic;
  categoryId?: string;
  rangeLabel?: string;
}

export type AiraIntent =
  | { type: 'add_expense'; expense: PendingVoiceExpense; missingFields: Array<'amount' | 'category'> }
  | { type: 'answer'; response: string }
  | { type: 'navigate'; path: string; response: string }
  | { type: 'help'; response: string }
  | { type: 'unknown'; response: string };

export interface AiraFinanceContext {
  categories: Category[];
  expenses: Expense[];
  monthlySalary: number;
  deductions: BudgetDeduction[];
  salaryCreditType: 'fixed' | 'last_working_day';
  fixedCreditDate: number;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[.,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const ASSISTANT_NAME = 'Aira';
export const WAKE_PHRASES = ['hey aira', 'hey ira', 'hey era', 'hey ayra', 'hey air a'];
const WAKE_PHRASE_PATTERN = /\bhey\s+(aira|ira|era|ayra|air\s*a|aira assistant)\b/i;

export const hasWakePhrase = (transcript: string) => {
  const normalized = normalize(transcript);
  return WAKE_PHRASES.some((phrase) => normalized.includes(phrase)) || WAKE_PHRASE_PATTERN.test(normalized);
};

export const stripWakePhrase = (transcript: string) => {
  let cleaned = transcript;
  WAKE_PHRASES.forEach((phrase) => {
    cleaned = cleaned.replace(new RegExp(`\\b${phrase}\\b`, 'i'), ' ');
  });
  cleaned = cleaned.replace(WAKE_PHRASE_PATTERN, ' ');
  return cleaned.replace(/\s+/g, ' ').trim();
};

const isExpenseIntent = (text: string) =>
  /\b(add|record|paid|pay|bought|purchase)\b/i.test(text);

const isNavigationIntent = (text: string) =>
  /\b(open|go to|show|take me to)\b/i.test(text);

const getCategoryMap = (categories: Category[]) =>
  new Map(categories.map((category) => [category.id, category]));

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) => {
  const result = startOfDay(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getWeekRange = (offset = 0): DateRange => {
  const today = startOfDay(new Date());
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = addDays(today, -mondayOffset + offset * 7);
  const end = endOfDay(addDays(start, 6));
  return { label: offset ? 'last week' : 'this week', start, end };
};

const getMonthRange = (offset = 0): DateRange => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const end = endOfDay(new Date(today.getFullYear(), today.getMonth() + offset + 1, 0));
  return {
    label: offset ? 'last month' : 'this month',
    start,
    end,
  };
};

const monthNames = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const getRangeFromText = (text: string): DateRange => {
  const today = new Date();

  if (/\btoday\b/.test(text)) return { label: 'today', start: startOfDay(today), end: endOfDay(today) };
  if (/\byesterday\b/.test(text)) {
    const yesterday = addDays(today, -1);
    return { label: 'yesterday', start: startOfDay(yesterday), end: endOfDay(yesterday) };
  }
  if (/\blast week\b/.test(text)) return getWeekRange(-1);
  if (/\b(this week|weekly|week)\b/.test(text)) return getWeekRange();
  if (/\blast month\b/.test(text)) return getMonthRange(-1);

  const mentionedMonth = monthNames.findIndex((month) => new RegExp(`\\b${month}\\b`).test(text));
  if (mentionedMonth >= 0) {
    const year = today.getFullYear();
    return {
      label: monthNames[mentionedMonth],
      start: new Date(year, mentionedMonth, 1),
      end: endOfDay(new Date(year, mentionedMonth + 1, 0)),
    };
  }

  return getMonthRange();
};

const getPreviousRange = (label?: string) => {
  if (label === 'last month') return getMonthRange(-2);
  if (label === 'this week') return getWeekRange(-1);
  if (label === 'last week') return getWeekRange(-2);
  return getMonthRange(-1);
};

const inRange = (expense: Expense, range: DateRange) => {
  const time = new Date(expense.date).getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
};

const getExpensesInRange = (context: AiraFinanceContext, range: DateRange) =>
  context.expenses.filter((expense) => inRange(expense, range) && isDebitTransaction(expense));

const getTransactionsInRange = (context: AiraFinanceContext, range: DateRange) =>
  context.expenses.filter((expense) => inRange(expense, range));

const getActiveDeductionsTotal = (deductions: BudgetDeduction[]) =>
  deductions
    .filter((deduction) => deduction.isActive)
    .reduce((total, deduction) => total + deduction.amount, 0);

const getNetSalary = (context: AiraFinanceContext) =>
  Math.max(0, context.monthlySalary - getActiveDeductionsTotal(context.deductions));

const getCategoryFromText = (text: string, categories: Category[]) => {
  const normalized = normalize(text);
  const aliases: Record<string, string[]> = {
    food: ['food', 'restaurant', 'dining', 'grocery', 'groceries'],
    travel: ['travel', 'cab', 'taxi', 'uber', 'train', 'flight'],
    shopping: ['shopping', 'clothes', 'clothing'],
    entertainment: ['entertainment', 'movie', 'movies'],
    bills: ['bill', 'bills', 'electricity', 'internet', 'mobile', 'recharge', 'credit card'],
    fuel: ['fuel', 'petrol', 'diesel', 'gas'],
    sip: ['sip', 'mutual fund'],
  };

  return categories.find((category) => {
    const categoryName = normalize(category.name);
    const words = aliases[category.id] || [];
    return normalized.includes(categoryName) || words.some((word) => normalized.includes(word));
  });
};

const getCurrentCycleExpenses = (context: AiraFinanceContext) => {
  const cycle = getSalaryCycleForDate(new Date(), context.salaryCreditType, context.fixedCreditDate);
  return {
    cycle,
    expenses: context.expenses.filter((expense) => expense.salaryCycleId === cycle.id && isDebitTransaction(expense)),
    transactions: context.expenses.filter((expense) => expense.salaryCycleId === cycle.id),
  };
};

const summarizeSpending = (context: AiraFinanceContext) => {
  const { cycle, expenses, transactions } = getCurrentCycleExpenses(context);
  const spent = expenses.reduce((total, expense) => total + expense.amount, 0);
  const netCashFlow = transactions.reduce((total, expense) => total + getTransactionSignedAmount(expense), 0);
  const activeDeductions = context.deductions
    .filter((deduction) => deduction.isActive)
    .reduce((total, deduction) => total + deduction.amount, 0);
  const disposable = Math.max(0, context.monthlySalary - activeDeductions);
  const remaining = Math.max(0, disposable + netCashFlow);

  if (!context.monthlySalary) {
    return `You have spent ${formatCurrency(spent)} in this salary cycle, from ${formatDateShort(cycle.startDate)} to ${formatDateShort(cycle.endDate)}. Add your salary in settings for budget-aware answers.`;
  }

  return `You have spent ${formatCurrency(spent)} this salary cycle and have about ${formatCurrency(remaining)} left from your disposable budget.`;
};

const summarizeSalary = (context: AiraFinanceContext, text: string, range: DateRange) => {
  if (!context.monthlySalary) {
    return 'I do not see a salary set yet. You can add it in settings.';
  }

  const deductions = getActiveDeductionsTotal(context.deductions);
  const asksGross = /\b(gross|before deduction|before deductions)\b/.test(text);
  const asksDeductions = /\b(deduction|deductions)\b/.test(text);

  if (asksGross) return `Your gross salary is ${formatCurrency(context.monthlySalary)}.`;
  if (asksDeductions) {
    return `Your salary after deductions is ${formatCurrency(getNetSalary(context))}. Active deductions total ${formatCurrency(deductions)}.`;
  }

  return `Your salary for ${range.label} is ${formatCurrency(getNetSalary(context))} after deductions.`;
};

const summarizeExpenses = (
  context: AiraFinanceContext,
  range: DateRange,
  category?: Category
) => {
  const expenses = getExpensesInRange(context, range).filter(
    (expense) => !category || expense.categoryId === category.id
  );
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryLabel = category ? ` on ${category.name}` : '';

  return `You spent ${formatCurrency(total)}${categoryLabel} ${range.label}.`;
};

const summarizeIncome = (context: AiraFinanceContext, range: DateRange) => {
  const netSalary = getNetSalary(context);
  const credits = getTransactionsInRange(context, range)
    .filter(isCreditTransaction)
    .reduce((sum, expense) => sum + expense.amount, 0);
  if (!netSalary && !credits) return 'I do not see any income configured yet.';
  return `Your configured income is ${formatCurrency(netSalary)} and recorded credits are ${formatCurrency(credits)} for ${range.label}.`;
};

const summarizeBalance = (context: AiraFinanceContext) => {
  const { transactions } = getCurrentCycleExpenses(context);
  const netCashFlow = transactions.reduce((total, expense) => total + getTransactionSignedAmount(expense), 0);
  const remaining = Math.max(0, getNetSalary(context) + netCashFlow);

  return `You have about ${formatCurrency(remaining)} left in this salary cycle.`;
};

const summarizeSavings = (context: AiraFinanceContext, range: DateRange, previousRange?: DateRange) => {
  const netSalary = getNetSalary(context);
  const totalSpent = getExpensesInRange(context, range).reduce((sum, expense) => sum + expense.amount, 0);
  const savings = Math.max(0, netSalary - totalSpent);
  const rate = netSalary ? Math.round((savings / netSalary) * 100) : 0;

  if (previousRange) {
    const previousSpent = getExpensesInRange(context, previousRange).reduce((sum, expense) => sum + expense.amount, 0);
    const previousSavings = Math.max(0, netSalary - previousSpent);
    const diff = savings - previousSavings;
    const direction = diff >= 0 ? 'higher' : 'lower';
    return `Your savings are ${formatCurrency(Math.abs(diff))} ${direction} than ${previousRange.label}. Current savings are ${formatCurrency(savings)}.`;
  }

  return `You saved about ${formatCurrency(savings)} ${range.label}, a ${rate}% savings rate.`;
};

const summarizeBudget = (context: AiraFinanceContext, range: DateRange) => {
  const budget = getNetSalary(context);
  const spent = getExpensesInRange(context, range).reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(0, budget - spent);
  const used = budget ? Math.round((spent / budget) * 100) : 0;

  if (!budget) return 'I need your salary and deductions set before I can calculate budget remaining.';
  if (spent > budget) return `You have exceeded your ${range.label} budget by ${formatCurrency(spent - budget)}.`;
  return `You have ${formatCurrency(remaining)} left from your ${range.label} budget. That is ${used}% used.`;
};

const summarizeTopCategory = (context: AiraFinanceContext) => {
  const categoryMap = getCategoryMap(context.categories);
  const { expenses } = getCurrentCycleExpenses(context);
  const totals = new Map<string, number>();

  expenses.forEach((expense) => {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) || 0) + expense.amount);
  });

  const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return 'You do not have any expenses in the current salary cycle yet.';

  const category = categoryMap.get(top[0]);
  return `${category?.name || 'Your top category'} is currently your biggest spend at ${formatCurrency(top[1])}.`;
};

const summarizeCategoryBreakdown = (context: AiraFinanceContext, range: DateRange) => {
  const categoryMap = getCategoryMap(context.categories);
  const totals = new Map<string, number>();

  getExpensesInRange(context, range).forEach((expense) => {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) || 0) + expense.amount);
  });

  const topCategories = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!topCategories.length) return `You do not have any expenses ${range.label}.`;

  const summary = topCategories
    .map(([categoryId, total]) => `${categoryMap.get(categoryId)?.name || 'Unknown'} ${formatCurrency(total)}`)
    .join(', ');
  return `Your top categories ${range.label} are ${summary}.`;
};

const summarizeRecentExpense = (context: AiraFinanceContext) => {
  const categoryMap = getCategoryMap(context.categories);
  const recent = [...context.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  if (!recent) return 'You have not added any expenses yet.';

  const category = categoryMap.get(recent.categoryId);
  const note = recent.note || recent.description ? ` for ${recent.note || recent.description}` : '';
  const kind = isCreditTransaction(recent) ? 'credit' : 'expense';
  return `Your latest ${kind} is ${formatCurrency(recent.amount)} under ${category?.name || 'Unknown'}${note}.`;
};

const summarizeTrend = (context: AiraFinanceContext, range: DateRange) => {
  const previousRange = getPreviousRange(range.label);
  const currentSpent = getExpensesInRange(context, range).reduce((sum, expense) => sum + expense.amount, 0);
  const previousSpent = getExpensesInRange(context, previousRange).reduce((sum, expense) => sum + expense.amount, 0);
  const diff = currentSpent - previousSpent;

  if (!previousSpent && !currentSpent) return 'I do not have enough spending data to show a trend yet.';
  if (!previousSpent) return `You spent ${formatCurrency(currentSpent)} ${range.label}. I do not have ${previousRange.label} data to compare yet.`;

  const percent = Math.round((Math.abs(diff) / previousSpent) * 100);
  const direction = diff >= 0 ? 'increased' : 'decreased';
  return `Your spending ${direction} by ${percent}% versus ${previousRange.label}.`;
};

const summarizeUnsupported = (topic: FinanceTopic) => {
  if (topic === 'bills') return 'I can see bill-related expenses, but pending bill tracking is not connected yet.';
  if (topic === 'investments') return 'Investment tracking is not connected yet. I can still answer SIP or investment-category expenses if you record them.';
  return 'I do not have enough data for that yet.';
};

const classifyTopic = (text: string, memory?: AiraConversationMemory): FinanceTopic | null => {
  if (/\b(salary|earn|earned|earning|earnings|net income|gross|deduction|deductions)\b/.test(text)) return 'salary';
  if (/\b(income|bonus|received)\b/.test(text)) return 'income';
  if (/\b(balance|wallet|bank balance|money.*left|available|remaining balance|left)\b/.test(text)) return 'balance';
  if (/\b(saving|savings|save|saved|savings rate|percentage)\b/.test(text)) return 'savings';
  if (/\b(budget|utilization|exceeded|exceed)\b/.test(text)) return 'budget';
  if (/\b(trend|compare|comparison|increased|decreased|vs|versus)\b/.test(text)) return 'trend';
  if (/\b(recent|latest|last transaction|last five|payments|biggest transaction|largest expense)\b/.test(text)) return 'transaction';
  if (/\b(bill|bills|electricity|internet|mobile recharge|credit card)\b/.test(text)) return 'bills';
  if (/\b(investment|investments|mutual fund|stock|gold|portfolio|returns|sip)\b/.test(text)) return 'investments';
  if (/\b(category|categories|breakdown|distribution|highest|lowest|biggest|most|where did i spend)\b/.test(text)) return 'category';
  if (/\b(expense|expenses|spent|spend|spending|shopping|food|travel|grocery|groceries|fuel|entertainment)\b/.test(text)) return 'expense';
  if (/^(what about|and)\b/.test(text)) return memory?.topic || null;
  return null;
};

export const getAiraConversationMemory = (
  transcript: string,
  context: AiraFinanceContext,
  current: AiraConversationMemory = {}
): AiraConversationMemory => {
  const normalized = normalize(stripWakePhrase(transcript));
  const category = getCategoryFromText(normalized, context.categories);
  const topic = classifyTopic(normalized, current) || current.topic;
  const range = getRangeFromText(normalized);

  return {
    topic: topic || current.topic,
    categoryId: category?.id || current.categoryId,
    rangeLabel: range.label || current.rangeLabel,
  };
};

const routeFor = (text: string) => {
  if (/\b(add|expense|transaction)\b/i.test(text)) return '/add';
  if (/\b(report|reports|analytics|chart|charts)\b/i.test(text)) return '/reports';
  if (/\b(setting|settings|salary|budget)\b/i.test(text)) return '/settings';
  if (/\b(category|categories)\b/i.test(text)) return '/categories';
  if (/\b(home|dashboard)\b/i.test(text)) return '/';
  if (/\b(ai|ask)\b/i.test(text)) return '/ask-ai';
  return null;
};

export class AiraIntentService {
  resolve(
    transcript: string,
    context: AiraFinanceContext,
    memory: AiraConversationMemory = {}
  ): AiraIntent {
    const command = stripWakePhrase(transcript);
    const normalized = normalize(command);

    if (!normalized) {
      return {
        type: 'help',
        response: 'Hi, I am Aira. You can ask me to add an expense, check your spending, show your top category, or open a page.',
      };
    }

    if (/\b(cancel|stop|nothing|never mind|nevermind)\b/i.test(normalized)) {
      return { type: 'help', response: 'Okay, I will stay quiet for now.' };
    }

    if (isExpenseIntent(normalized)) {
      const result = voiceParser.parseExpense(command, context.categories);
      return {
        type: 'add_expense',
        expense: result.expense,
        missingFields: result.missingFields,
      };
    }

    const category = getCategoryFromText(normalized, context.categories)
      || (memory.categoryId ? context.categories.find((item) => item.id === memory.categoryId) : undefined);
    const range = /\b(last month|last week|yesterday|today|this week|week|january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(normalized)
      ? getRangeFromText(normalized)
      : memory.rangeLabel === 'last month' && /^(what about|and)\b/.test(normalized)
        ? getPreviousRange(memory.rangeLabel)
        : getRangeFromText(normalized);
    const topic = classifyTopic(normalized, memory);

    if (topic === 'salary') return { type: 'answer', response: summarizeSalary(context, normalized, range) };
    if (topic === 'income') return { type: 'answer', response: summarizeIncome(context, range) };
    if (topic === 'expense') return { type: 'answer', response: summarizeExpenses(context, range, category) };
    if (topic === 'balance') return { type: 'answer', response: summarizeBalance(context) };
    if (topic === 'savings') {
      return {
        type: 'answer',
        response: summarizeSavings(context, range, /\bcompare|last month|last week\b/.test(normalized) ? getPreviousRange(range.label) : undefined),
      };
    }
    if (topic === 'budget') return { type: 'answer', response: summarizeBudget(context, range) };
    if (topic === 'category') return { type: 'answer', response: summarizeCategoryBreakdown(context, range) };
    if (topic === 'trend') return { type: 'answer', response: summarizeTrend(context, range) };
    if (topic === 'transaction') return { type: 'answer', response: summarizeRecentExpense(context) };
    if (topic === 'bills' || topic === 'investments') {
      const categoryAnswer = category ? summarizeExpenses(context, range, category) : summarizeUnsupported(topic);
      return { type: 'answer', response: categoryAnswer };
    }

    if (/\b(total|spend|spent|spending|left|remaining|balance|budget)\b/i.test(normalized)) {
      return { type: 'answer', response: summarizeSpending(context) };
    }

    if (/\b(top|highest|biggest|most|category)\b/i.test(normalized)) {
      return { type: 'answer', response: summarizeTopCategory(context) };
    }

    if (/\b(recent|latest|last)\b/i.test(normalized)) {
      return { type: 'answer', response: summarizeRecentExpense(context) };
    }

    if (isNavigationIntent(normalized)) {
      const path = routeFor(normalized);
      if (path) {
        return { type: 'navigate', path, response: 'Opening that for you.' };
      }
    }

    return {
      type: 'unknown',
      response: 'I can help with expenses, budgets, recent transactions, top categories, and opening app pages. Try saying, add 450 for food in a restaurant.',
    };
  }
}

export const airaIntentService = new AiraIntentService();
