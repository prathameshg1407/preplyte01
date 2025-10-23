// src/types/speech-recognition.d.ts

/**
 * Shared Speech Recognition type definitions
 */

export interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  
  export interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
  }
  
  export interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
  }
  
  export interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  
  export interface SpeechRecognitionErrorEvent extends Event {
    error:
      | 'no-speech'
      | 'audio-capture'
      | 'not-allowed'
      | 'network'
      | 'aborted'
      | 'service-not-allowed'
      | 'bad-grammar'
      | 'language-not-supported';
    message?: string;
  }
  
  export interface ISpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onnomatch: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  }
  
  // Global Window interface extension (only declared once!)
  declare global {
    interface Window {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    }
  }