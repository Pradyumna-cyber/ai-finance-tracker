import { Wallet, CreditCard, PiggyBank, Activity, CalendarClock, Hash, Gauge, TrendingDown } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";
import { getCalendarDayDiff, getSalaryCycleForDate } from "@/utils/salaryCycle";
import { formatCurrency } from "@/utils/formatters";

export default function SummaryCards() {
  const { monthlySalary, salaryCreditType, fixedCreditDate, getDisposableBudget } = useBudgetStore();
  const { getExpensesBySalaryCycle, getTotalForSalaryCycle, getCreditTotalForSalaryCycle, getNetTotalForSalaryCycle } = useExpenseStore();
  const cycle = getSalaryCycleForDate(new Date(), salaryCreditType, fixedCreditDate);
  const cycleTransactions = getExpensesBySalaryCycle(cycle.id);
  const totalSpent = getTotalForSalaryCycle(cycle.id);
  const totalCredits = getCreditTotalForSalaryCycle(cycle.id);
  const netCashFlow = getNetTotalForSalaryCycle(cycle.id);
  const disposableBudget = getDisposableBudget();
  const daysLeft = Math.max(0, getCalendarDayDiff(new Date(), cycle.nextSalaryDate));
  const avgDailySpend = totalSpent / Math.max(1, getCalendarDayDiff(cycle.startDate, new Date()) + 1);

  const remainingBalance = disposableBudget + netCashFlow;

  const spentPercentage =
    disposableBudget > 0
      ? (totalSpent / disposableBudget) * 100
      : 0;

  const healthStatus =
    spentPercentage < 50
      ? "Healthy"
      : spentPercentage < 80
      ? "Warning"
      : "Overspending";

  const healthColor =
    spentPercentage < 50
      ? "text-emerald-400"
      : spentPercentage < 80
      ? "text-orange-400"
      : "text-red-400";

  const cards = [
    {
      title: "Monthly Salary",
      value: formatCurrency(monthlySalary),
      icon: Wallet,
      sub: "Income this cycle",
      tone: "cyan",
    },
    {
      title: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: CreditCard,
      sub: `${spentPercentage.toFixed(0)}% used`,
      tone: "rose",
    },
    {
      title: "Remaining",
      value: formatCurrency(remainingBalance),
      icon: PiggyBank,
      sub: totalCredits > 0 ? `${formatCurrency(totalCredits)} credited` : "Disposable balance",
      tone: "emerald",
    },
    {
      title: "Financial Health",
      value: healthStatus,
      icon: Activity,
      sub: "Budget status",
      color: healthColor,
      tone: "violet",
    },
    {
      title: "Transactions",
      value: cycleTransactions.length.toString(),
      icon: Hash,
      sub: "Recorded this cycle",
      tone: "cyan",
    },
    {
      title: "Avg Daily Spend",
      value: formatCurrency(avgDailySpend),
      icon: TrendingDown,
      sub: "Current pace",
      tone: "violet",
    },
    {
      title: "Budget Used",
      value: `${spentPercentage.toFixed(0)}%`,
      icon: Gauge,
      sub: "Of disposable budget",
      tone: "emerald",
    },
    {
      title: "Until Salary",
      value: `${daysLeft} Days`,
      icon: CalendarClock,
      sub: "Next salary cycle",
      tone: "rose",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-8">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="surface-card surface-card-hover p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">
                {card.title}
              </p>

              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                card.tone === 'cyan' ? 'bg-cyan-500/10 text-cyan-300' :
                card.tone === 'rose' ? 'bg-rose-500/10 text-rose-300' :
                card.tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' :
                'bg-violet-500/10 text-violet-300'
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <h2
              className={`text-base font-bold tracking-tight text-white ${
                card.color || ""
              }`}
            >
              {card.value}
            </h2>

            <p className="mt-1 truncate text-[10px] text-slate-500">
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}
