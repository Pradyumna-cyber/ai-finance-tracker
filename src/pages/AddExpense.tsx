import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info, Receipt } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useReminderStore } from '@/store/reminderStore';
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
  const { completeTodayReminders } = useReminderStore();

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

    addExpense({
      id: generateId(),
      amount: parsedAmount,
      categoryId: selectedCategory,
      note,
      date: expenseDate,
      createdAt: new Date(),
    });
    completeTodayReminders();

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
          <div>
            <label className="field-label">
              Amount
            </label>
            <AmountInput value={amount} onChange={setAmount} />
          </div>

          <div>
            <label className="field-label">
              Category
            </label>
            <CategorySelector
              selectedId={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

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
            You can also tap Aira from any page and say “Hey Aira, add 450 for food in a restaurant.”
          </div>

          <motion.button
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            type="submit"
            form="expense-form"
            disabled={isLoading}
            className="primary-button w-full overflow-hidden"
          >
            {isLoading ? (
              <div className="relative flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#0f172a] text-white">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-blue-500/20 opacity-90" />
                <div className="absolute inset-0 ring-[1px] ring-cyan-400/10 blur-sm" />
                <span className="relative z-10 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  <span className="flex h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
                  Saving your money...
                </span>
              </div>
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
