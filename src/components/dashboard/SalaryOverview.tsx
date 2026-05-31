import { motion } from "framer-motion";
import { CalendarDays, Sparkles } from "lucide-react";

import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";

export default function SalaryOverview() {
  const { monthlySalary } = useBudgetStore();

  const { expenses } = useExpenseStore();

  const totalSpent = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const remainingBalance = monthlySalary - totalSpent;

  const spentPercentage =
    monthlySalary > 0
      ? (totalSpent / monthlySalary) * 100
      : 0;

  const today = new Date();

  const nextSalaryDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

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
      className="
        rounded-3xl
        border
        border-white/10
        bg-gradient-to-br
        from-[#111827]
        to-[#0f172a]
        p-5
        shadow-2xl
      "
    >
      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400">
            Salary Cycle
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            ₹{remainingBalance.toLocaleString()}
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Remaining balance
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-3
            py-2
          "
        >
          <CalendarDays className="h-4 w-4 text-cyan-400" />

          <span className="text-sm text-white">
            {daysLeft} days left
          </span>
        </div>
      </div>

      {/* Progress */}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span>{spentPercentage.toFixed(0)}% spent</span>

          <span>
            ₹{totalSpent.toLocaleString()} used
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
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

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/5
            p-3
          "
        >
          <p className="text-xs text-zinc-400">
            Safe Daily Spend
          </p>

          <h3 className="mt-1 text-lg font-semibold text-white">
            ₹{safeDailySpend.toFixed(0)}
          </h3>

          <p className="text-xs text-zinc-500">
            per day
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/5
            p-3
          "
        >
          <p className="text-xs text-zinc-400">
            Total Spent
          </p>

          <h3 className="mt-1 text-lg font-semibold text-white">
            ₹{totalSpent.toLocaleString()}
          </h3>

          <p className="text-xs text-zinc-500">
            this cycle
          </p>
        </div>
      </div>

      {/* AI Insight */}

      <div
        className="
          mt-5
          flex
          items-start
          gap-3
          rounded-2xl
          border
          border-cyan-500/20
          bg-cyan-500/10
          p-3
        "
      >
        <Sparkles className="mt-0.5 h-4 w-4 text-cyan-400" />

        <div>
          <p className="text-sm font-medium text-cyan-300">
            AI Insight
          </p>

          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            You are currently spending within safe
            limits this salary cycle.
          </p>
        </div>
      </div>
    </motion.div>
  );
}