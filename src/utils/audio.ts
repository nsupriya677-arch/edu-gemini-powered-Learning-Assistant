// Audio helper with Web Speech API and Server TTS integration

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = async (text: string, onEnd?: () => void, onError?: () => void): Promise<void> => {
  stopSpeaking();

  // Strip markdown formatting symbols for cleaner voice reading
  const cleanText = text
    .replace(/[#*`_~>[\]()]/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  // Try server-side Gemini TTS first for short snippets (under 800 chars)
  if (cleanText.length <= 800) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText.slice(0, 800), voiceName: 'Puck' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          // Gemini audio is returned as base64 PCM or encoded audio
          // Try playing as base64 data uri
          const audioUrl = `data:audio/mp3;base64,${data.audio}`;
          currentAudio = new Audio(audioUrl);
          currentAudio.onended = () => {
            currentAudio = null;
            if (onEnd) onEnd();
          };
          currentAudio.onerror = () => {
            // fallback to speech synthesis
            fallbackWebSpeech(cleanText, onEnd, onError);
          };
          await currentAudio.play();
          return;
        }
      }
    } catch {
      // Fallback silently to browser SpeechSynthesis
    }
  }

  // Fallback to browser SpeechSynthesis API
  fallbackWebSpeech(cleanText, onEnd, onError);
};

const fallbackWebSpeech = (text: string, onEnd?: () => void, onError?: () => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Select a pleasant voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Samantha')) && v.lang.startsWith('en')
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    currentUtterance = null;
    if (onError) onError();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const playAudioNarration = speakText;
export const stopAudioNarration = stopSpeaking;

// Web Speech Recognition for Voice-Based Learning Input
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export const startSpeechRecognition = (
  onTranscript: (text: string) => void,
  onEnd?: () => void,
  onError?: (err: string) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    if (onError) onError('Window not defined');
    return () => {};
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError('Speech recognition is not supported in this browser.');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const text = finalTranscript || interimTranscript;
    if (text) {
      onTranscript(text);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (err: any) {
    if (onError) onError(err.message || 'Could not start voice recognition');
  }

  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore
    }
  };
};
