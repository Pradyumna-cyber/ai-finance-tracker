import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatters';

const COLORS = [
  '#ec4899',
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
];

export default function ExpensePieChart() {
  const { categoryExpenses } = useDashboard(new Date());

  const data = categoryExpenses.map((cat) => ({
    name: cat.categoryName,
    value: cat.total,
    icon: cat.categoryIcon,
  } as const));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-500">
        <p className="text-sm">No expenses yet. Add an expense to get started!</p>
      </div>
    );
  }

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className=" rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, icon }) => `${icon}`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
            formatter={(value, entry: any) => (
              <span className="text-xs text-dark-300">
                {entry.payload.icon} {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
