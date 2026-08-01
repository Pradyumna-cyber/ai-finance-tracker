import { motion } from 'framer-motion';
import { ArrowLeft, Receipt, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isCreditTransaction, useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { formatCurrency, formatTime, getRelativeDate } from '@/utils/formatters';

export default function Transactions() {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenseStore();
  const { getCategoryById } = useCategoryStore();
  const transactions = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="app-page"
    >
      <div className="page-shell max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="soft-panel flex h-10 w-10 items-center justify-center text-slate-400 transition hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="eyebrow">Your activity</p>
            <h1 className="page-title mt-1">All transactions</h1>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-slate-500">
            No transactions yet. Add your first transaction to see it here.
          </div>
        ) : (
          <div className="surface-card overflow-hidden p-3 sm:p-4">
            <p className="mb-3 px-1 text-xs text-slate-500">
              {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} · newest first
            </p>
            <div className="space-y-2">
              {transactions.map((expense, index) => {
                const category = getCategoryById(expense.categoryId);
                const isCredit = isCreditTransaction(expense);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-cyan-400/15 hover:bg-white/[0.045]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#07111f] text-xl">
                        {category?.icon || '💰'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {expense.note || expense.description || category?.name || 'Unknown'}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                          <Receipt size={11} />
                          <span>{category?.name || 'Unknown'} · {isCredit ? 'Credit' : 'Debit'} · {getRelativeDate(new Date(expense.date))} at {formatTime(expense.date)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-sm font-bold ${isCredit ? 'text-emerald-300' : 'text-white'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(expense.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        className="rounded p-1 text-slate-600 transition hover:bg-red-500/20 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete transaction"
                        aria-label={`Delete ${expense.note || category?.name || 'transaction'}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
