import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Mic, MicOff, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useBudgetStore } from '@/store/budgetStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { useReminderStore } from '@/store/reminderStore';
import { TextToSpeechService } from '@/services/voice/TextToSpeech';
import { VoiceRecognitionService } from '@/services/voice/VoiceRecognitionService';
import {
  ASSISTANT_NAME,
  airaIntentService,
  getAiraConversationMemory,
  stripWakePhrase,
  type AiraConversationMemory,
  type AiraIntent,
} from '@/services/voice/AiraIntentService';
import { voiceParser, type PendingVoiceExpense } from '@/services/voice/VoiceParser';
import { formatCurrency, generateId } from '@/utils/formatters';

type AiraMode = 'idle' | 'wake' | 'command' | 'processing' | 'confirming' | 'answering';

interface AiraUiState {
  mode: AiraMode;
  transcript: string;
  message: string;
  pendingExpense: PendingVoiceExpense | null;
  error: string | null;
}

const initialState: AiraUiState = {
  mode: 'idle',
  transcript: '',
  message: `Click the microphone to talk to ${ASSISTANT_NAME}.`,
  pendingExpense: null,
  error: null,
};

const COMMAND_SILENCE_MS = 1500;

const isYes = (value: string) => /\b(yes|yeah|yep|correct|confirm|save|ok|okay|right)\b/i.test(value);
const isNo = (value: string) => /\b(no|nope|change|edit|wrong|incorrect)\b/i.test(value);
const isCancel = (value: string) => /\b(cancel|stop|never mind|nevermind)\b/i.test(value);

