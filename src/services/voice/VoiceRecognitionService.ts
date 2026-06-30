type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal?: boolean;
    0?: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface VoiceRecognitionCallbacks {
  onStart?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

export class VoiceRecognitionService {
  private recognition: BrowserSpeechRecognition | null = null;
  private isListening = false;
  private emittedFinalTranscript = false;
  private lastTranscript = '';
  private callbacks: VoiceRecognitionCallbacks;
  private options: Required<VoiceRecognitionOptions>;

  constructor(callbacks: VoiceRecognitionCallbacks = {}, options: VoiceRecognitionOptions = {}) {
    this.callbacks = callbacks;
    this.options = {
      continuous: options.continuous ?? false,
      interimResults: options.interimResults ?? true,
      lang: options.lang ?? 'en-IN',
    };
    this.recognition = this.createRecognition();
  }

  static isSupported() {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  setCallbacks(callbacks: VoiceRecognitionCallbacks) {
    this.callbacks = callbacks;
    this.bindCallbacks();
  }

  start() {
    if (!this.recognition) {
      this.callbacks.onError?.('Voice input is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    try {
      this.recognition.start();
    } catch {
      this.callbacks.onError?.('Unable to start voice input. Please try again.');
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
  }

  cancel() {
    if (!this.recognition) return;
    this.recognition.abort();
    this.isListening = false;
  }

  private createRecognition() {
    if (!VoiceRecognitionService.isSupported()) return null;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;

    const recognition = new Recognition();
    recognition.continuous = this.options.continuous;
    recognition.interimResults = this.options.interimResults;
    recognition.lang = this.options.lang;

    this.recognition = recognition;
    this.bindCallbacks();

    return recognition;
  }

  private bindCallbacks() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emittedFinalTranscript = false;
      this.lastTranscript = '';
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.lastTranscript && !this.emittedFinalTranscript) {
        this.emittedFinalTranscript = true;
        this.callbacks.onTranscript?.(this.lastTranscript, true);
      }
      this.callbacks.onEnd?.();
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      this.callbacks.onError?.(event.error || 'Voice recognition failed. Please try again.');
    };

    this.recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;

      Array.from(event.results).forEach((result) => {
        transcript += result[0]?.transcript || '';
        if (result.isFinal) {
          isFinal = true;
        }
      });

      const cleanedTranscript = transcript.trim();
      this.lastTranscript = cleanedTranscript || this.lastTranscript;

      if (isFinal) {
        this.emittedFinalTranscript = true;
      }

      this.callbacks.onTranscript?.(cleanedTranscript, isFinal);
    };
  }
}
