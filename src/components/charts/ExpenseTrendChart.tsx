import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonthlyTrend } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatters';

export default function ExpenseTrendChart() {
  const trends = useMonthlyTrend(6);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-[#07111f]/95 p-3 shadow-2xl">
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
      className="surface-card p-4"
    >
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow">Last 6 cycles</p>
          <h3 className="section-title mt-1">Spending trend</h3>
        </div>
        <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-slate-500">Live</span>
      </div>
      <ResponsiveContainer width="100%" height={215}>
        <LineChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            style={{ fontSize: '10px' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '10px' }}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ fill: '#07111f', stroke: '#38bdf8', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
