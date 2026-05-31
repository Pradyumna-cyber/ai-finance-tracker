import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCategoryStore } from '@/store/categoryStore';
import { useUserStore } from '@/store/userStore';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import ExpensePieChart from '@/components/charts/ExpensePieChart';
import ExpenseTrendChart from '@/components/charts/ExpenseTrendChart';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SalaryOverview from '@/components/dashboard/SalaryOverview';
import AIInsights from '@/components/AIInsights';
import FloatingAIButton from '@/components/ai/FloatingAIButton';
import ThemeToggle from '@/components/layout/ThemeToggle';



export default function Home() {
  const { initializeDefaultCategories } = useCategoryStore();
  const { user } = useUserStore();

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
      className=" min-h-screen bg-white dark:bg-[#020617]
 relative overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-dark-900 to-transparent px-4 pt-6 pb-4 border-b border-dark-800">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_40%)]" />
          
         
<div className="flex items-center justify-between">

  <div>

    <p className="text-xs font-medium text-zinc-500 mb-1">
      {getTimeGreeting()}, {user?.name || 'Friend'}
    </p>

    <h1 className="
      text-3xl
      font-bold
      text-zinc-900

      dark:text-zinc-900 dark:text-white
    ">
      Expense Copilot
    </h1>

  </div>

  <ThemeToggle />

</div>


        </motion.div>
      </div>

      {/* Content */}
     <div className="space-y-4 px-4 py-4 pb-24"> 
      <SummaryCards /> 
      
      <SalaryOverview /> 
      
      <div className="grid gap-4 lg:grid-cols-2">
         <ExpenseTrendChart /> 
         <ExpensePieChart />
          </div> 
          <RecentTransactions /> 
          </div>
          <FloatingAIButton />
    </motion.div>
  );
}
