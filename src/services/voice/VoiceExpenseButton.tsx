import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import clsx from 'clsx';
import { VoiceState } from '@/services/voice/VoiceConfirmation';

interface VoiceExpenseButtonProps {
  state: VoiceState;
  disabled?: boolean;
  supported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function VoiceExpenseButton({
  state,
  disabled = false,
  supported,
  onStart,
  onStop,
}: VoiceExpenseButtonProps) {
  const isListening = state === VoiceState.Listening || state === VoiceState.Editing || state === VoiceState.Confirming;
  const isBusy = state === VoiceState.Processing || state === VoiceState.Saving;
  const isDisabled = disabled || !supported || isBusy;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={isDisabled}
      className={clsx(
        'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        isListening
          ? 'border-rose-300/40 bg-rose-500/90 shadow-rose-500/20'
          : 'border-cyan-300/30 bg-cyan-500/90 shadow-cyan-500/20 hover:bg-cyan-400'
      )}
      aria-label={isListening ? 'Stop voice input' : 'Start voice expense assistant'}
      title={supported ? 'Voice expense assistant' : 'Voice input is not supported in this browser'}
    >
      {isListening ? (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-rose-200/40"
            animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
          />
          <MicOff size={20} className="relative z-10" />
        </>
      ) : (
        <Mic size={20} />
      )}
    </button>
  );
}
