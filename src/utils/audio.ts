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
