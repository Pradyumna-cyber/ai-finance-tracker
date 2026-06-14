import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CalendarDays } from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';
import { useUserStore } from '@/store/userStore';
import { useBudgetStore } from '@/store/budgetStore';
import { getSalaryCycleForDate } from '@/utils/salaryCycle';
import { formatDateShort } from '@/utils/formatters';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import ExpensePieChart from '@/components/charts/ExpensePieChart';
import ExpenseTrendChart from '@/components/charts/ExpenseTrendChart';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SalaryOverview from '@/components/dashboard/SalaryOverview';



export default function Home() {
  const { initializeDefaultCategories } = useCategoryStore();
  const { user } = useUserStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();
  const cycle = getSalaryCycleForDate(new Date(), salaryCreditType, fixedCreditDate);

  useEffect(() => {
    initializeDefaultCategories();
  }, [initializeDefaultCategories]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="app-page"
    >
      <div className="page-shell">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-lg font-semibold text-white sm:text-xl">
              {getTimeGreeting()}, {user?.name || 'Friend'} <span className="text-base">👋</span>
            </h1>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
              <CalendarDays size={13} className="text-blue-400" />
              <span>{cycle.name}</span>
              <span className="text-slate-700">•</span>
              <span>{formatDateShort(cycle.startDate)} to {formatDateShort(cycle.endDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="soft-panel hidden h-10 w-10 items-center justify-center text-slate-400 hover:text-white sm:flex" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-blue-500/25 to-violet-500/20 text-sm font-bold text-cyan-100">
              {(user?.name || 'F').charAt(0).toUpperCase()}
            </div>
          </div>
        </motion.header>

        <div className="space-y-3">
          <SummaryCards />
          <div className="grid gap-3 xl:grid-cols-[1fr_1.1fr]">
            <SalaryOverview />
            <ExpenseTrendChart />
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr]">
            <ExpensePieChart />
            <RecentTransactions />
          </div>
        </div>
      </div>
      {/* Floating AI button removed — use Ask AI page from navigation */}
    </motion.div>
  );
}
