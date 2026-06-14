import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

  const data = Object.values(
    categoryExpenses.reduce<Record<string, {
      id: string;
      name: string;
      value: number;
      icon: string;
    }>>((categories, cat) => {
      const existingCategory = categories[cat.categoryId];

      categories[cat.categoryId] = {
        id: cat.categoryId,
        name: cat.categoryName,
        value: (existingCategory?.value ?? 0) + cat.total,
        icon: cat.categoryIcon,
      };

      return categories;
    }, {})
  );
  const totalSpent = data.reduce((sum, category) => sum + category.value, 0);

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
      className="surface-card p-4"
    >
      <div className="mb-3">
        <p className="eyebrow">Current cycle</p>
        <h3 className="section-title mt-1">Spending by category</h3>
      </div>
      <div className="grid min-h-[250px] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(140px,170px)]">
        <div className="min-w-0">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                label={({ icon }) => icon}
                labelLine={false}
              >
                {data.map((category, index) => (
                  <Cell
                    key={category.id}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="15" fontWeight="700">
                {formatCurrency(totalSpent)}
              </text>
              <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="9">
                Total spent
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          className="grid max-h-[230px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-1"
          aria-label="Spending categories"
        >
          {data.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden="true"
              />
              <span aria-hidden="true">{category.icon}</span>
              <span className="truncate text-xs font-medium text-slate-300">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
