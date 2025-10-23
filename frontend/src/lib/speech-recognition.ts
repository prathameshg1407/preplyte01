// src/lib/speech-recognition.ts

import type {
  ISpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '@/types/speech-recognition';

// ============= REMOVE all type definitions and declare global block =============

// ============= Options Interface =============
export interface SpeechRecognitionOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onInterimResult?: (transcript: string) => void;
  onError: (error: string, errorType?: string) => void;
  onEnd: () => void;
  onStart?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  minConfidence?: number;
  maxAlternatives?: number;
}

// ============= Recognition State =============
export enum RecognitionState {
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  ACTIVE = 'ACTIVE',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR',
}

// ============= Main Class =============
export class VoiceRecognition {
  private recognition: ISpeechRecognition | null = null;
  private state: RecognitionState = RecognitionState.IDLE;
  private committedTranscript: string = '';
  private options: Required<SpeechRecognitionOptions>;

  constructor(options: SpeechRecognitionOptions) {
    this.options = {
      onResult: options.onResult,
      onInterimResult: options.onInterimResult || (() => {}),
      onError: options.onError,
      onEnd: options.onEnd,
      onStart: options.onStart || (() => {}),
      onSpeechStart: options.onSpeechStart || (() => {}),
      onSpeechEnd: options.onSpeechEnd || (() => {}),
      lang: options.lang || 'en-US',
      continuous: options.continuous ?? true,
      interimResults: options.interimResults ?? true,
      minConfidence: options.minConfidence ?? 0.6,
      maxAlternatives: options.maxAlternatives ?? 1,
    };

    this.initialize();
  }

  private initialize(): void {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.state = RecognitionState.ERROR;
      this.options.onError(
        'Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.',
        'not-supported'
      );
      return;
    }

    try {
      this.recognition = new SpeechRecognitionAPI();
      this.setupRecognition();
    } catch (error: any) {
      this.state = RecognitionState.ERROR;
      this.options.onError(
        `Failed to initialize speech recognition: ${error.message}`,
        'initialization-error'
      );
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.lang = this.options.lang;
    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.maxAlternatives = this.options.maxAlternatives;

    this.recognition.onstart = () => {
      console.log('[VoiceRecognition] Started');
      this.state = RecognitionState.ACTIVE;
      this.options.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[VoiceRecognition] Error:', event.error);
      this.state = RecognitionState.ERROR;
      this.handleError(event);
    };

    this.recognition.onend = () => {
      console.log('[VoiceRecognition] Ended');
      if (this.state !== RecognitionState.STOPPING) {
        this.state = RecognitionState.IDLE;
      }
      this.options.onEnd();
    };

    this.recognition.onspeechstart = () => {
      console.log('[VoiceRecognition] Speech detected');
      this.options.onSpeechStart?.();
    };

    this.recognition.onspeechend = () => {
      console.log('[VoiceRecognition] Speech ended');
      this.options.onSpeechEnd?.();
    };

    this.recognition.onnomatch = () => {
      console.log('[VoiceRecognition] No match');
    };
  }

  private handleResult(event: SpeechRecognitionEvent): void {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternative = result[0];
      const transcript = alternative.transcript.trim();
      const confidence = alternative.confidence || 0;

      if (confidence < this.options.minConfidence && result.isFinal) {
        console.warn('[VoiceRecognition] Low confidence:', confidence);
      }

      if (result.isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript + ' ';
      }
    }

    if (interimTranscript) {
      const fullInterim = this.committedTranscript + interimTranscript;
      this.options.onInterimResult?.(fullInterim.trim());
    }

    if (finalTranscript) {
      this.committedTranscript += finalTranscript;
      const fullTranscript = this.committedTranscript.trim();
      this.options.onResult(fullTranscript, true);
    }
  }

  private handleError(event: SpeechRecognitionErrorEvent): void {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try speaking again.',
      'audio-capture': 'No microphone found. Please ensure a microphone is connected.',
      'not-allowed': 'Microphone permission denied. Please enable microphone access.',
      'network': 'Network error occurred. Please check your connection.',
      'aborted': 'Speech recognition was aborted.',
      'service-not-allowed': 'Speech recognition service is not allowed.',
      'bad-grammar': 'Grammar error occurred.',
      'language-not-supported': 'Language not supported.',
    };

    const errorMessage = 
      errorMessages[event.error] || 
      `Speech recognition error: ${event.error}`;

    this.options.onError(errorMessage, event.error);
  }

  start(): void {
    if (!this.recognition) {
      this.options.onError('Speech recognition not initialized', 'not-initialized');
      return;
    }

    if (this.state === RecognitionState.ACTIVE) {
      console.warn('[VoiceRecognition] Already active');
      return;
    }

    try {
      console.log('[VoiceRecognition] Starting...');
      this.state = RecognitionState.STARTING;
      this.committedTranscript = '';
      this.recognition.start();
    } catch (error: any) {
      this.state = RecognitionState.ERROR;
      this.options.onError(
        `Failed to start recognition: ${error.message}`,
        'start-error'
      );
    }
  }

  stop(): void {
    if (!this.recognition) return;

    if (this.state !== RecognitionState.ACTIVE) {
      console.warn('[VoiceRecognition] Not active');
      return;
    }

    try {
      console.log('[VoiceRecognition] Stopping...');
      this.state = RecognitionState.STOPPING;
      this.recognition.stop();
    } catch (error: any) {
      console.error('[VoiceRecognition] Error stopping:', error);
      this.state = RecognitionState.IDLE;
    }
  }

  abort(): void {
    if (!this.recognition) return;

    try {
      console.log('[VoiceRecognition] Aborting...');
      this.state = RecognitionState.IDLE;
      this.recognition.abort();
      this.committedTranscript = '';
    } catch (error: any) {
      console.error('[VoiceRecognition] Error aborting:', error);
    }
  }

  reset(): void {
    console.log('[VoiceRecognition] Resetting...');
    this.committedTranscript = '';
    this.state = RecognitionState.IDLE;
  }

  getTranscript(): string {
    return this.committedTranscript.trim();
  }

  getState(): RecognitionState {
    return this.state;
  }

  isActive(): boolean {
    return this.state === RecognitionState.ACTIVE;
  }

  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  static async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[VoiceRecognition] Permission denied:', error);
      return false;
    }
  }

  destroy(): void {
    console.log('[VoiceRecognition] Destroying...');
    
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('[VoiceRecognition] Error during destroy:', error);
      }
      
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      this.recognition.onspeechstart = null;
      this.recognition.onspeechend = null;
      
      this.recognition = null;
    }

    this.committedTranscript = '';
    this.state = RecognitionState.IDLE;
  }
}

export const createVoiceRecognition = (
  options: SpeechRecognitionOptions
): VoiceRecognition => {
  return new VoiceRecognition(options);
};

export const checkVoiceRecognitionSupport = (): {
  supported: boolean;
  browser: string;
  recommendation?: string;
} => {
  const isSupported = VoiceRecognition.isSupported();
  const userAgent = navigator.userAgent;
  
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';

  return {
    supported: isSupported,
    browser,
    recommendation: !isSupported 
      ? 'Please use Chrome, Edge, or Safari for voice recognition support.'
      : undefined,
  };
};

export default VoiceRecognition;