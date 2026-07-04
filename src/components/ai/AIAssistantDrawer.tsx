import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCategoryStore } from "@/store/categoryStore";
import {
  X,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Send,
} from "lucide-react";

import { isDebitTransaction, useExpenseStore } from "@/store/expenseStore";
import { useBudgetStore } from "@/store/budgetStore";
import { useUserStore } from "@/store/userStore";

import {
  analyzeExpenses,
  askFinanceQuestion,
} from "@/services/aiServices";
import {
  getCalendarDayDiff,
  getSalaryCycleForDate,
} from "@/utils/salaryCycle";
import { formatCurrency } from "@/utils/formatters";

interface Props {
  open: boolean;
  onClose: () => void;
}

type SpendingPhase = "good" | "careful" | "bad";

interface CategoryAnalysis {
  category: string;
  amount: number;
  percentage: number;
  status: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "Am I overspending, and where?",
  "Suggest investment options based on my salary",
  "How can I cut unnecessary expenses?",
  "How many more days until my next salary?",
  "I want to buy something expensive. What is the smartest way to buy it?",
];

const getSpendingHealth = (
  totalSpent: number,
  monthlySalary: number,
  categoryData: CategoryAnalysis[]
) => {
  const ratio =
    monthlySalary > 0 ? totalSpent / monthlySalary : null;
  const topCategory = categoryData[0];
  const hasLargeFlexibleCategory = categoryData.some(
    (item) =>
      item.percentage > 40 &&
      !["emi", "sip", "rd", "rent", "bills"].includes(
        item.category.toLowerCase()
      )
  );

  let phase: SpendingPhase = "good";

  if (
    (ratio !== null && ratio >= 0.8) ||
    hasLargeFlexibleCategory
  ) {
    phase = "bad";
  } else if (
    (ratio !== null && ratio >= 0.5) ||
    topCategory?.percentage > 30
  ) {
    phase = "careful";
  }

  const styles = {
    good:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    careful:
      "border-orange-500/25 bg-orange-500/10 text-orange-200",
    bad: "border-red-500/25 bg-red-500/10 text-red-200",
  };

  const labels = {
    good: "Good Phase",
    careful: "Careful Phase",
    bad: "Bad Phase",
  };

  const messages = {
    good:
      "You are in a good spending phase. Your expenses look controlled and are within a comfortable range.",
    careful:
      topCategory
        ? `You are in a careful spending phase. ${topCategory.category} is taking ${topCategory.percentage.toFixed(
            0
          )}% of your tracked spending, so keep an eye on it.`
        : "You are in a careful spending phase. Your spending is manageable, but it needs attention.",
    bad:
      topCategory
        ? `You are in a bad spending phase right now. ${topCategory.category} is driving most of your expense load, so reduce non-essential spending this cycle.`
        : "You are in a bad spending phase right now. Your expenses are too high compared with your available budget.",
  };

  return {
    phase,
    label: labels[phase],
    message: messages[phase],
    className: styles[phase],
  };
};

const getPersonalizedRecommendations = (
  totalSpent: number,
  monthlySalary: number,
  categoryData: CategoryAnalysis[],
  daysToSalary: number
) => {
  const recommendations: string[] = [];
  const topCategory = categoryData[0];
  const flexibleCategory = categoryData.find(
    (item) =>
      !["emi", "sip", "rd", "rent", "bills", "savings", "investment"].includes(
        item.category.toLowerCase()
      )
  );
  const remaining = Math.max(0, monthlySalary - totalSpent);
  const spendingRatio =
    monthlySalary > 0 ? totalSpent / monthlySalary : null;

  if (spendingRatio !== null && spendingRatio >= 0.8) {
    recommendations.push(
      `You have used ${(spendingRatio * 100).toFixed(0)}% of your salary. Pause non-essential spending until payday.`
    );
  } else if (spendingRatio !== null && spendingRatio >= 0.5) {
    recommendations.push(
      `${formatCurrency(remaining)} remains from your salary. Keep the rest of this cycle focused on essentials.`
    );
  } else if (spendingRatio !== null) {
    recommendations.push(
      `You have kept ${(100 - spendingRatio * 100).toFixed(0)}% of your salary unspent this cycle.`
    );
  }

  if (flexibleCategory && flexibleCategory.percentage >= 25) {
    recommendations.push(
      `${flexibleCategory.category} is ${flexibleCategory.percentage.toFixed(0)}% of your spending. Set a lower limit for it next cycle.`
    );
  } else if (topCategory) {
    recommendations.push(
      `${topCategory.category} is your largest expense at ${formatCurrency(topCategory.amount)}. Review it before adding similar purchases.`
    );
  }

  if (monthlySalary > 0 && daysToSalary > 0) {
    recommendations.push(
      `A practical daily limit until salary day is ${formatCurrency(remaining / daysToSalary)}.`
    );
  }

  return recommendations.slice(0, 3);
};

