import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { useExpenseStats } from '@/hooks/useDashboard';

export default function ExpenseStats() {
  const { currentCycleTotal, percentageChange } = useExpenseStats();

  const isIncrease = percentageChange > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="px-4 grid grid-cols-2 gap-3"
    >
      {/* Current Month */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700">
       <p className="text-dark-400 text-xs font-medium mb-2">
  Current Salary Cycle
</p>
        <h3 className="text-2xl font-bold text-white mb-1">
          {formatCurrency(currentCycleTotal)}
        </h3>
<p className="text-xs text-dark-500">
  compared to previous salary cycle
</p>
      </div>

      {/* Change Indicator */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          {isIncrease ? (
            <TrendingUp size={16} className="text-red-500" />
          ) : (
            <TrendingDown size={16} className="text-green-500" />
          )}
          <p className={`text-xs font-medium ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
            {Math.abs(percentageChange).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-500">
            {isIncrease ? 'Higher' : 'Lower'} than previous cycle
          </p>
        </div>
      </div>
    </motion.div>
  );
}
