import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, IndianRupee, Sparkles } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import { getSalaryCycleById, getSalaryCycleForDate } from '@/utils/salaryCycle';

export default function SalaryReviewModal() {
  const {
    monthlySalary,
    salaryCreditType,
    fixedCreditDate,
    salaryReviewNextCycleId,
    setMonthlySalary,
    initializeSalaryReviewReminder,
    completeSalaryReview,
  } = useBudgetStore();

  const [salaryInput, setSalaryInput] = useState(monthlySalary.toString());

  const [today, setToday] = useState(() => new Date());
  const currentCycle = getSalaryCycleForDate(today, salaryCreditType, fixedCreditDate);

  useEffect(() => {
    initializeSalaryReviewReminder();
  }, [initializeSalaryReviewReminder]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setToday(new Date());
    }, 60 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setSalaryInput(monthlySalary.toString());
  }, [monthlySalary]);

  const shouldShow =
    !!salaryReviewNextCycleId && currentCycle.id >= salaryReviewNextCycleId;

  const reviewCycle = salaryReviewNextCycleId
    ? getSalaryCycleById(salaryReviewNextCycleId, salaryCreditType, fixedCreditDate)
    : currentCycle;

  const nextReviewCycle = getSalaryCycleForDate(
    currentCycle.nextSalaryDate,
    salaryCreditType,
    fixedCreditDate
  );

  const parsedSalary = Number(salaryInput);
  const isValidSalary = Number.isFinite(parsedSalary) && parsedSalary >= 0;

  const handleUpdate = () => {
    if (!isValidSalary) return;
    setMonthlySalary(parsedSalary);
    completeSalaryReview();
  };

  const handleNoChange = () => {
    setSalaryInput(monthlySalary.toString());
    completeSalaryReview();
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-dark-950/85 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-dark-700 bg-gradient-to-br from-dark-800 to-dark-900 shadow-2xl"
          >
            <div className="border-b border-dark-700/80 p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-300">
                <CalendarCheck size={24} />
              </div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-accent-300">
                Salary Review
              </p>
              <h2 className="text-2xl font-black text-white">
                Update this cycle's salary?
              </h2>
              <p className="mt-2 text-sm leading-6 text-dark-400">
                New salary cycle started on {formatDateShort(reviewCycle.startDate)}.
                Confirm your salary amount so budgets and predictions stay accurate.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-dark-700 bg-dark-950/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-dark-500">
                    Current saved salary
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(monthlySalary)}
                  </span>
                </div>
                <label className="mb-2 block text-sm font-medium text-dark-300">
                  Salary for this cycle
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 focus-within:border-accent-500">
                  <IndianRupee size={18} className="shrink-0 text-dark-500" />
                  <input
                    type="number"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    min="0"
                    className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-dark-600"
                    placeholder="Enter salary amount"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-accent-500/20 bg-accent-500/10 p-3 text-xs leading-5 text-accent-200">
                <Sparkles size={16} className="mt-0.5 shrink-0" />
                <span>
                  After this, I'll remind you again from the next salary cycle:
                  {' '}
                  {formatDateShort(nextReviewCycle.startDate)}.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleNoChange}
                  className="rounded-xl border border-dark-700 bg-dark-950 px-4 py-3 text-sm font-semibold text-dark-200 transition hover:bg-dark-800"
                >
                  No Change
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={!isValidSalary}
                  className="rounded-xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:bg-dark-700 disabled:text-dark-400"
                >
                  Update Salary
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
