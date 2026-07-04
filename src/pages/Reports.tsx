import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Download, Receipt, Wallet, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getTransactionSignedAmount, isDebitTransaction, useExpenseStore } from '@/store/expenseStore';
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

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string, endOfDay = false) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
};

const escapeCsvValue = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

export default function Reports() {
  const { expenses, getExpensesBySalaryCycle } = useExpenseStore();
  const { categories } = useCategoryStore();
  const { monthlySalary, salaryCreditType, fixedCreditDate } = useBudgetStore();

  // Get last 12 salary cycles for the selector
  const cycleOptions = getRecentSalaryCycles(salaryCreditType, fixedCreditDate, 12);
  const [selectedCycleId, setSelectedCycleId] = useState(cycleOptions[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedCycleDetails = getSalaryCycleById(selectedCycleId, salaryCreditType, fixedCreditDate);
  const [statementStartDate, setStatementStartDate] = useState(
    formatDateInput(selectedCycleDetails.startDate)
  );
  const [statementEndDate, setStatementEndDate] = useState(
    formatDateInput(selectedCycleDetails.endDate)
  );

  const cycleTransactions = getExpensesBySalaryCycle(selectedCycleId);
  const cycleExpenses = cycleTransactions.filter(isDebitTransaction);
  const totalCycle = cycleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const cycleCreditTotal = cycleTransactions
    .filter((transaction) => !isDebitTransaction(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const netCycle = cycleTransactions.reduce(
    (sum, transaction) => sum + getTransactionSignedAmount(transaction),
    0
  );

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

  const exportStatement = () => {
    if (!statementStartDate || !statementEndDate) {
      alert('Please select both statement dates.');
      return;
    }

    const startDate = parseDateInput(statementStartDate);
    const endDate = parseDateInput(statementEndDate, true);

    if (startDate > endDate) {
      alert('The statement start date must be before the end date.');
      return;
    }

    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const statementTransactions = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const statementTotalSpent = statementTransactions
      .filter(isDebitTransaction)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const statementTotalCredits = statementTransactions
      .filter((expense) => !isDebitTransaction(expense))
      .reduce((sum, expense) => sum + expense.amount, 0);
    const statementNetCashFlow = statementTransactions.reduce(
      (sum, expense) => sum + getTransactionSignedAmount(expense),
      0
    );

    const rows = [
      ['Transaction Statement'],
      ['Statement Period', `${formatDate(startDate)} to ${formatDate(endDate)}`],
      ['Monthly Salary', monthlySalary],
      ['Statement Total Spent', statementTotalSpent],
      ['Statement Total Credits', statementTotalCredits],
      ['Net Cash Flow', statementNetCashFlow],
      [],
      ['Date', 'Type', 'Category', 'Note', 'Amount'],
      ...statementTransactions.map((expense) => [
        formatDate(expense.date),
        isDebitTransaction(expense) ? 'Debit' : 'Credit',
        categoryMap.get(expense.categoryId)?.name || 'Unknown',
        expense.note || expense.description || '',
        getTransactionSignedAmount(expense),
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
      .join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `transaction-statement-${statementStartDate}-to-${statementEndDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  };

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
      className="app-page"
    >
      <div className="page-shell">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Financial analytics</p>
          <h1 className="page-title mt-1">Reports</h1>
        </div>
        
        <div className="flex max-w-full gap-2 overflow-x-auto pb-2 scrollbar-none">
          {cycleOptions.map((cycle) => {
            const cycleDateParts = cycle.id.split('-');
            const cycleMonth = new Date(parseInt(cycleDateParts[0]), parseInt(cycleDateParts[1]) - 1, 1);
            return (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycleId(cycle.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCycleId === cycle.id
                    ? 'border border-cyan-400/25 bg-cyan-500/10 text-cyan-200'
                    : 'border border-white/[0.07] bg-white/[0.025] text-slate-500 hover:bg-white/[0.05]'
                }`}
              >
                {cycleMonth.toLocaleString('en-IN', { month: 'short', year: '2-digit' })} Cycle
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card relative overflow-hidden p-4"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="eyebrow">
                {selectedCycleDetails.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedCycleDetails.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {selectedCycleDetails.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <span className="rounded-lg border border-cyan-400/15 bg-cyan-500/[0.07] px-2.5 py-1 text-[10px] font-bold text-cyan-300">
              {cycleDays} Days
            </span>
          </div>
          
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {formatCurrency(totalCycle)}
          </h2>
          <p className="mb-3 mt-1 text-xs text-slate-500">
            {formatCurrency(cycleCreditTotal)} credited · {formatCurrency(netCycle)} net cash flow
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="soft-panel p-3">
              <Receipt size={15} className="mb-2 text-violet-300" />
              <p className="text-[10px] text-slate-500 mb-1">Transactions</p>
              <p className="text-base font-bold text-white">
                {cycleTransactions.length}
              </p>
            </div>
            <div className="soft-panel p-3">
              <Wallet size={15} className="mb-2 text-emerald-300" />
              <p className="text-[10px] text-slate-500 mb-1">Avg Per Day</p>
              <p className="text-base font-bold text-white">
                {formatCurrency(totalCycle / cycleDays)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statement Export */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="surface-card p-4"
        >
          <div className="mb-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><CalendarRange size={18} /></div>
            <h2 className="section-title">Export statement</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Download salary, spending, credits, and transaction details for any date range.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field-label">
              From
              <input
                type="date"
                value={statementStartDate}
                onChange={(event) => setStatementStartDate(event.target.value)}
                className="field-control mt-1.5"
              />
            </label>
            <label className="field-label">
              To
              <input
                type="date"
                value={statementEndDate}
                onChange={(event) => setStatementEndDate(event.target.value)}
                className="field-control mt-1.5"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={exportStatement}
            className="primary-button mt-4 w-full"
          >
            <Download size={18} />
            Download Statement
          </button>
        </motion.div>
        </div>

        {/* Charts */}
        {categoryData.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {/* Category Distribution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="surface-card p-4"
            >
              <h3 className="section-title mb-4">
                By Category
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
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
              className="surface-card p-4"
            >
              <h3 className="section-title mb-4">
                Distribution
              </h3>
              <div className="grid items-center gap-2 sm:grid-cols-[1fr_150px]">
              <ResponsiveContainer width="100%" height={260}>
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
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="15" fontWeight="700">
                    {formatCurrency(totalCycle)}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="9">
                    Total spent
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                {categoryData.slice(0, 7).map((cat, index) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-slate-400 hover:bg-white/[0.04]"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate">{cat.icon} {cat.name}</span>
                  </button>
                ))}
              </div>
              </div>
            </motion.div>

            {/* Category Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="surface-card space-y-1 p-4 xl:col-span-2"
            >
              <div className="mb-4">
                <p className="eyebrow">Breakdown</p>
                <h3 className="section-title mt-1">Category spending</h3>
              </div>
              <div className="hidden grid-cols-[1fr_120px_140px_100px] gap-3 border-b border-white/[0.06] px-3 pb-2 text-[9px] font-bold uppercase tracking-wider text-slate-600 sm:grid">
                <span>Category</span><span>Transactions</span><span>Total spent</span><span>% of total</span>
              </div>
              {categoryData.map((cat, index) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.018] p-3 text-left transition hover:border-blue-400/15 hover:bg-white/[0.04] active:scale-[0.99] sm:grid-cols-[1fr_120px_140px_100px]"
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
                  <p className="hidden text-xs text-slate-500 sm:block">{cat.count}</p>
                  <div className="text-right sm:text-left">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(cat.value)}
                    </p>
                    <p className="text-xs text-dark-500 sm:hidden">
                      {((cat.value / totalCycle) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="hidden text-xs font-semibold text-slate-400 sm:block">{((cat.value / totalCycle) * 100).toFixed(1)}%</p>
                </button>
              ))}
            </motion.div>
          </div>
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
            className="max-h-[85vh] w-full overflow-hidden rounded-t-xl border border-[#2a3b52] bg-[#0b1727] shadow-2xl sm:mx-auto sm:max-w-md sm:rounded-xl"
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
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-dark-500">
                          Note
                        </p>
                        <p className="mt-0.5 break-words text-sm font-medium text-white">
                          {expense.note || expense.description || 'No note added'}
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
      </div>
    </motion.div>
  );
}
