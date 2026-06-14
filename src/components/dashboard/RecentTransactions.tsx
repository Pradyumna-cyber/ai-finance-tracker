import { motion } from 'framer-motion';
import { ChevronRight, Receipt, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { formatCurrency, formatTime, getRelativeDate } from '@/utils/formatters';

export default function RecentTransactions() {
  const { recentExpenses } = useDashboard(new Date());
  const { getCategoryById } = useCategoryStore();
  const { deleteExpense } = useExpenseStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  if (recentExpenses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 text-center"
      >
        <p className="text-dark-500 text-sm">No transactions yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="surface-card p-4"
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Latest activity</p>
          <h3 className="section-title mt-1">Recent transactions</h3>
        </div>
        <Link
          to="/reports"
          className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-2 sm:grid-cols-2"
      >
        {recentExpenses.map((expense) => {
          const category = getCategoryById(expense.categoryId);
          return (
            <motion.div
              key={expense.id}
              variants={item}
              className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition-all hover:border-cyan-400/15 hover:bg-white/[0.045]"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#07111f] text-xl">
                  {category?.icon || '💰'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {expense.note || category?.name || 'Unknown'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Receipt size={11} />
                    {category?.name || 'Unknown'} ·{' '}
                    {getRelativeDate(new Date(expense.date))} at{' '}
                    {formatTime(expense.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  -{formatCurrency(expense.amount)}
                </span>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-500/20"
                  title="Delete expense"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
