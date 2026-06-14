import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Info, Receipt, Mic, MicOff } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useReminderStore } from '@/store/reminderStore';
import type { Category } from '@/types';
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

const parseVoiceExpense = (text: string, categories: Category[]) => {
  const normalized = text.toLowerCase();
  const amountMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? amountMatch[1] : '';

  const matchedCategory = categories.find((cat) =>
    normalized.includes(cat.name.toLowerCase())
  );

  let note = normalized;
  if (amountMatch) {
    note = note.replace(amountMatch[0], '');
  }
  if (matchedCategory) {
    note = note.replace(matchedCategory.name.toLowerCase(), '');
  }

  note = note
    .replace(/\b(spent|for|on|with|buy|bought|purchase|purchased|and|a|an|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    amount,
    categoryId: matchedCategory?.id,
    note,
    transcript: text,
  };
};

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense } = useExpenseStore();
  const { categories, initializeDefaultCategories } = useCategoryStore();
  const { salaryCreditType, fixedCreditDate } = useBudgetStore();
  const { completeTodayReminders } = useReminderStore();

  const recognitionRef = useRef<any>(null);
  const [supportsVoice, setSupportsVoice] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
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

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceError(null);
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const result = Array.from(event.results)
        .map((res: any) => res[0]?.transcript)
        .join(' ')
        .trim();

      const parsed = parseVoiceExpense(result, categories);
      setTranscript(parsed.transcript);
      if (parsed.amount) setAmount(parsed.amount);
      if (parsed.categoryId) setSelectedCategory(parsed.categoryId);
      if (parsed.note) setNote(parsed.note);
      setDate(new Date().toISOString().split('T')[0]);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setVoiceError(event.error || 'Voice recognition failed. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSupportsVoice(true);

    return () => {
      recognition.stop?.();
      recognitionRef.current = null;
    };
  }, [categories]);

  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Voice input is not supported in this browser.');
      setSupportsVoice(false);
      return;
    }

    try {
      recognitionRef.current?.start();
      setVoiceError(null);
      setSupportsVoice(true);
    } catch (error) {
      setVoiceError('Unable to start voice input. Try refreshing your browser.');
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  };

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

        <div className="soft-panel space-y-4 p-4 text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Voice Assistant</p>
              <p className="mt-1 text-sm text-slate-500">
                Tap the mic and just say the amount, category, and note, for example “Spent 18 on coffee for client meeting.”
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Date and time are added automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              {isListening ? 'Listening…' : 'Use voice'}
            </button>
          </div>

          {voiceError ? (
            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {voiceError}
            </p>
          ) : null}

          {transcript ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Voice transcript</p>
              <p className="mt-2 text-sm text-slate-900">“{transcript}”</p>
              <p className="mt-2 text-xs text-slate-500">
                Parsed amount: <span className="font-semibold">{amount || '—'}</span>, category: <span className="font-semibold">{categories.find((cat) => cat.id === selectedCategory)?.name || '—'}</span>
              </p>
            </div>
          ) : null}
        </div>

        <motion.button
          whileTap={{ scale: isLoading ? 1 : 0.95 }}
          type="submit"
          form="expense-form"
          disabled={isLoading}
          className="primary-button w-full overflow-hidden"
        >
          {isLoading ? (
            <div className="relative flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#0f172a] text-white">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-blue-500/20 opacity-90" />
              <div className="absolute inset-0 ring-[1px] ring-cyan-400/10 blur-sm" />
              <div className="absolute -left-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-cyan-400/30 blur-2xl" />
              <div className="absolute right-0 top-8 h-20 w-20 rounded-full bg-violet-400/10 blur-3xl" />
              <span className="relative z-10 flex items-center gap-2 text-sm font-semibold tracking-[0.18em] uppercase text-white">
                <span className="flex h-3 w-3 rounded-full bg-cyan-300 animate-pulse" />
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
