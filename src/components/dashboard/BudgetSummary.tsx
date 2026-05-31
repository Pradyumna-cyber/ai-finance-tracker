import { motion } from 'framer-motion';
import { useExpenseStore } from '@/store/expenseStore';
import { useBudgetStore } from '@/store/budgetStore';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import { getCalendarDayDiff, getSalaryCycleForDate } from '@/utils/salaryCycle';
import { Calendar, Sparkles, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function BudgetSummary() {
  const { 
    monthlySalary, 
    salaryCreditType, 
    fixedCreditDate, 
    getActiveDeductionsTotal, 
    getDisposableBudget 
  } = useBudgetStore();
  const { getTotalForSalaryCycle } = useExpenseStore();

  const today = new Date();
  const cycle = getSalaryCycleForDate(today, salaryCreditType, fixedCreditDate);
  
  const disposableBudget = getDisposableBudget();
  const currentCycleSpent = getTotalForSalaryCycle(cycle.id);
  const totalDeductions = getActiveDeductionsTotal();
  const balanceAfterExpenses = Math.max(0, disposableBudget - currentCycleSpent);
  
  const spentPercent = disposableBudget > 0 ? Math.min(100, (currentCycleSpent / disposableBudget) * 100) : 0;

  const totalDays = Math.max(1, getCalendarDayDiff(cycle.startDate, cycle.nextSalaryDate));
  const elapsedDays = Math.max(1, getCalendarDayDiff(cycle.startDate, today) + 1);
  const remainingDays = Math.max(0, getCalendarDayDiff(today, cycle.nextSalaryDate));

  // Projected savings calculation
  const dailyRate = elapsedDays > 0 ? currentCycleSpent / elapsedDays : 0;
  const projectedRemainingSpent = dailyRate * remainingDays;
  const predictedSavings = Math.max(0, disposableBudget - (currentCycleSpent + projectedRemainingSpent));

  // Progress bar color based on percentage
  const getProgressColor = (percent: number) => {
    if (percent > 85) return 'bg-rose-500';
    if (percent > 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Smart AI Copilot Insights
  let aiInsight = '';
  let aiInsightIcon = <Sparkles className="text-accent-400 animate-pulse" size={16} />;
  let aiInsightClass = 'bg-accent-500/10 border-accent-500/20 text-accent-300';

  if (currentCycleSpent > disposableBudget) {
    aiInsight = 'Warning: You have exhausted your disposable budget for this cycle!';
    aiInsightIcon = <AlertTriangle className="text-rose-400" size={16} />;
    aiInsightClass = 'bg-rose-500/10 border-rose-500/20 text-rose-300';
  } else if (spentPercent > 80 && remainingDays > 3) {
    aiInsight = 'Your spending pace may exhaust salary before the next cycle.';
    aiInsightIcon = <AlertTriangle className="text-amber-400" size={16} />;
    aiInsightClass = 'bg-amber-500/10 border-amber-500/20 text-amber-300';
  } else if (dailyRate * totalDays > disposableBudget) {
    aiInsight = `Pace warning: At this spend rate, you may exceed your budget by ${formatCurrency((dailyRate * totalDays) - disposableBudget)}.`;
    aiInsightIcon = <AlertTriangle className="text-amber-400" size={16} />;
    aiInsightClass = 'bg-amber-500/10 border-amber-500/20 text-amber-300';
  } else if (predictedSavings > 0 && spentPercent > 10) {
    aiInsight = `You are likely to save ${formatCurrency(predictedSavings)} this cycle at your current pace!`;
    aiInsightClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
    aiInsightIcon = <TrendingUp className="text-emerald-400" size={16} />;
  } else {
    aiInsight = 'Your spending is well paced. You are on track to stay within your cycle budget.';
    aiInsightClass = 'bg-dark-900/60 border-dark-700/60 text-dark-300';
    aiInsightIcon = <Sparkles className="text-accent-400" size={16} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700/80 shadow-xl relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Salary Cycle Info Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-750">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-dark-400" />
          <span className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
            {cycle.name}
          </span>
        </div>
        <div className="text-xs text-dark-400 bg-dark-900 px-2.5 py-1 rounded-full border border-dark-700 font-medium">
          {formatDateShort(cycle.startDate)} → {formatDateShort(cycle.endDate)}
        </div>
      </div>

      {/* Main Budget Numbers */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-dark-500 mb-1">Cycle Budget</p>
          <h3 className="text-2xl font-black text-white">{formatCurrency(disposableBudget)}</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-dark-500 mb-1">Base Salary</p>
          <p className="text-sm font-bold text-dark-300">{formatCurrency(monthlySalary)}</p>
        </div>
      </div>

      {/* Spend Progress Bar */}
      <div className="bg-dark-950 rounded-full overflow-hidden h-2.5 mb-2 border border-dark-800 p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${spentPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${getProgressColor(spentPercent)}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-dark-400 font-semibold mb-4 px-0.5">
        <span>Spent: {spentPercent.toFixed(0)}%</span>
        <span>Limit: {formatCurrency(disposableBudget)}</span>
      </div>

      {/* Cycle Statistics Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
          <p className="text-[9px] uppercase tracking-wider text-dark-500">Spent in Cycle</p>
          <p className="mt-1.5 text-base font-bold text-white">{formatCurrency(currentCycleSpent)}</p>
          {totalDeductions > 0 && (
            <p className="text-[9px] text-dark-500 mt-1">Deductions: {formatCurrency(totalDeductions)}</p>
          )}
        </div>

        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
          <p className="text-[9px] uppercase tracking-wider text-dark-500">Remaining Balance</p>
          <p className="mt-1.5 text-base font-extrabold text-emerald-400">
            {formatCurrency(balanceAfterExpenses)}
          </p>
          <p className="text-[9px] text-dark-500 mt-1">Safe to spend daily</p>
        </div>

        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40 flex items-center justify-between col-span-1">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-dark-500">Days Until Salary</p>
            <p className="mt-1.5 text-base font-bold text-white flex items-center gap-1.5">
              <Clock size={14} className="text-accent-500" />
              {remainingDays} {remainingDays === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40 col-span-1">
          <p className="text-[9px] uppercase tracking-wider text-dark-500">Savings Forecast</p>
          <p className="mt-1.5 text-base font-bold text-emerald-400">
            {formatCurrency(predictedSavings)}
          </p>
          <p className="text-[9px] text-dark-500 mt-1">Projected end balance</p>
        </div>
      </div>

      {/* Intelligent AI Copilot Insight Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${aiInsightClass}`}
      >
        <div className="mt-0.5 shrink-0">{aiInsightIcon}</div>
        <div>
          <span className="font-bold mr-1">Copilot Insight:</span>
          {aiInsight}
        </div>
      </motion.div>
    </motion.div>
  );
}
