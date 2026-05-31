import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonthlyTrend } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatters';

export default function ExpenseTrendChart() {
  const trends = useMonthlyTrend(6);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className=" rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 ">
          <p className="text-dark-200">{payload[0].payload.month}</p>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="px-4 bg-gradient-to-br from-dark-800 to-dark-900 rounded-2xl p-4 border border-dark-700"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Salary Cycle Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
