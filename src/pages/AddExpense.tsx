import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { formatDateShort, generateId } from '@/utils/formatters';
import { useBudgetStore } from '@/store/budgetStore';
import { getSalaryCycleForDate } from '@/utils/salaryCycle';
import CategorySelector from '@/components/forms/CategorySelector';
import AmountInput from '@/components/forms/AmountInput';

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const applyCurrentTime = (date: Date) => {
  const now = new Date();
  const dateWithTime = new Date(date);
  dateWithTime.setHours(
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
  return dateWithTime;
};

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense } = useExpenseStore();
  const { categories, initializeDefaultCategories } = useCategoryStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeDefaultCategories();
  }, [initializeDefaultCategories]);

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const selectedCycle = getSalaryCycleForDate(
    parseDateInput(date),
    salaryCreditType,
    fixedCreditDate
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !selectedCategory) {
      alert('Please enter an amount and select a category');
      return;
    }

    setIsLoading(true);

    const expenseDate = applyCurrentTime(parseDateInput(date));

    const expense = {
      id: generateId(),
      amount: parsedAmount,
      categoryId: selectedCategory,
      note,
      date: expenseDate,
      createdAt: new Date(),
    };

    addExpense(expense);

    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 w-full max-w-full overflow-x-hidden bg-dark-950 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex w-full min-w-0 items-center justify-between px-4 pt-6 pb-4 border-b border-dark-800">
        <h1 className="text-2xl font-bold text-white">Add Expense</h1>
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <X size={24} className="text-dark-400" />
        </button>
      </div>

      {/* Form */}
      <form id="expense-form" onSubmit={handleSubmit} className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6">
        {/* Amount Input */}
        <div>
          <label className="text-sm font-medium text-dark-300 block mb-3">
            Amount
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

        {/* Date Input */}
        <div>
          <label className="text-sm font-medium text-dark-300 block mb-3">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors"
            max={new Date().toISOString().split('T')[0]}
          />
          <p className="mt-2 text-xs text-dark-500">
            Salary cycle: {formatDateShort(selectedCycle.startDate)} to {formatDateShort(selectedCycle.endDate)}
          </p>
        </div>

        {/* Note Input */}
        <div>
          <label className="text-sm font-medium text-dark-300 block mb-3">
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors resize-none"
            rows={3}
          />
        </div>
      </form>

      {/* Submit Button */}
      <div className="sticky bottom-0 px-4 py-4 bg-dark-900 border-t border-dark-800">
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          form="expense-form"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-dark-600 disabled:to-dark-700 text-white font-semibold rounded-xl transition-all"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Check size={20} />
              Save Expense
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
