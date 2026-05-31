import { motion } from 'framer-motion';
import { useBudgetStore } from '@/store/budgetStore';
import { useExpenseStore } from '@/store/expenseStore';
import { getCalendarDayDiff, getSalaryCycleForDate } from '@/utils/salaryCycle';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import { Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function SalaryCycleCard() {
  const { monthlySalary, salaryCreditType, fixedCreditDate } = useBudgetStore();
  const { getTotalForSalaryCycle } = useExpenseStore();
  const today = new Date();
  const cycle = getSalaryCycleForDate(today, salaryCreditType, fixedCreditDate);

  const totalSalary = monthlySalary;
  const spent = getTotalForSalaryCycle(cycle.id);
  const remaining = Math.max(0, totalSalary - spent);
  const totalDays = Math.max(1, getCalendarDayDiff(cycle.startDate, cycle.nextSalaryDate));
  const elapsedDays = Math.max(1, getCalendarDayDiff(cycle.startDate, today) + 1);
  const daysRemaining = Math.max(0, getCalendarDayDiff(today, cycle.nextSalaryDate));

  const spentPercent = totalSalary > 0 ? Math.min(100, (spent / totalSalary) * 100) : 0;
  const dailyRate = spent / elapsedDays;
  const predictedSavings = Math.max(0, totalSalary - dailyRate * totalDays);

  // AI Insight placeholder logic (mirrors BudgetSummary)
  let aiInsight = '';
  let aiInsightIcon = <TrendingUp className="text-accent-400 animate-pulse" size={16} />;
  let aiInsightClass = 'bg-accent-500/10 border-accent-500/20 text-accent-300';

  if (spent > totalSalary) {
    aiInsight = 'Warning: You have exhausted your salary for this cycle!';
    aiInsightIcon = <AlertTriangle className="text-rose-400" size={16} />;
    aiInsightClass = 'bg-rose-500/10 border-rose-500/20 text-rose-300';
  } else if (spentPercent > 80 && daysRemaining > 3) {
    aiInsight = 'Your spending pace may exhaust salary before the next cycle.';
    aiInsightIcon = <AlertTriangle className="text-amber-400" size={16} />;
    aiInsightClass = 'bg-amber-500/10 border-amber-500/20 text-amber-300';
  } else if (spentPercent > 10) {
    aiInsight = `You are on track, ${formatCurrency(remaining)} left this cycle.`;
    aiInsightClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
  } else {
    aiInsight = 'Your spending is well paced.';
    aiInsightClass = 'bg-dark-900/60 border-dark-700/60 text-dark-300';
  }

  const getProgressColor = (percent: number) => {
    if (percent > 85) return 'bg-rose-500';
    if (percent > 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700/80 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-750">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-dark-400" />
         <div>
  <p className="text-[10px] uppercase tracking-widest text-dark-500">
    Current Salary Cycle
  </p>

  <h3 className="text-sm font-bold text-white">
            {cycle.name}
  </h3>
</div>
        </div>
        <div className="text-right text-xs text-dark-400 bg-dark-900 px-2.5 py-1 rounded-full border border-dark-700 font-medium">
          <span className="text-dark-500">Next</span>{' '}
          <span className="text-emerald-400">{formatDateShort(cycle.nextSalaryDate)}</span>
        </div>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-dark-500 mb-1">Salary</p>
          <h3 className="text-2xl font-black text-white">{formatCurrency(totalSalary)}</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-dark-500 mb-1">Spent</p>
          <p className="text-sm font-bold text-dark-300">{formatCurrency(spent)}</p>
        </div>
      </div>

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
        <span>Salary: {formatCurrency(totalSalary)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
          <p className="text-[9px] uppercase tracking-wider text-dark-500">Remaining Balance</p>
          <p className="mt-1.5 text-base font-extrabold text-emerald-400">{formatCurrency(remaining)}</p>
        </div>
        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
          <p className="text-[9px] text-dark-500 mt-1">Days Until Salary</p>
          <p className="mt-1.5 text-base font-bold text-white flex items-center gap-1.5">
            <Clock size={14} className="text-accent-500" />
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
          <p className="text-[9px] uppercase tracking-wider text-dark-500">Savings Prediction</p>
          <p className="mt-1.5 text-base font-bold text-emerald-400">{formatCurrency(predictedSavings)}</p>
        </div>
        <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
          <p className="text-[9px] uppercase tracking-wider text-dark-500 mb-2">AI Insight</p>
          <div className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs leading-relaxed ${aiInsightClass}`}>
            <div className="mt-0.5 shrink-0">{aiInsightIcon}</div>
            <div>{aiInsight}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