export default function AIAssistantDrawer({
  open,
  onClose,
}: Props) {
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { user } = useUserStore();
  const {
    monthlySalary,
    salaryCreditType,
    fixedCreditDate,
  } = useBudgetStore();
  const [loading, setLoading] = useState(false);

  const [analysis, setAnalysis] = useState<any>(null);

  const [categoryData, setCategoryData] =
    useState<any[]>([]);
  const [showAllQuestions, setShowAllQuestions] =
    useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [chatMessages, setChatMessages] = useState<
    ChatMessage[]
  >([]);
  const chatRequestIdRef = useRef(0);

  const getExpensesToAnalyze = () => {
    const currentCycle = getSalaryCycleForDate(
      new Date(),
      salaryCreditType,
      fixedCreditDate
    );
    const debitExpenses = expenses.filter(isDebitTransaction);
    const currentCycleExpenses = debitExpenses.filter(
      (expense) =>
        expense.salaryCycleId === currentCycle.id
    );

    return {
      currentCycle,
      expensesToAnalyze:
        currentCycleExpenses.length > 0
          ? currentCycleExpenses
          : debitExpenses,
    };
  };

  const buildQuestionPrompt = (question: string) => {
    const { currentCycle, expensesToAnalyze } =
      getExpensesToAnalyze();
    const totalSpent = expensesToAnalyze.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const daysToSalary = Math.max(
      0,
      getCalendarDayDiff(
        new Date(),
        currentCycle.nextSalaryDate
      )
    );
    const categoryTotals = expensesToAnalyze.reduce<
      Record<string, number>
    >((acc, expense) => {
      const matchedCategory = categories.find(
        (cat) => cat.id === expense.categoryId
      );
      const category =
        matchedCategory?.name || "Other";
      acc[category] =
        (acc[category] || 0) + expense.amount;
      return acc;
    }, {});
    const recentExpenses = [...expensesToAnalyze]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 10)
      .map((expense) => {
        const matchedCategory = categories.find(
          (cat) => cat.id === expense.categoryId
        );
        return {
          category:
            matchedCategory?.name || "Other",
          amount: expense.amount,
          date: expense.date,
          note: expense.note || expense.description,
        };
      });

    return `
You are an AI finance copilot for a personal expense tracker. Answer in a practical, concise way using the user's actual data. If giving investment suggestions, keep them general and educational, not guaranteed financial advice.

User question:
${question}

Context:
- Monthly salary: ${formatCurrency(monthlySalary)}
- Salary cycle: ${currentCycle.name}
- Next salary date: ${currentCycle.nextSalaryDate.toLocaleDateString("en-IN")}
- Days until next salary: ${daysToSalary}
- Total spending analyzed: ${formatCurrency(totalSpent)}
- Category totals: ${JSON.stringify(categoryTotals)}
- Recent expenses: ${JSON.stringify(recentExpenses)}

For buying questions, compare options like wait and save, pay fully, split payment, EMI/credit card, and what amount is safe to spend now.

Reply in plain, human-friendly language. Keep the answer to 1-3 short sentences. Give the most useful answer first. Do not use headings, long lists, or repeat the question.
`;
  };

  const handleAskQuestion = async (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || chatLoading) return;
    const requestId = ++chatRequestIdRef.current;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: cleanQuestion,
    };

    setChatMessages([userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const data = await askFinanceQuestion(
        buildQuestionPrompt(cleanQuestion)
      );
      if (requestId !== chatRequestIdRef.current) return;

      setChatMessages([
        userMessage,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content:
            data.response ||
            "I could not generate an answer right now.",
        },
      ]);
    } catch (error) {
      if (requestId !== chatRequestIdRef.current) return;

      const message =
        error instanceof Error
          ? error.message
          : "Failed to answer your question.";
      setChatMessages([
        userMessage,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      if (requestId === chatRequestIdRef.current) {
        setChatLoading(false);
      }
    }
  };

  const handleAnalyze = async () => {
    try {
      chatRequestIdRef.current += 1;
      setLoading(true);
      setAnalysis(null);
      setCategoryData([]);
      setChatMessages([]);
      setChatInput("");
      setChatLoading(false);
      setShowAllQuestions(false);
      setIsChatExpanded(false);

      const { expensesToAnalyze } =
        getExpensesToAnalyze();

      if (!expensesToAnalyze.length) {
        setAnalysis({
          success: false,
          analysis:
            "No expenses found. Add an expense first, then run the AI analysis.",
        });
        setCategoryData([]);
        return;
      }

     const formattedExpenses =
  expensesToAnalyze.map((expense) => {

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
      date: expense.date,
      note: expense.note || expense.description,
    };
  });

      const totalSpent =
        expensesToAnalyze.reduce(
          (sum, expense) =>
            sum + expense.amount,
          0
        );

      const groupedExpenses: Record<
        string,
        number
      > = {};

      expensesToAnalyze.forEach(
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

      setAnalysis({
        ...data,
        spendingHealth: getSpendingHealth(
          totalSpent,
          monthlySalary,
          categoryAnalysis
        ),
      });

      setCategoryData(categoryAnalysis);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const visibleQuestions = showAllQuestions
    ? QUICK_QUESTIONS
    : QUICK_QUESTIONS.slice(0, 2);
  const latestAssistantMessage = [...chatMessages]
    .reverse()
    .find((message) => message.role === "assistant");
  const { currentCycle, expensesToAnalyze } =
    getExpensesToAnalyze();
  const totalSpent = expensesToAnalyze.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const daysToSalary = Math.max(
    0,
    getCalendarDayDiff(new Date(), currentCycle.nextSalaryDate)
  );
  const recommendations = getPersonalizedRecommendations(
    totalSpent,
    monthlySalary,
    categoryData,
    daysToSalary
  );

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
          flex
          h-full
          w-full
          max-w-md
          flex-col
          overflow-hidden
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

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        {loading && (
          <div className="mt-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute h-10 w-10 rounded-full border-2 border-cyan-300/20 border-t-cyan-300"
                />
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Reading your spending pattern
                </p>
                <p className="mt-1 text-xs text-cyan-100/70">
                  Checking categories, totals, and risk level...
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {[0, 1, 2].map((item) => (
                <motion.div
                  key={item}
                  animate={{ opacity: [0.35, 0.9, 0.35] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: item * 0.15,
                  }}
                  className="h-3 rounded-full bg-cyan-200/15"
                  style={{
                    width: `${92 - item * 16}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && analysis && !categoryData.length ? (
          <div
            className="
              mt-6
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-4
              text-sm
              leading-relaxed
              text-zinc-300
            "
          >
            {analysis.analysis || "No analysis available."}
          </div>
        ) : !loading && analysis && (
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
                Total Spent Analyzed
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

            <div className={`rounded-3xl border p-4 ${analysis.spendingHealth.className}`}>
              <div className="flex items-center gap-2">

                {analysis.spendingHealth.phase === "good" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}

                <p className="text-sm font-medium text-white">
                  Spending Phase
                </p>

              </div>

              <div className="mt-4 space-y-3">

                <div
                  className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"
                >
                  {analysis.spendingHealth.label}
                </div>

                <p className="text-sm text-zinc-400">
                  {analysis.spendingHealth.message}
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
                  {user?.name ? `${user.name}'s Recommendations` : "Your Recommendations"}
                </p>

              </div>

            <div className="mt-4 space-y-3">

  {recommendations.map((tip, index) => (

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

        {/* Bottom Chat */}

        <div className="mt-4 shrink-0 rounded-3xl border border-white/10 bg-[#060b18] p-4 shadow-2xl">
          <button
            type="button"
            onClick={() => setIsChatExpanded((expanded) => !expanded)}
            className="flex w-full items-center justify-between text-left"
            aria-expanded={isChatExpanded}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">
                Ask AI Copilot
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 transition-transform ${
                isChatExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isChatExpanded && (
            <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
              {visibleQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleAskQuestion(question)}
                  disabled={chatLoading}
                  className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-left text-xs leading-relaxed text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-500/20 disabled:opacity-60"
                >
                  {question}
                </button>
              ))}

              {!showAllQuestions && (
                <button
                  type="button"
                  onClick={() => setShowAllQuestions(true)}
                  className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10"
                >
                  More
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {(chatLoading || latestAssistantMessage) && (
            <div className="mb-3 mt-3 max-h-36 overflow-y-auto rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm leading-relaxed text-zinc-100">
              {chatLoading ? (
                <div className="flex items-center gap-1 py-1">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.12 }}
                      className="h-2 w-2 rounded-full bg-cyan-300"
                    />
                  ))}
                </div>
              ) : (
                latestAssistantMessage?.content
              )}
            </div>
          )}

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleAskQuestion(chatInput);
            }}
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about spending, EMI, savings..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-cyan-400/60"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:bg-white/10 disabled:text-zinc-500"
              aria-label="Send question"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
