import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import { formatCurrency, formatDate, formatTime } from '@/utils/formatters';
import { getCalendarDayDiff, getRecentSalaryCycles, getSalaryCycleById } from '@/utils/salaryCycle';

const COLORS = [
  '#ec4899',
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
];

export default function Reports() {
  const { getExpensesBySalaryCycle } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();

  // Get last 12 salary cycles for the selector
  const cycleOptions = getRecentSalaryCycles(salaryCreditType, fixedCreditDate, 12);
  const [selectedCycleId, setSelectedCycleId] = useState(cycleOptions[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const cycleExpenses = getExpensesBySalaryCycle(selectedCycleId);
  const totalCycle = cycleExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const selectedCycleDetails = getSalaryCycleById(selectedCycleId, salaryCreditType, fixedCreditDate);

  const cycleDays = Math.max(1, getCalendarDayDiff(selectedCycleDetails.startDate, selectedCycleDetails.nextSalaryDate));

  // Category wise data
  const categoryData = categories
    .map((cat) => {
      const expenses = cycleExpenses.filter((e) => e.categoryId === cat.id);
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        id: cat.id,
        name: cat.name,
        value: total,
        icon: cat.icon,
        color: cat.color,
        count: expenses.length,
        expenses: expenses.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    })
    .filter((cat) => cat.value > 0)
    .sort((a, b) => b.value - a.value);

  const selectedCategory = categoryData.find((cat) => cat.id === selectedCategoryId);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-2 text-xs">
          <p className="text-dark-200">{payload[0].name}</p>
          <p className="text-accent-400 font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-dark-950 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-dark-900 to-transparent px-4 pt-6 pb-4 border-b border-dark-800">
        <h1 className="text-2xl font-bold text-white mb-4">Reports</h1>
        
        {/* Cycle Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {cycleOptions.map((cycle) => {
            const cycleDateParts = cycle.id.split('-');
            const cycleMonth = new Date(parseInt(cycleDateParts[0]), parseInt(cycleDateParts[1]) - 1, 1);
            return (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycleId(cycle.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCycleId === cycle.id
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                }`}
              >
                {cycleMonth.toLocaleString('en-IN', { month: 'short', year: '2-digit' })} Cycle
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 px-4 py-4">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700 shadow-xl"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider">
                {selectedCycleDetails.name}
              </p>
              <p className="text-[10px] text-dark-500 mt-0.5">
                {selectedCycleDetails.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {selectedCycleDetails.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span className="text-[10px] text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-md border border-accent-500/20 font-bold">
              {cycleDays} Days
            </span>
          </div>
          
          <h2 className="text-3xl font-extrabold text-white mb-4">
            {formatCurrency(totalCycle)}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
              <p className="text-[10px] text-dark-500 mb-1">Transactions</p>
              <p className="text-base font-bold text-white">
                {cycleExpenses.length}
              </p>
            </div>
            <div className="bg-dark-950/60 rounded-xl p-3 border border-dark-800/40">
              <p className="text-[10px] text-dark-500 mb-1">Avg Per Day</p>
              <p className="text-base font-bold text-white">
                {formatCurrency(totalCycle / cycleDays)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        {categoryData.length > 0 ? (
          <>
            {/* Category Distribution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-white mb-4">
                By Category
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: '11px', fontWeight: '500' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '11px', fontWeight: '500' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#0ea5e9"
                    radius={[8, 8, 0, 0]}
                    cursor="pointer"
                    onClick={(data) => setSelectedCategoryId(data.id)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-white mb-4">
                Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ icon }) => icon}
                    cursor="pointer"
                    onClick={(data) => setSelectedCategoryId(data.id)}
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              {categoryData.map((cat, index) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="w-full bg-dark-800 rounded-xl p-3 border border-dark-700 flex items-center justify-between text-left shadow-md hover:border-accent-500/60 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {cat.name}
                      </p>
                      <p className="text-xs text-dark-500">
                        {cat.count} transaction{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(cat.value)}
                    </p>
                    <p className="text-xs text-dark-500">
                      {((cat.value / totalCycle) * 100).toFixed(1)}%
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        ) : (
          <div className="flex items-center justify-center py-16 text-center">
            <p className="text-dark-500 text-sm">
              No expenses tracked in this cycle yet.
            </p>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 px-0 sm:items-center sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-h-[85vh] w-full overflow-hidden rounded-t-2xl border border-dark-700 bg-dark-900 shadow-2xl sm:mx-auto sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-dark-800 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  {selectedCategory.icon} {selectedCategory.name}
                </p>
                <p className="text-xs text-dark-400">
                  {selectedCategory.count} transaction{selectedCategory.count !== 1 ? 's' : ''} in this cycle
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="rounded-lg p-2 text-dark-400 hover:bg-dark-800 hover:text-white"
                aria-label="Close transactions"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border-b border-dark-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-dark-500">
                  Total
                </span>
                <span className="text-lg font-bold text-white">
                  {formatCurrency(selectedCategory.value)}
                </span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
              <div className="space-y-2">
                {selectedCategory.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-xl border border-dark-800 bg-dark-950/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {expense.note || selectedCategory.name}
                        </p>
                        <p className="mt-1 text-xs text-dark-500">
                          {formatDate(expense.date)} at {formatTime(expense.date)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-white">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
