import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info, Receipt } from 'lucide-react';
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
      className="app-page"
    >
      <div className="page-shell max-w-xl">
      <div className="mb-6 flex w-full min-w-0 items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="secondary-button h-10 w-10 p-0"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="eyebrow">New transaction</p>
          <h1 className="page-title mt-1">Add expense</h1>
        </div>
      </div>

      <form id="expense-form" onSubmit={handleSubmit} className="surface-card space-y-6 p-5 sm:p-7">
        {/* Amount Input */}
        <div>
          <label className="field-label">
            Amount
          </label>
          <AmountInput value={amount} onChange={setAmount} />
        </div>

        {/* Category Selector */}
        <div>
          <label className="field-label">
            Category
          </label>
          <CategorySelector
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Date Input */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
          <label className="field-label">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field-control"
            max={new Date().toISOString().split('T')[0]}
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Info size={12} className="text-cyan-400" />
            Salary cycle: {formatDateShort(selectedCycle.startDate)} to {formatDateShort(selectedCycle.endDate)}
          </p>
          </div>

        {/* Note Input */}
          <div>
          <label className="field-label">
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was this spend for?"
            className="field-control resize-none"
            rows={3}
          />
          </div>
        </div>

        <div className="soft-panel flex items-start gap-3 p-3 text-xs leading-5 text-slate-500">
          <Receipt size={16} className="mt-0.5 shrink-0 text-violet-300" />
          Your note appears in reports and exported statements, so future-you knows exactly what the spend was for.
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          form="expense-form"
          disabled={isLoading}
          className="primary-button w-full"
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
      </form>
      </div>
    </motion.div>
  );
}
