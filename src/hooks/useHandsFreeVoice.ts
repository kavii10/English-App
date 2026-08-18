import { useState, useEffect, useRef, useCallback } from 'react';

interface UseHandsFreeVoiceOptions {
  onUserSpoke: (transcript: string) => void;
  onVoiceEndTrigger?: () => void;
  silenceThresholdMs?: number;
}

export type VoicePhase = 'idle' | 'listening' | 'processing' | 'speaking';

export function useHandsFreeVoice({
  onUserSpoke,
  onVoiceEndTrigger,
  silenceThresholdMs = 1900,
}: UseHandsFreeVoiceOptions) {
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [interimText, setInterimText] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isRunningRef = useRef<boolean>(false);
  const currentTranscriptRef = useRef<string>('');
  const isSpeakingRef = useRef<boolean>(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current) return;

      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalChunk += item[0].transcript + ' ';
        } else {
          interimChunk += item[0].transcript;
        }
      }

      if (finalChunk) {
        currentTranscriptRef.current += finalChunk;
      }

      const fullSpokenSoFar = (currentTranscriptRef.current + ' ' + interimChunk).trim();
      setInterimText(fullSpokenSoFar);

      // Check for voice end commands
      const lower = fullSpokenSoFar.toLowerCase();
      if (
        (lower.includes('end conversation') ||
          lower.includes('stop conversation') ||
          lower.includes('end session') ||
          lower.includes('goodbye speakwise')) &&
        onVoiceEndTrigger
      ) {
        clearTimeout(silenceTimerRef.current);
        onVoiceEndTrigger();
        return;
      }

      // Reset Silence Timer whenever user speaks
      if (fullSpokenSoFar.length > 0) {
        setPhase('listening');
        clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
          const finalSpoken = (currentTranscriptRef.current + ' ' + interimChunk).trim();
          if (finalSpoken.length > 2 && isRunningRef.current && !isSpeakingRef.current) {
            setPhase('processing');
            currentTranscriptRef.current = '';
            setInterimText('');
            onUserSpoke(finalSpoken);
          }
        }, silenceThresholdMs);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      console.warn('Speech recognition notice:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still running and AI is not speaking
      if (isRunningRef.current && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [onUserSpoke, onVoiceEndTrigger, silenceThresholdMs]);

  // Start Hands-Free loop
  const startHandsFree = useCallback(() => {
    isRunningRef.current = true;
    currentTranscriptRef.current = '';
    setInterimText('');
    setPhase('listening');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  }, []);

  // Stop Hands-Free loop
  const stopHandsFree = useCallback(() => {
    isRunningRef.current = false;
    isSpeakingRef.current = false;
    clearTimeout(silenceTimerRef.current);
    window.speechSynthesis.cancel();
    setPhase('idle');
    setInterimText('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // AI speaks out loud with pause/resume isolation
  const speakAIResponse = useCallback(
    (text: string, onDone?: () => void) => {
      if (!text) return;

      isSpeakingRef.current = true;
      setPhase('speaking');
      clearTimeout(silenceTimerRef.current);

      // Stop recognition while AI speaks to avoid hearing self
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick high quality natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice =
        voices.find((v) => v.name.includes('Natural') || v.name.includes('Google US English') || v.name.includes('Samantha') || (v.lang === 'en-US' && v.localService)) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onend = () => {
        isSpeakingRef.current = false;
        if (onDone) onDone();

        // Restart recognition after AI finishes
        if (isRunningRef.current) {
          setPhase('listening');
          setTimeout(() => {
            if (isRunningRef.current && !isSpeakingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          }, 350);
        }
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        if (isRunningRef.current) {
          setPhase('listening');
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  return {
    phase,
    interimText,
    isSupported,
    startHandsFree,
    stopHandsFree,
    speakAIResponse,
  };
}
