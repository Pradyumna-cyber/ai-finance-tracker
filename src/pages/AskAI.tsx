import { useEffect, useRef, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import {
  X,
  Sparkles,
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

const FINANCE_KEYWORDS = [
  "salary",
  "budget",
  "expense",
  "spend",
  "spending",
  "income",
  "savings",
  "balance",
  "bill",
  "bills",
  "emi",
  "investment",
  "category",
  "transaction",
  "report",
  "analytics",
  "credit",
  "debit",
  "pay",
  "paid",
  "rent",
  "shopping",
  "groceries",
];

const isFinanceQuestion = (question: string) => {
  const normalized = question.toLowerCase();
  return FINANCE_KEYWORDS.some((keyword) => new RegExp(`\\b${keyword}\\b`).test(normalized));
};

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

export default function AskAI({
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
  const [chatMessages, setChatMessages] = useState<
    ChatMessage[]
  >([]);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatRequestIdRef = useRef(0);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, loading]);

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
You are an AI finance copilot for a personal expense tracker. Answer in a practical, concise way using the user's actual data. If giving investment guidance, keep it general and educational, not financial advice.
If the question is outside personal finance, outside the user's current salary or spending context, or cannot be answered from the provided financial data, reply exactly: "I do not know about that. This assistant only answers questions about your personal finance records and current account details."
Do not speculate, do not invent answers, and do not answer unrelated questions.

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

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    if (!isFinanceQuestion(cleanQuestion)) {
      setChatMessages([
        userMessage,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content:
            "I do not know about that. This assistant only answers questions about your personal finance records and current account details.",
        },
      ]);
      setChatLoading(false);
      return;
    }

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
      setChatLoading(false);
      setShowAllQuestions(false);

      const userMessage: ChatMessage = {
        id: `${Date.now()}-user-analyze`,
        role: "user",
        content:
          "Analyze my current spending and tell me what I should focus on.",
      };

      setChatMessages((prev) => [...prev, userMessage]);

      const { currentCycle, expensesToAnalyze } =
        getExpensesToAnalyze();

      if (!expensesToAnalyze.length) {
        const assistantResponse =
          "No expenses found. Add an expense first, then ask me to analyze your spending.";
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-analyze`,
            role: "assistant",
            content: assistantResponse,
          },
        ]);
        setAnalysis({
          success: false,
          analysis: assistantResponse,
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
            category: matchedCategory?.name || "Other",
            icon: matchedCategory?.icon || "💰",
            amount: expense.amount,
            date: expense.date,
            note: expense.note || expense.description,
          };
        });

      const totalSpent =
        expensesToAnalyze.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );

      const groupedExpenses: Record<string, number> = {};

      expensesToAnalyze.forEach((expense) => {
        const matchedCategory =
          categories.find((cat) => cat.id === expense.categoryId);
        const category = matchedCategory?.name || "Other";
        groupedExpenses[category] =
          (groupedExpenses[category] || 0) + expense.amount;
      });

      const categoryAnalysis = Object.entries(groupedExpenses)
        .map(([category, amount]) => {
          const percentage = (amount / totalSpent) * 100;
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
        .sort((a, b) => b.amount - a.amount);

      const data = await analyzeExpenses(formattedExpenses);
      const spendingHealth = getSpendingHealth(
        totalSpent,
        monthlySalary,
        categoryAnalysis
      );
      const recommendations = getPersonalizedRecommendations(
        totalSpent,
        monthlySalary,
        categoryAnalysis,
        Math.max(
          0,
          getCalendarDayDiff(
            new Date(),
            currentCycle.nextSalaryDate
          )
        )
      );

      const assistantResponseParts = [
        data.analysis?.trim() ||
          "I reviewed your current spending.",
        `Spending phase: ${spendingHealth.label}. ${spendingHealth.message}`,
      ];

      if (recommendations.length) {
        assistantResponseParts.push(
          `Recommendations:`
        );
        recommendations.forEach((tip, index) => {
          assistantResponseParts.push(
            `${index + 1}. ${tip}`
          );
        });
      }

      const assistantResponse = assistantResponseParts.join(
        "\n"
      );

      setAnalysis({
        ...data,
        spendingHealth,
      });
      setCategoryData(categoryAnalysis);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-analyze`,
          role: "assistant",
          content: assistantResponse,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to analyze spending right now.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const visibleQuestions = showAllQuestions
    ? QUICK_QUESTIONS
    : QUICK_QUESTIONS.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-slate-800/80 bg-slate-950/98 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">
                AI Finance Chat
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              One place for spending insights, salary guidance, budget questions, and finance chat.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-2 text-slate-400 transition hover:border-slate-700 hover:text-white"
            aria-label="Close AI chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing…" : "Analyze my spending"}
          </button>

          <div className="flex flex-wrap gap-2">
            {visibleQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleAskQuestion(question)}
                disabled={chatLoading}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:opacity-60"
              >
                {question}
              </button>
            ))}
            {!showAllQuestions && (
              <button
                type="button"
                onClick={() => setShowAllQuestions(true)}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-800"
              >
                More
              </button>
            )}
          </div>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950"
        >
          {chatMessages.length === 0 && !loading ? (
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 text-slate-400">
              <p className="text-sm font-medium text-slate-100">
                Start a conversation about your finances or analyze your spending.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Ask questions like "How much did I spend this month?" or click Analyze my spending.
              </p>
            </div>
          ) : null}

          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "assistant"
                  ? "rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4 text-slate-100"
                  : "ml-auto max-w-[80%] rounded-3xl bg-cyan-500/20 p-4 text-slate-50"
              }
            >
              <p className="whitespace-pre-wrap text-sm leading-6">
                {message.content}
              </p>
            </div>
          ))}

          {chatLoading && (
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4 text-slate-400">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-full bg-slate-700" />
                  <div className="h-3 w-20 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800/80 px-6 py-4">
          <form
            className="flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleAskQuestion(chatInput);
            }}
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about salary, spending, budget, categories, or reports..."
              className="flex-1 rounded-3xl border border-slate-800/80 bg-slate-900/90 px-5 py-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/70"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="inline-flex h-14 min-w-[3.5rem] items-center justify-center rounded-3xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send question"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
