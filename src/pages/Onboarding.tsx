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
import BrandMark from '@/components/layout/BrandMark';

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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#030814]"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(124,58,237,0.12),transparent_28%)]" />
      <div className="relative min-h-screen px-4 py-8">
        <div className="mx-auto mb-10 max-w-5xl"><BrandMark /></div>
        <div className="mx-auto flex max-w-5xl items-center justify-center">
        {/* Step 1: Profile Information */}
        {step === 1 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="w-full max-w-xl"
          >
            {/* Header */}
            <motion.div variants={item} className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-4xl shadow-[0_0_50px_rgba(14,165,233,0.18)]">✨</div>
              <p className="eyebrow mb-2">Your money, finally clear</p>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Meet your financial copilot
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Understand every spend, protect your salary, and make calmer money decisions.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={item}
              onSubmit={handleNameSubmit}
              className="surface-card mb-6 space-y-4 p-5 sm:p-7"
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
                className="primary-button mt-6 w-full"
              >
                Get Started
                <ArrowRight size={20} />
              </motion.button>
            </motion.form>

            {/* Info Section */}
            <motion.div
              variants={item}
              className="soft-panel p-4 text-center"
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
            className="w-full max-w-xl"
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
              className="surface-card mb-6 space-y-6 p-5 sm:p-7"
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
                  className="primary-button w-full"
                >
                  Save Expense & Continue
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSkipExpense}
                  className="secondary-button w-full"
                >
                  Skip for Now
                </motion.button>
              </div>
            </motion.form>

            {/* Tip */}
            <motion.div
              variants={item}
              className="soft-panel border-cyan-400/15 p-4 text-center"
            >
              <p className="text-xs text-accent-300">
                💡 You can add more expenses anytime from the "Add" tab
              </p>
            </motion.div>
          </motion.div>
        )}
        </div>
      </div>
    </motion.div>
  );
}
