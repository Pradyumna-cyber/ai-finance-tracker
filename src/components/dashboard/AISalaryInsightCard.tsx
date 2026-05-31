import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { buildSalaryInsightInput, getSalaryInsightCacheKey } from '@/ai/services/buildSalaryInsightInput';
import { generateSalaryInsight } from '@/ai/services/salaryInsightService';
import { SalaryInsightOutput } from '@/ai/schemas/salaryInsightSchema';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';

const RISK_STYLES: Record<SalaryInsightOutput['riskLevel'], string> = {
  low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
  medium: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  high: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
};

const RISK_ICONS: Record<SalaryInsightOutput['riskLevel'], JSX.Element> = {
  low: <TrendingUp size={18} className="text-emerald-300" />,
  medium: <AlertTriangle size={18} className="text-amber-300" />,
  high: <AlertTriangle size={18} className="text-rose-300" />,
};

export default function AISalaryInsightCard() {
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { monthlySalary, salaryCreditType, fixedCreditDate } = useBudgetStore();
  const [insight, setInsight] = useState<SalaryInsightOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  const input = useMemo(
    () => buildSalaryInsightInput(),
    [
      categories,
      expenses,
      fixedCreditDate,
      monthlySalary,
      refreshCount,
      salaryCreditType,
    ]
  );
  const cacheKey = getSalaryInsightCacheKey(input);

  useEffect(() => {
    let isMounted = true;

    const loadInsight = async () => {
      setIsLoading(true);
      setError('');

      try {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          setInsight(JSON.parse(cached) as SalaryInsightOutput);
          setIsLoading(false);
          return;
        }

        const nextInsight = await generateSalaryInsight(input);
        window.localStorage.setItem(cacheKey, JSON.stringify(nextInsight));

        if (isMounted) {
          setInsight(nextInsight);
        }
      } catch {
        if (isMounted) {
          setError('AI insight is unavailable right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInsight();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, input]);

  const handleRefresh = () => {
    window.localStorage.removeItem(cacheKey);
    setRefreshCount((count) => count + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mx-4 rounded-2xl border border-dark-700/80 bg-gradient-to-br from-dark-800 to-dark-900 p-4 shadow-xl"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-300">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-dark-500">
              AI Copilot
            </p>
            <h3 className="text-sm font-bold text-white">Salary Cycle Insight</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-xl border border-dark-700 bg-dark-950 p-2 text-dark-300 transition hover:bg-dark-800"
          title="Refresh AI insight"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-dark-700 bg-dark-950/60 p-3 text-sm text-dark-300">
          Analyzing your salary cycle...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-dark-700 bg-dark-950/60 p-3 text-sm text-dark-300">
          {error}
        </div>
      )}

      {!isLoading && insight && (
        <div className={`rounded-xl border p-3 ${RISK_STYLES[insight.riskLevel]}`}>
          <div className="mb-2 flex items-center gap-2">
            {RISK_ICONS[insight.riskLevel]}
            <h4 className="text-sm font-extrabold text-white">{insight.headline}</h4>
          </div>
          <p className="text-sm leading-6">{insight.message}</p>
          <p className="mt-3 text-xs font-semibold text-white">{insight.recommendedAction}</p>
          <p className="mt-2 text-xs opacity-80">{insight.predictedSavingsText}</p>
        </div>
      )}
    </motion.div>
  );
}
