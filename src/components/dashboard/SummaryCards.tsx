import { Wallet, CreditCard, PiggyBank, Activity } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { useExpenseStore } from "@/store/expenseStore";

export default function SummaryCards() {
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
      title: "Current Salary",
      value: `₹${monthlySalary.toLocaleString()}`,
      icon: Wallet,
      sub: "Monthly income",
    },
    {
      title: "Total Spent",
      value: `₹${totalSpent.toLocaleString()}`,
      icon: CreditCard,
      sub: `${spentPercentage.toFixed(0)}% used`,
    },
    {
      title: "Remaining",
      value: `₹${remainingBalance.toLocaleString()}`,
      icon: PiggyBank,
      sub: "Available balance",
    },
    {
      title: "Financial Health",
      value: healthStatus,
      icon: Activity,
      sub: "Budget status",
      color: healthColor,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              backdrop-blur-xl
              p-4
              transition-all
              duration-300
              hover:border-cyan-400/20
              hover:bg-white/[0.07]
            "
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-zinc-400">
                {card.title}
              </p>

              <Icon className="h-4 w-4 text-zinc-400" />
            </div>

            <h2
              className={`text-xl font-bold tracking-tight text-white ${
                card.color || ""
              }`}
            >
              {card.value}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}