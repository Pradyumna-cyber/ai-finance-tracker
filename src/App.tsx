import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import AddExpense from '@/pages/AddExpense';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Categories from '@/pages/Categories';
import Transactions from '@/pages/Transactions';
import AskAIPage from '@/pages/AskAIPage';
import Onboarding from '@/pages/Onboarding';
import SalaryReviewModal from '@/components/dashboard/SalaryReviewModal';
import LoadingSplash from '@/components/LoadingSplash';

function App() {
  const { isOnboarded } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, app will work without PWA
      });
    }

    // Keep the brand transition short while the persisted app state hydrates.
    const timer = window.setTimeout(() => setIsLoading(false), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSplash />;
  }

  if (!isOnboarded()) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/add"
            element={
              <MainLayout>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AddExpense />
                </motion.div>
              </MainLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <MainLayout>
                <Reports />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            }
          />
          <Route
            path="/categories"
            element={
              <MainLayout>
                <Categories />
              </MainLayout>
            }
          />
          <Route
            path="/transactions"
            element={
              <MainLayout>
                <Transactions />
              </MainLayout>
            }
          />
          <Route
            path="/ask-ai"
            element={
              <AskAIPage />
            }
          />
        </Routes>
      </AnimatePresence>
      <SalaryReviewModal />
    </BrowserRouter>
  );
}

export default App;
