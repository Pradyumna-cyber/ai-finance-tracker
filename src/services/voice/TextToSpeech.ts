export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export class TextToSpeechService {
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, options: SpeakOptions = {}) {
    if (!this.isSupported()) {
      options.onEnd?.();
      return;
    }

    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;
    utterance.lang = 'en-IN';
    utterance.rate = options.rate ?? 0.95;
    utterance.pitch = options.pitch ?? 1;
    utterance.onend = () => {
      if (this.activeUtterance !== utterance) return;
      this.activeUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = () => {
      if (this.activeUtterance !== utterance) return;
      this.activeUtterance = null;
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    this.cancel();
  }

  cancel() {
    if (this.isSupported()) {
      if (this.activeUtterance) {
        this.activeUtterance.onend = null;
        this.activeUtterance.onerror = null;
        this.activeUtterance = null;
      }
      window.speechSynthesis.cancel();
    }
  }
}
