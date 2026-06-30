import type { Category } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import type { PendingVoiceExpense, VoiceExpenseParser } from '@/services/voice/VoiceParser';
import { voiceParser } from '@/services/voice/VoiceParser';

export enum VoiceState {
  Idle = 'Idle',
  Listening = 'Listening',
  Processing = 'Processing',
  Confirming = 'Confirming',
  Editing = 'Editing',
  Saving = 'Saving',
}

export type VoiceListeningMode = 'expense' | 'confirmation' | 'edit';

export interface VoiceAssistantState {
  voiceState: VoiceState;
  listeningMode: VoiceListeningMode | null;
  pendingExpense: PendingVoiceExpense | null;
  liveTranscript: string;
  lastTranscript: string;
  assistantMessage: string;
  error: string | null;
}

const initialState: VoiceAssistantState = {
  voiceState: VoiceState.Idle,
  listeningMode: null,
  pendingExpense: null,
  liveTranscript: '',
  lastTranscript: '',
  assistantMessage: 'Tap the mic and tell me the amount, category, and optional note.',
  error: null,
};

const isAffirmative = (text: string) => /\b(yes|yeah|yep|correct|confirm|confirmed|right|save|okay|ok)\b/i.test(text);
const isNegative = (text: string) => /\b(no|nope|wrong|incorrect|change|edit)\b/i.test(text);
const isCancel = (text: string) => /\b(cancel|stop|never mind|nevermind)\b/i.test(text);

export class VoiceConfirmationManager {
  constructor(private parser: VoiceExpenseParser = voiceParser) {}

  getInitialState(): VoiceAssistantState {
    return { ...initialState };
  }

  startExpenseCapture(state: VoiceAssistantState): VoiceAssistantState {
    return {
      ...state,
      voiceState: VoiceState.Listening,
      listeningMode: 'expense',
      liveTranscript: '',
      lastTranscript: '',
      assistantMessage: 'Listening...',
      error: null,
    };
  }

  startConfirmationListening(state: VoiceAssistantState): VoiceAssistantState {
    return {
      ...state,
      voiceState: VoiceState.Confirming,
      listeningMode: 'confirmation',
      liveTranscript: '',
      error: null,
    };
  }

  startEditListening(state: VoiceAssistantState): VoiceAssistantState {
    return {
      ...state,
      voiceState: VoiceState.Editing,
      listeningMode: 'edit',
      liveTranscript: '',
      assistantMessage: 'What would you like to change?',
      error: null,
    };
  }

  updateLiveTranscript(state: VoiceAssistantState, transcript: string): VoiceAssistantState {
    return {
      ...state,
      liveTranscript: transcript,
    };
  }

  captureExpense(
    state: VoiceAssistantState,
    transcript: string,
    categories: Category[]
  ): VoiceAssistantState {
    const result = this.parser.parseExpense(transcript, categories);
    const assistantMessage = this.buildResponse(result.expense, result.missingFields);

    return {
      ...state,
      voiceState: result.missingFields.length ? VoiceState.Editing : VoiceState.Confirming,
      listeningMode: null,
      pendingExpense: result.expense,
      lastTranscript: result.transcript,
      liveTranscript: '',
      assistantMessage,
      error: null,
    };
  }

  handleConfirmation(state: VoiceAssistantState, transcript: string): {
    state: VoiceAssistantState;
    action: 'save' | 'edit' | 'cancel' | 'repeat';
  } {
    if (isCancel(transcript)) {
      return { state: this.cancel(state), action: 'cancel' };
    }

    if (isAffirmative(transcript)) {
      return {
        state: {
          ...state,
          voiceState: VoiceState.Saving,
          listeningMode: null,
          liveTranscript: '',
          lastTranscript: transcript,
          assistantMessage: 'Saving your expense...',
        },
        action: 'save',
      };
    }

    if (isNegative(transcript)) {
      return {
        state: {
          ...state,
          voiceState: VoiceState.Editing,
          listeningMode: null,
          liveTranscript: '',
          lastTranscript: transcript,
          assistantMessage: 'What would you like to change?',
        },
        action: 'edit',
      };
    }

    return {
      state: {
        ...state,
        voiceState: VoiceState.Confirming,
        listeningMode: null,
        liveTranscript: '',
        lastTranscript: transcript,
        assistantMessage: 'Please say yes to save, or no to make a change.',
      },
      action: 'repeat',
    };
  }

  applyEdit(
    state: VoiceAssistantState,
    transcript: string,
    categories: Category[]
  ): VoiceAssistantState {
    const currentExpense = state.pendingExpense || {};
    const result = this.parser.applyEdit(transcript, currentExpense, categories);

    if (result.cancelled) {
      return this.cancel(state);
    }

    return {
      ...state,
      voiceState: result.missingFields.length ? VoiceState.Editing : VoiceState.Confirming,
      listeningMode: null,
      pendingExpense: result.expense,
      liveTranscript: '',
      lastTranscript: transcript,
      assistantMessage: this.buildResponse(result.expense, result.missingFields),
      error: null,
    };
  }

  fail(state: VoiceAssistantState, error: string): VoiceAssistantState {
    return {
      ...state,
      voiceState: VoiceState.Idle,
      listeningMode: null,
      error,
      assistantMessage: error,
    };
  }

  cancel(state: VoiceAssistantState): VoiceAssistantState {
    return {
      ...state,
      voiceState: VoiceState.Idle,
      listeningMode: null,
      liveTranscript: '',
      assistantMessage: 'Voice expense entry cancelled.',
      error: null,
    };
  }

  complete(state: VoiceAssistantState): VoiceAssistantState {
    return {
      ...state,
      voiceState: VoiceState.Idle,
      listeningMode: null,
      pendingExpense: null,
      liveTranscript: '',
      assistantMessage: 'Done. Your expense has been added successfully.',
      error: null,
    };
  }

  private buildResponse(expense: PendingVoiceExpense, missingFields: Array<'amount' | 'category'>) {
    if (missingFields.length) {
      const missing = missingFields.join(' and ');
      return `I still need the ${missing}. Please tell me what to use.`;
    }

    const amount = expense.amount ? formatCurrency(expense.amount) : '';
    const category = expense.categoryName || 'the selected category';
    const note = expense.note ? ` with the note "${expense.note}"` : '';

    return `I understood ${amount} under ${category}${note}. Is that correct?`;
  }
}

export const voiceConfirmationManager = new VoiceConfirmationManager();
