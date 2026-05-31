import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useBudgetStore } from '@/store/budgetStore';
import { generateId } from '@/utils/formatters';
import CategorySelector from '@/components/forms/CategorySelector';
import AmountInput from '@/components/forms/AmountInput';

export default function Onboarding() {
  const { completeOnboarding } = useUserStore();
  const { addExpense } = useExpenseStore();
  const { categories, initializeDefaultCategories } = useCategoryStore();
  const {
    setMonthlySalary,
    setSalaryCreditType,
    setFixedCreditDate,
    completeSalaryReview,
  } = useBudgetStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [monthlySalaryInput, setMonthlySalaryInput] = useState('');
  const [salaryCreditType, setSalaryCreditTypeInput] = useState<'fixed' | 'last_working_day'>('last_working_day');
  const [fixedCreditDateInput, setFixedCreditDateInput] = useState('1');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');

  useEffect(() => {
    initializeDefaultCategories();
  }, [initializeDefaultCategories]);

  const isStep1Valid =
    !!(name.trim() &&
    age &&
    parseInt(age) > 0 &&
    monthlySalaryInput &&
    parseFloat(monthlySalaryInput) >= 0 &&
    (salaryCreditType !== 'fixed' || (fixedCreditDateInput && parseInt(fixedCreditDateInput) >= 1 && parseInt(fixedCreditDateInput) <= 31)));

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const saveBudgetSettings = () => {
    if (monthlySalaryInput) {
      setMonthlySalary(parseFloat(monthlySalaryInput));
    }
    setSalaryCreditType(salaryCreditType);
    if (salaryCreditType === 'fixed') {
      setFixedCreditDate(parseInt(fixedCreditDateInput) || 1);
    }
    completeSalaryReview();
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    saveBudgetSettings();

    if (amount && selectedCategory) {
      // Add the initial expense
      const expense = {
        id: generateId(),
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        note: 'Initial expense',
        date: new Date(),
        createdAt: new Date(),
      };
      addExpense(expense);
    }

    // Complete onboarding
    completeOnboarding(name, parseInt(age));
  };

  const handleSkipExpense = () => {
    saveBudgetSettings();
    completeOnboarding(name, parseInt(age));
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 z-50 overflow-y-auto"
    >
      <div className="min-h-screen flex items-center justify-center px-4">
        {/* Step 1: Profile Information */}
        {step === 1 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-md"
          >
            {/* Header */}
            <motion.div variants={item} className="mb-8 text-center">
              <div className="text-6xl mb-4 inline-block">💰</div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome to Expense Copilot
              </h1>
              <p className="text-dark-400">
                Let's get you started tracking expenses smarter
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={item}
              onSubmit={handleNameSubmit}
              className="space-y-4 mb-6"
            >
              {/* Name Input */}
              <div>
                <label className="text-sm font-medium text-dark-300 block mb-2">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Age Input */}
              <div>
                <label className="text-sm font-medium text-dark-300 block mb-2">
                  How old are you?
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  min="1"
                  max="150"
                  className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors"
                />
              </div>

              {/* Salary Input */}
              <div>
                <label className="text-sm font-medium text-dark-300 block mb-2">
                  What is your salary per cycle?
                </label>
                <input
                  type="number"
                  value={monthlySalaryInput}
                  onChange={(e) => setMonthlySalaryInput(e.target.value)}
                  placeholder="Enter salary (e.g., 50000)"
                  min="0"
                  className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors"
                />
              </div>

              {/* Salary Credit Option */}
              <div>
                <label className="text-sm font-medium text-dark-300 block mb-2">
                  How is your salary usually credited?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSalaryCreditTypeInput('last_working_day')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      salaryCreditType === 'last_working_day'
                        ? 'bg-accent-500/20 border-accent-500 text-white font-semibold'
                        : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    <span className="text-lg">📅</span>
                    <span className="text-xs">Last Working Day</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalaryCreditTypeInput('fixed')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      salaryCreditType === 'fixed'
                        ? 'bg-accent-500/20 border-accent-500 text-white font-semibold'
                        : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    <span className="text-lg">📌</span>
                    <span className="text-xs">Fixed Date Every Month</span>
                  </button>
                </div>
              </div>

              {/* Fixed Credit Date Input */}
              {salaryCreditType === 'fixed' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-dark-300 block">
                    Which day of the month?
                  </label>
                  <input
                    type="number"
                    value={fixedCreditDateInput}
                    onChange={(e) => setFixedCreditDateInput(e.target.value)}
                    placeholder="Enter day (1 to 31)"
                    min="1"
                    max="31"
                    className="w-full px-4 py-3 bg-dark-800 border-2 border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors"
                  />
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!isStep1Valid}
                className="w-full flex items-center justify-center gap-2 py-3 mt-6 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-dark-600 disabled:to-dark-700 text-white font-semibold rounded-xl transition-all"
              >
                Get Started
                <ArrowRight size={20} />
              </motion.button>
            </motion.form>

            {/* Info Section */}
            <motion.div
              variants={item}
              className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-dark-500">
                ✨ Next, add your first expense to start tracking
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: First Expense */}
        {step === 2 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-md"
          >
            {/* Progress */}
            <motion.div variants={item} className="mb-6">
              <p className="text-sm text-dark-400 text-center mb-2">Step 2 of 2</p>
              <div className="w-full h-1 bg-dark-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-accent-500 to-accent-600"
                />
              </div>
            </motion.div>

            {/* Header */}
            <motion.div variants={item} className="mb-8 text-center">
              <div className="text-5xl mb-4 inline-block">
                {categories.find((c) => c.id === selectedCategory)?.icon || '💰'}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Add Your First Expense
              </h2>
              <p className="text-dark-400">
                Hi {name}! Let's track your first expense
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={item}
              onSubmit={handleExpenseSubmit}
              className="space-y-6 mb-6"
            >
              {/* Amount Input */}
              <div>
                <label className="text-sm font-medium text-dark-300 block mb-3">
                  Amount Spent
                </label>
                <AmountInput value={amount} onChange={setAmount} />
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-sm font-medium text-dark-300 block mb-3">
                  Category
                </label>
                <CategorySelector
                  selectedId={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!amount || !selectedCategory}
                  className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-dark-600 disabled:to-dark-700 text-white font-semibold rounded-xl transition-all"
                >
                  Save Expense & Continue
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSkipExpense}
                  className="w-full py-3 bg-dark-800 hover:bg-dark-700 text-dark-300 font-semibold rounded-xl transition-all border border-dark-700"
                >
                  Skip for Now
                </motion.button>
              </div>
            </motion.form>

            {/* Tip */}
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-accent-500/10 to-accent-600/5 border border-accent-500/30 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-accent-300">
                💡 You can add more expenses anytime from the "Add" tab
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