export default function AiraAssistant() {
  const navigate = useNavigate();
  const { categories } = useCategoryStore();
  const { expenses, addExpense } = useExpenseStore();
  const {
    monthlySalary,
    deductions,
    salaryCreditType,
    fixedCreditDate,
  } = useBudgetStore();
  const { completeTodayReminders } = useReminderStore();

  const recognitionRef = useRef<VoiceRecognitionService | null>(null);
  const ttsRef = useRef<TextToSpeechService | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const assistantActiveRef = useRef(true);
  const suppressRecognitionRestartRef = useRef(false);
  const greetedRef = useRef(false);
  const memoryRef = useRef<AiraConversationMemory>({});
  const stateRef = useRef<AiraUiState>(initialState);
  const contextRef = useRef({
    categories,
    expenses,
    monthlySalary,
    deductions,
    salaryCreditType,
    fixedCreditDate,
  });

  const [supportsVoice, setSupportsVoice] = useState(() => VoiceRecognitionService.isSupported());
  const [state, setState] = useState<AiraUiState>(initialState);
  const [showWelcome, setShowWelcome] = useState(true);

  const financeContext = useMemo(
    () => ({
      categories,
      expenses,
      monthlySalary,
      deductions,
      salaryCreditType,
      fixedCreditDate,
    }),
    [categories, expenses, monthlySalary, deductions, salaryCreditType, fixedCreditDate]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    contextRef.current = financeContext;
  }, [financeContext]);

  const speak = useCallback((message: string, onEnd?: () => void) => {
    suppressRecognitionRestartRef.current = true;
    recognitionRef.current?.cancel();
    ttsRef.current?.speak(message, {
      onEnd: () => {
        suppressRecognitionRestartRef.current = false;
        onEnd?.();
      },
    });
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback((mode: 'wake' | 'command' | 'confirming') => {
    if (!VoiceRecognitionService.isSupported()) {
      assistantActiveRef.current = false;
      setSupportsVoice(false);
      setState((current) => ({
        ...current,
        mode: 'idle',
        error: 'Voice input is not supported in this browser.',
        message: 'Voice input is not supported in this browser.',
      }));
      return;
    }

    assistantActiveRef.current = true;
    setState((current) => ({
      ...current,
      mode,
      transcript: '',
      error: null,
      message:
        mode === 'wake'
          ? `Click the microphone to talk to ${ASSISTANT_NAME}.`
          : mode === 'confirming'
            ? 'Say yes to save, or no to change it.'
            : 'I am listening.',
    }));

    processingRef.current = false;
    window.setTimeout(() => recognitionRef.current?.start(), 120);
  }, []);

  const saveExpense = useCallback((expense: PendingVoiceExpense | null) => {
    if (!expense?.amount || !expense.categoryId) {
      const message = 'I still need both an amount and a category before I can save this expense.';
      setState((current) => ({ ...current, mode: 'command', message, error: null }));
      speak(message, () => startListening('command'));
      return;
    }

    addExpense({
      id: generateId(),
      amount: expense.amount,
      categoryId: expense.categoryId,
      note: expense.note || '',
      date: new Date(),
      createdAt: new Date(),
    });
    completeTodayReminders();

    const message = `Done. I added ${formatCurrency(expense.amount)} under ${expense.categoryName || 'that category'}.`;
    setState((current) => ({
      ...current,
      mode: 'answering',
      pendingExpense: null,
      transcript: '',
      message,
    }));
    speak(message, () => startListening('command'));
  }, [addExpense, completeTodayReminders, speak, startListening]);

  const handleIntent = useCallback((intent: AiraIntent) => {
    if (intent.type === 'add_expense') {
      if (intent.missingFields.length) {
        const missing = intent.missingFields.join(' and ');
        const message = `I can add that, but I still need the ${missing}.`;
        setState((current) => ({
          ...current,
          mode: 'command',
          pendingExpense: intent.expense,
          message,
        }));
        speak(message, () => startListening('command'));
        return;
      }

      const note = intent.expense.note ? ` with note ${intent.expense.note}` : '';
      const message = `I understood ${formatCurrency(intent.expense.amount || 0)} under ${intent.expense.categoryName}${note}. Should I save it?`;
      setState((current) => ({
        ...current,
        mode: 'confirming',
        pendingExpense: intent.expense,
        message,
      }));
      speak(message, () => startListening('confirming'));
      return;
    }

    if (intent.type === 'navigate') {
      setState((current) => ({
        ...current,
        mode: 'answering',
        pendingExpense: null,
        message: intent.response,
      }));
      speak(intent.response, () => startListening('command'));
      navigate(intent.path);
      return;
    }

    setState((current) => ({
      ...current,
      mode: 'answering',
      pendingExpense: null,
      message: intent.response,
    }));
    speak(intent.response, () => startListening('command'));
  }, [navigate, speak, startListening]);

  const processCommand = useCallback((transcript: string) => {
    const current = stateRef.current;
    const context = contextRef.current;
    const cleanedTranscript = stripWakePhrase(transcript);
    clearSilenceTimer();

    if (isCancel(transcript)) {
      const message = 'Okay. I will pause now.';
      setState((prev) => ({ ...prev, mode: 'answering', transcript, message, pendingExpense: null }));
      speak(message);
      return;
    }

    if (current.mode === 'confirming') {
      if (isYes(transcript)) {
        saveExpense(current.pendingExpense);
        return;
      }

      if (isNo(transcript)) {
        const message = 'What should I change?';
        setState((prev) => ({ ...prev, mode: 'command', transcript, message }));
        speak(message, () => startListening('command'));
        return;
      }

      const edited = voiceParser.applyEdit(transcript, current.pendingExpense || {}, context.categories);
      if (!edited.cancelled && edited.missingFields.length === 0) {
        handleIntent({
          type: 'add_expense',
          expense: edited.expense,
          missingFields: edited.missingFields,
        });
        return;
      }

      const message = 'Please say yes to save, or tell me what to change.';
      setState((prev) => ({ ...prev, mode: 'confirming', transcript, message }));
      speak(message, () => startListening('confirming'));
      return;
    }

    if (current.pendingExpense && current.mode === 'command') {
      const edited = voiceParser.applyEdit(cleanedTranscript || transcript, current.pendingExpense, context.categories);
      if (!edited.cancelled && edited.expense !== current.pendingExpense) {
        handleIntent({
          type: 'add_expense',
          expense: edited.expense,
          missingFields: edited.missingFields,
        });
        return;
      }
    }

    const commandText = cleanedTranscript || transcript;
    const normalizedCommand = commandText.toLowerCase().replace(/[.,!?]/g, ' ').trim();
    const shouldGreet = !greetedRef.current;

    if (shouldGreet) {
      greetedRef.current = true;
    }

    if (shouldGreet && /^(hello|hi|hey|hii|good morning|good afternoon|good evening)\b/.test(normalizedCommand)) {
      const message = 'Hi! How can I help you today?';
      setState((prev) => ({ ...prev, mode: 'answering', transcript, message }));
      speak(message, () => startListening('command'));
      return;
    }

    const intent = airaIntentService.resolve(commandText, context, memoryRef.current);
    memoryRef.current = getAiraConversationMemory(commandText, context, memoryRef.current);
    if (shouldGreet && 'response' in intent) {
      handleIntent({ ...intent, response: `Hi! ${intent.response}` });
      return;
    }

    handleIntent(intent);
  }, [clearSilenceTimer, handleIntent, saveExpense, speak, startListening]);

  const scheduleCommandProcessing = useCallback((transcript: string) => {
    if (!transcript.trim() || processingRef.current) return;

    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      if (processingRef.current) return;
      processingRef.current = true;
      recognitionRef.current?.stop();
      setState((current) => ({ ...current, mode: 'processing' }));
      processCommand(transcript);
    }, COMMAND_SILENCE_MS);
  }, [clearSilenceTimer, processCommand]);

  useEffect(() => {
    ttsRef.current = new TextToSpeechService();
    recognitionRef.current = new VoiceRecognitionService({
      onTranscript: (transcript) => {
        const current = stateRef.current;
        if (!transcript.trim() || current.mode === 'processing' || current.mode === 'answering') return;

        setState((prev) => ({ ...prev, transcript, message: 'I am listening...' }));
        scheduleCommandProcessing(transcript);
      },
      onEnd: () => {
        if (suppressRecognitionRestartRef.current) return;

        const current = stateRef.current;
        if (assistantActiveRef.current && current.mode === 'wake' && VoiceRecognitionService.isSupported()) {
          window.setTimeout(() => recognitionRef.current?.start(), 300);
        }
      },
      onError: (message) => {
        if (message === 'aborted' || message === 'AbortError') return;

        clearSilenceTimer();
        setState((current) => ({ ...current, mode: 'idle', error: message, message }));
      },
    }, { continuous: true, interimResults: true });
    setSupportsVoice(VoiceRecognitionService.isSupported());
    const welcomeTimer = window.setTimeout(() => setShowWelcome(false), 2600);

    return () => {
      window.clearTimeout(welcomeTimer);
      clearSilenceTimer();
      recognitionRef.current?.cancel();
      ttsRef.current?.cancel();
    };
  }, [clearSilenceTimer, scheduleCommandProcessing, speak, startListening]);

  const toggleAssistant = () => {
    if (state.mode === 'wake' || state.mode === 'command' || state.mode === 'confirming') {
      assistantActiveRef.current = false;
      suppressRecognitionRestartRef.current = false;
      recognitionRef.current?.cancel();
      ttsRef.current?.cancel();
      clearSilenceTimer();
      setState((current) => ({ ...current, mode: 'idle', message: 'Aira is paused.' }));
      return;
    }

    assistantActiveRef.current = true;
    suppressRecognitionRestartRef.current = false;
    greetedRef.current = false;
    ttsRef.current?.cancel();
    setShowWelcome(false);
    startListening('command');
  };

  const closeAssistant = () => {
    assistantActiveRef.current = false;
    suppressRecognitionRestartRef.current = false;
    greetedRef.current = false;
    recognitionRef.current?.cancel();
    ttsRef.current?.cancel();
    clearSilenceTimer();
    setState(initialState);
  };

  const isListening = state.mode === 'wake' || state.mode === 'command' || state.mode === 'confirming';
  const isOpen = state.mode !== 'idle' || Boolean(state.error);

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {showWelcome && supportsVoice ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-xl border border-cyan-300/20 bg-[#081321]/95 p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200">
              <Mic size={22} />
            </div>
            <p className="mt-3 text-lg font-semibold text-white">Welcome to {ASSISTANT_NAME}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-xl border border-cyan-300/15 bg-[#0b1628]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-300" />
                  <p className="font-semibold text-white">{ASSISTANT_NAME}</p>
                </div>
                <p className="mt-1 text-sm text-slate-300">{state.message}</p>
              </div>
              <button
                type="button"
                onClick={closeAssistant}
                className="secondary-button h-8 w-8 shrink-0 p-0"
                aria-label="Close Aira"
              >
                <X size={15} />
              </button>
            </div>

            {state.transcript ? (
              <div className="mt-3 rounded-lg border border-white/[0.08] bg-[#07111f]/80 px-3 py-2 text-sm text-slate-300">
                “{state.transcript}”
              </div>
            ) : null}

            {state.pendingExpense ? (
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-slate-500">Amount</p>
                  <p className="mt-1 font-semibold text-white">
                    {state.pendingExpense.amount ? formatCurrency(state.pendingExpense.amount) : 'Missing'}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-slate-500">Category</p>
                  <p className="mt-1 truncate font-semibold text-white">
                    {state.pendingExpense.categoryName || 'Missing'}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-slate-500">Note</p>
                  <p className="mt-1 truncate font-semibold text-white">
                    {state.pendingExpense.note || 'None'}
                  </p>
                </div>
              </div>
            ) : null}

            {state.mode === 'confirming' ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className="primary-button" onClick={() => saveExpense(state.pendingExpense)}>
                  <Check size={16} />
                  Yes
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    const message = 'What should I change?';
                    setState((current) => ({ ...current, mode: 'command', message }));
                    speak(message, () => startListening('command'));
                  }}
                >
                  No
                </button>
              </div>
            ) : null}

            {state.error ? (
              <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {state.error}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggleAssistant}
        disabled={!supportsVoice}
        className={clsx(
          'pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border text-white shadow-[0_14px_40px_rgba(14,165,233,0.24)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
          isListening
            ? 'border-rose-300/40 bg-rose-500'
            : 'border-cyan-200/30 bg-gradient-to-br from-cyan-500 to-blue-600 hover:brightness-110'
        )}
        aria-label={isListening ? 'Stop Aira' : 'Start Aira'}
        title={supportsVoice ? `Start ${ASSISTANT_NAME}` : 'Voice input is not supported in this browser'}
      >
        {isListening ? (
          <>
            <motion.span
              className="absolute inset-0 rounded-full border border-cyan-200/40"
              animate={{ scale: [1, 1.45], opacity: [0.65, 0] }}
              transition={{ duration: 1.15, repeat: Infinity, ease: 'easeOut' }}
            />
            <MicOff size={22} className="relative z-10" />
          </>
        ) : (
          <Mic size={22} />
        )}
      </button>
    </div>
  );
}
