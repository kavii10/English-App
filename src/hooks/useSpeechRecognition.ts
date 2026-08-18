import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  setManualTranscript: (text: string) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>('');
  const interimRef = useRef<string>('');

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    interimRef.current = interimTranscript;
  }, [interimTranscript]);

  // Create and configure a fresh SpeechRecognition instance
  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentFinal = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          currentFinal += item[0].transcript + ' ';
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript((prev) => (prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()));
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Mobile timed out due to brief silence, keep active
        return;
      }
      console.warn('Speech recognition error on mobile/desktop:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone was found or microphone is busy.');
      }
    };

    recognition.onend = () => {
      // Commit any remaining interim words
      if (interimRef.current && !transcriptRef.current.includes(interimRef.current.trim())) {
        setTranscript((prev) => (prev ? `${prev} ${interimRef.current.trim()}` : interimRef.current.trim()));
        setInterimTranscript('');
      }

      // If user is still in listening mode (e.g. mobile auto-ended after brief pause), auto-restart
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              // already active or restarted
            }
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported]);

  // Request native hardware microphone access before starting recognition (Crucial on Mobile Android/iOS)
  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. You can type your response.');
      return;
    }

    setError(null);
    setInterimTranscript('');
    isListeningRef.current = true;

    // 1. Request microphone permission explicitly to pre-warm mobile audio driver
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release stream tracks so SpeechRecognition has full exclusive access
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err: any) {
      console.warn('Microphone permission request issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Tap the lock/tune icon in your address bar and set Microphone to "Allow".');
        isListeningRef.current = false;
        return;
      }
    }

    // 2. Start speech recognition with clean instance
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = initRecognition();
      recognitionRef.current = recognition;

      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    } catch (err: any) {
      if (err.name !== 'InvalidStateError') {
        console.warn('Error starting speech recognition:', err);
        setError('Could not start microphone. Please check permissions or type your answer.');
        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, [initRecognition, isSupported]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
    }

    if (interimRef.current) {
      setTranscript((prev) => (prev ? `${prev} ${interimRef.current.trim()}` : interimRef.current.trim()));
      setInterimTranscript('');
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    interimRef.current = '';
  }, []);

  const setManualTranscript = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setManualTranscript,
  };
}
