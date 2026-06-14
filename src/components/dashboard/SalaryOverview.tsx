import { motion } from "framer-motion";
import { CalendarDays, Sparkles } from "lucide-react";

import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";
import { getSalaryCycleForDate } from "@/utils/salaryCycle";

export default function SalaryOverview() {
  const { monthlySalary, salaryCreditType, fixedCreditDate, getActiveDeductionsTotal, getDisposableBudget } = useBudgetStore();
  const { getTotalForSalaryCycle } = useExpenseStore();
  const cycle = getSalaryCycleForDate(new Date(), salaryCreditType, fixedCreditDate);
  const totalSpent = getTotalForSalaryCycle(cycle.id);
  const disposableBudget = getDisposableBudget();
  const deductions = getActiveDeductionsTotal();

  const remainingBalance = disposableBudget - totalSpent;

  const spentPercentage =
    disposableBudget > 0
      ? (totalSpent / disposableBudget) * 100
      : 0;

  const today = new Date();
  const nextSalaryDate = cycle.nextSalaryDate;

  const daysLeft = Math.max(
    Math.ceil(
      (nextSalaryDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    1
  );

  const safeDailySpend =
    remainingBalance > 0
      ? remainingBalance / daysLeft
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card relative overflow-hidden p-4"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">
            Salary overview
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            ₹{remainingBalance.toLocaleString()}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Available after recurring deductions
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            rounded-2xl
            border
            border-cyan-400/15
            bg-cyan-500/[0.06]
            px-3
            py-2
          "
        >
          <CalendarDays className="h-4 w-4 text-cyan-400" />

          <span className="text-xs font-semibold text-cyan-100">
            {daysLeft} days left
          </span>
        </div>
      </div>

      {/* Progress */}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>{spentPercentage.toFixed(0)}% spent</span>

          <span>
            ₹{totalSpent.toLocaleString()} used
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#030814]">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(spentPercentage, 100)}%`,
            }}
            transition={{ duration: 0.6 }}
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-cyan-400
              to-blue-500
            "
          />
        </div>
      </div>

      {/* Metrics */}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div
          className="
            rounded-2xl
            border
            border-white/[0.07]
            bg-white/[0.035]
            p-3
          "
        >
          <p className="text-xs text-slate-500">
            Monthly salary
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            ₹{monthlySalary.toLocaleString()}
          </h3>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-white/[0.07]
            bg-white/[0.035]
            p-3
          "
        >
          <p className="text-xs text-slate-500">
            Deductions
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            ₹{deductions.toLocaleString()}
          </h3>
        </div>
        <div className="soft-panel p-3">
          <p className="text-xs text-slate-500">Safe daily spend</p>
          <h3 className="mt-1 text-lg font-semibold text-white">₹{safeDailySpend.toFixed(0)}</h3>
        </div>
        <div className="soft-panel p-3">
          <p className="text-xs text-slate-500">Spent this cycle</p>
          <h3 className="mt-1 text-lg font-semibold text-white">₹{totalSpent.toLocaleString()}</h3>
        </div>
      </div>

      {/* AI Insight */}

      <div
        className="
          mt-4
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-violet-400/15
          bg-gradient-to-r from-violet-500/[0.08] to-cyan-500/[0.06]
          p-3
        "
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
          <Sparkles className="h-4 w-4 text-violet-300" />
        </div>

        <div>
          <p className="text-sm font-semibold text-violet-200">
            Copilot pulse
          </p>

          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            You are currently spending within safe
            limits this salary cycle.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
