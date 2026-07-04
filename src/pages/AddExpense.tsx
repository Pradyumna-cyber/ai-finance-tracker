import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Check, Info, Receipt, Sparkles } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useReminderStore } from '@/store/reminderStore';
import { formatDateShort, generateId } from '@/utils/formatters';
import { useBudgetStore } from '@/store/budgetStore';
import { getSalaryCycleForDate } from '@/utils/salaryCycle';
import CategorySelector from '@/components/forms/CategorySelector';
import AmountInput from '@/components/forms/AmountInput';
import type { Category, Expense, TransactionType } from '@/types';

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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !['the', 'for', 'and', 'from', 'with'].includes(token));

const formatDateForInput = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTransactionSearchText = (transaction: Expense) =>
  `${transaction.description || ''} ${transaction.note || ''}`;

const findSmartSuggestion = (
  transactions: Expense[],
  categories: Category[],
  type: TransactionType,
  description: string,
  amount: string
) => {
  const queryTokens = normalizeText(description);
  const parsedAmount = Number(amount);

  if (queryTokens.length === 0 && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
    return null;
  }

  const scoredTransactions = transactions
    .filter((transaction) => transaction.type === type)
    .map((transaction) => {
      const transactionTokens = normalizeText(getTransactionSearchText(transaction));
      const matchedTokens = queryTokens.filter((token) => transactionTokens.includes(token));
      const category = categories.find((item) => item.id === transaction.categoryId);
      const categoryTokens = normalizeText(category?.name || '');
      const categoryMatch = queryTokens.some((token) => categoryTokens.includes(token));
      const amountScore =
        Number.isFinite(parsedAmount) && parsedAmount > 0 && transaction.amount > 0
          ? Math.max(0, 1 - Math.abs(transaction.amount - parsedAmount) / Math.max(transaction.amount, parsedAmount))
          : 0;

      return {
        transaction,
        category,
        score: matchedTokens.length * 3 + (categoryMatch ? 2 : 0) + amountScore,
      };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score || new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime());

  const previousMatch = scoredTransactions[0];
  if (previousMatch) {
    return {
      categoryId: previousMatch.transaction.categoryId,
      note: previousMatch.transaction.note || previousMatch.transaction.description || '',
      source: previousMatch.transaction.description || previousMatch.transaction.note || previousMatch.category?.name || 'previous transaction',
      confidence: previousMatch.score,
    };
  }

  const categoryMatch = categories.find((category) => {
    const categoryTokens = normalizeText(category.name);
    return queryTokens.some((token) => categoryTokens.includes(token) || category.name.toLowerCase().includes(token));
  });

  if (categoryMatch) {
    return {
      categoryId: categoryMatch.id,
      note: '',
      source: categoryMatch.name,
      confidence: 1,
    };
  }

  return null;
};

export default function AddExpense() {
  const navigate = useNavigate();
  const { expenses, addExpense } = useExpenseStore();
  const { categories, initializeDefaultCategories } = useCategoryStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();
  const { completeTodayReminders } = useReminderStore();

  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('debit');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [userEditedSuggestion, setUserEditedSuggestion] = useState(false);
  const [appliedSuggestionKey, setAppliedSuggestionKey] = useState('');
  const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);

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

  const smartSuggestion = useMemo(
    () => findSmartSuggestion(expenses, categories, transactionType, description, amount),
    [amount, categories, description, expenses, transactionType]
  );

  const previousDebitSuggestions = useMemo(() => {
    if (transactionType !== 'credit') return [];

    const query = description.trim().toLowerCase();
    const suggestionEntries = expenses
      .filter((expense) => expense.type === 'debit' && (expense.description || expense.note))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((expense) => {
        const displayText = expense.note?.trim() || expense.description?.trim() || '';
        const descriptionText = expense.description?.trim() || expense.note?.trim() || '';
        const noteText = expense.note?.trim() || expense.description?.trim() || '';

        return {
          id: expense.id,
          label: displayText,
          descriptionText,
          noteText,
          categoryId: expense.categoryId,
          date: formatDateForInput(expense.date),
        };
      });

    const filtered = suggestionEntries.filter((entry) => {
      if (!query) return true;
      return entry.label.toLowerCase().includes(query);
    });

    return filtered.slice(0, 6);
  }, [description, expenses, transactionType]);

  useEffect(() => {
    if (!smartSuggestion || userEditedSuggestion) return;

    const suggestionKey = `${transactionType}:${description}:${amount}:${smartSuggestion.categoryId}:${smartSuggestion.note}`;
    if (suggestionKey === appliedSuggestionKey) return;

    setSelectedCategory(smartSuggestion.categoryId);
    if (smartSuggestion.note) {
      setNote(smartSuggestion.note);
    }
    setAppliedSuggestionKey(suggestionKey);
  }, [amount, appliedSuggestionKey, description, smartSuggestion, transactionType, userEditedSuggestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !selectedCategory) {
      alert('Please enter an amount and select a category');
      return;
    }

    setIsLoading(true);

    const expenseDate = applyCurrentTime(parseDateInput(date));

    const enteredNote = description.trim() || note.trim();

    addExpense({
      id: generateId(),
      amount: parsedAmount,
      type: transactionType,
      categoryId: selectedCategory,
      description: enteredNote,
      note: enteredNote,
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
            <h1 className="page-title mt-1">Add transaction</h1>
          </div>
        </div>

        <form id="expense-form" onSubmit={handleSubmit} className="surface-card space-y-6 p-5 sm:p-7">
          <div>
            <label className="field-label">
              Transaction type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'debit' as const, label: 'Debit', icon: ArrowDownCircle, hint: 'Money spent' },
                { id: 'credit' as const, label: 'Credit', icon: ArrowUpCircle, hint: 'Money received' },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = transactionType === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTransactionType(option.id);
                      setUserEditedSuggestion(false);
                      setAppliedSuggestionKey('');
                    }}
                    className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition ${
                      isSelected
                        ? option.id === 'credit'
                          ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'
                          : 'border-cyan-400/35 bg-cyan-500/10 text-cyan-100'
                        : 'border-white/[0.07] bg-white/[0.025] text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block truncate text-[10px] text-slate-500">{option.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="field-label">
              Amount
            </label>
            <AmountInput value={amount} onChange={setAmount} />
          </div>

          <div>
            <label className="field-label">
              Notes / Description
            </label>
            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setUserEditedSuggestion(false);
                  setShowDescriptionSuggestions(transactionType === 'credit');
                }}
                onFocus={() => setShowDescriptionSuggestions(transactionType === 'credit')}
                onBlur={() => setTimeout(() => setShowDescriptionSuggestions(false), 120)}
                placeholder={transactionType === 'credit' ? 'Pick a previous note or type a new one...' : 'Coffee, groceries, fuel...'}
                className="field-control"
              />
              {transactionType === 'credit' && showDescriptionSuggestions && previousDebitSuggestions.length > 0 && (
                <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/40">
                  {previousDebitSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setDescription(suggestion.descriptionText);
                          setNote(suggestion.noteText);
                          setSelectedCategory(suggestion.categoryId);
                          setDate(suggestion.date);
                          setUserEditedSuggestion(true);
                          setAppliedSuggestionKey('');
                          setShowDescriptionSuggestions(false);
                        }}
                        className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                      >
                        <span className="font-medium">{suggestion.label}</span>
                        <span className="text-xs text-slate-500">Uses a past debit note and fills the category and date</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Pick one of your previous notes or type a new one. If it is different, you can still choose a category manually.
            </p>
          </div>

          <div>
            <label className="field-label">
              Category
            </label>
            <CategorySelector
              selectedId={selectedCategory}
              onSelect={(categoryId) => {
                setSelectedCategory(categoryId);
                setUserEditedSuggestion(true);
              }}
            />
          </div>

          {smartSuggestion && (
            <div className="soft-panel border-emerald-400/15 bg-emerald-500/[0.06] p-3 text-xs leading-5 text-emerald-100">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Sparkles size={14} className="text-emerald-300" />
                AI suggestion from {smartSuggestion.source}
              </div>
              <p className="text-emerald-200/75">
                Category and notes were suggested from similar past transactions. You can change either before saving.
              </p>
            </div>
          )}

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

          </div>

          <div className="soft-panel flex items-start gap-3 p-3 text-xs leading-5 text-slate-500">
            <Receipt size={16} className="mt-0.5 shrink-0 text-violet-300" />
            Credits increase your available balance automatically. Expense analytics continue to show only debit spending.
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
                Save Transaction
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
