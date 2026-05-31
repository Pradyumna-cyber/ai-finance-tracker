import { useState } from "react";
import { analyzeExpenses } from "@/services/aiServices";
import { useExpenseStore } from "@/store/expenseStore";

export default function AIInsights() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const { expenses } = useExpenseStore();

  const handleAnalyze = async () => {
    try {
      setLoading(true);

      if (!expenses.length) {
        setAnalysis("No expenses available to analyze.");
        return;
      }

      const formattedExpenses = expenses.map((expense) => ({
        category: expense.categoryId || "Other",
        amount: expense.amount,
        date: expense.date,
      }));

      const data = await analyzeExpenses(formattedExpenses);

      if (data?.analysis) {
  setAnalysis(data.analysis);
} else {
  setAnalysis("Failed to generate AI insights.");
}
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to analyze expenses.");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="mx-4 rounded-2xl border border-gray-700 bg-[#111827] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Financial Insights
          </h2>

          <p className="text-sm text-gray-300">
            Analyze your real spending patterns
          </p>
        </div>
      </div>
<div className="text-red-500 text-2xl">
  AI INSIGHTS WORKING
</div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-xl bg-white px-4 py-2 font-medium text-black transition hover:opacity-90"
      >
        {loading ? "Analyzing..." : "Analyze My Spending"}
      </button>

      {analysis && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl bg-dark-800 p-4 text-sm text-white">
          {analysis}
        </div>
      )}
    </div>
  );
}