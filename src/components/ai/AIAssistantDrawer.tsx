import { useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import {
  X,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useExpenseStore } from "@/store/expenseStore";

import { analyzeExpenses } from "@/services/aiServices";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AIAssistantDrawer({
  open,
  onClose,
}: Props) {
  const { expenses } = useExpenseStore();
const { categories } = useCategoryStore();
  const [loading, setLoading] = useState(false);

  const [analysis, setAnalysis] = useState<any>(null);

  const [categoryData, setCategoryData] =
    useState<any[]>([]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);

      const currentMonth = new Date().getMonth();

      const currentYear = new Date().getFullYear();

      const currentMonthExpenses = expenses.filter(
        (expense) => {
          const expenseDate = new Date(expense.date);

          return (
            expenseDate.getMonth() === currentMonth &&
            expenseDate.getFullYear() === currentYear
          );
        }
      );

     const formattedExpenses =
  currentMonthExpenses.map((expense) => {

    const matchedCategory =
      categories.find(
        (cat) => cat.id === expense.categoryId
      );

    return {
      category:
        matchedCategory?.name || "Other",

      icon:
        matchedCategory?.icon || "💰",

      amount: expense.amount,
    };
  });

      const totalSpent =
        currentMonthExpenses.reduce(
          (sum, expense) =>
            sum + expense.amount,
          0
        );

      const groupedExpenses: Record<
        string,
        number
      > = {};

      currentMonthExpenses.forEach(
        (expense) => {
         const matchedCategory =
  categories.find(
    (cat) => cat.id === expense.categoryId
  );

const category =
  matchedCategory?.name || "Other";

          groupedExpenses[category] =
            (groupedExpenses[category] || 0) +
            expense.amount;
        }
      );

      const categoryAnalysis = Object.entries(
        groupedExpenses
      )
        .map(([category, amount]) => {
          const percentage =
            (amount / totalSpent) * 100;

          let status = "healthy";

          if (
            percentage > 40 &&
            !["emi", "sip", "rd"].includes(
              category.toLowerCase()
            )
          ) {
            status = "overspending";
          } else if (percentage > 25) {
            status = "moderate";
          }

          return {
            category,
            amount,
            percentage,
            status,
          };
        })
        .sort(
          (a, b) => b.amount - a.amount
        );

      const data = await analyzeExpenses(
        formattedExpenses
      );

      setAnalysis(data);

      setCategoryData(categoryAnalysis);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-end
        justify-end
        bg-black/50
        backdrop-blur-sm
      "
    >
      <div
        className="
          h-full
          w-full
          max-w-md
          overflow-y-auto
          border-l
          border-white/10
          bg-[#020617]
          p-5
          shadow-2xl
        "
      >
        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Sparkles className="h-5 w-5 text-cyan-400" />

              <h2 className="text-lg font-bold text-white">
                AI Copilot
              </h2>

            </div>

            <p className="mt-1 text-sm text-zinc-400">
              Smart financial insights
            </p>

          </div>

          <button
            onClick={onClose}
            className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              p-2
              text-zinc-400
            "
          >
            <X className="h-4 w-4" />
          </button>

        </div>

        {/* Analyze Button */}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="
            mt-6
            w-full
            rounded-2xl
            bg-gradient-to-r
            from-cyan-500
            to-blue-500
            px-4
            py-3
            font-semibold
            text-white
            transition-all
            duration-300
            hover:scale-[1.02]
          "
        >
          {loading
            ? "Analyzing..."
            : "Analyze My Spending"}
        </button>

        {/* Insights */}

        {analysis && (
          <div className="mt-6 space-y-4">

            {/* Total Spent */}

            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/5
                p-4
              "
            >
              <p className="text-sm text-zinc-400">
                Total Spent This Cycle
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                ₹{categoryData
                  .reduce(
                    (sum, item) =>
                      sum + item.amount,
                    0
                  )
                  .toLocaleString()}
              </h2>

            </div>

            {/* Category Distribution */}

            <div className="space-y-3">

              {categoryData.map((item) => {

                const badge =
                  item.status ===
                  "overspending"
                    ? "bg-red-500/20 text-red-300"
                    : item.status ===
                      "moderate"
                    ? "bg-orange-500/20 text-orange-300"
                    : "bg-emerald-500/20 text-emerald-300";

                const label =
                  item.status ===
                  "overspending"
                    ? "Overspending"
                    : item.status ===
                      "moderate"
                    ? "Moderate"
                    : "Healthy";

                return (
                  <div
                    key={item.category}
                    className="
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/5
                      p-4
                    "
                  >
                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-medium text-white capitalize">
                          {item.category}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          ₹{item.amount.toLocaleString()} •{" "}
                          {item.percentage.toFixed(
                            0
                          )}
                          %
                        </p>

                      </div>

                      <div
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-medium
                          ${badge}
                        `}
                      >
                        {label}
                      </div>

                    </div>
                  </div>
                );
              })}

            </div>

            {/* Financial Health */}

            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/5
                p-4
              "
            >
              <div className="flex items-center gap-2">

                <Wallet className="h-4 w-4 text-cyan-400" />

                <p className="text-sm font-medium text-white">
                  Financial Health
                </p>

              </div>

              <div className="mt-4 flex items-center gap-3">

                <div
                  className="
                    rounded-full
                    bg-orange-500/20
                    px-3
                    py-1
                    text-xs
                    font-medium
                    text-orange-300
                  "
                >
                  Warning
                </div>

                <p className="text-sm text-zinc-400">
                  Spending pace is moderate
                </p>

              </div>
            </div>

            {/* AI Recommendation */}

            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-gradient-to-r
                from-cyan-500/10
                to-blue-500/10
                p-4
              "
            >
              <div className="flex items-center gap-2">

                <TrendingUp className="h-4 w-4 text-cyan-400" />

                <p className="text-sm font-semibold text-white">
                  AI Recommendation
                </p>

              </div>

            <div className="mt-4 space-y-3">

  {[
    "Entertainment spending is higher than usual.",
    "Reduce unnecessary subscriptions this cycle.",
    "Your spending is still within manageable limits.",
    "Focus on improving discretionary spending.",
  ].map((tip, index) => (

    <div
      key={index}
      className="
        flex
        items-start
        gap-3
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-3
      "
    >

      <div
        className="
          mt-1
          h-2
          w-2
          rounded-full
          bg-cyan-400
        "
      />

      <p className="text-sm leading-relaxed text-zinc-300">
        {tip}
      </p>

    </div>
  ))}

</div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}