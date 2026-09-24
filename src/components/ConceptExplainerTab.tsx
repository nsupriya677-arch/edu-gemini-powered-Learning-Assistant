import React, { useState } from 'react';
import { Lightbulb, Sparkles, Copy, Check, Bookmark, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { EducationLevel, Subject, AppLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { playAudioNarration, stopAudioNarration } from '../utils/audio';

interface ConceptExplainerTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const SAMPLE_CONCEPTS: Record<Subject, string[]> = {
  General: ['Entropy & The Arrow of Time', 'Confirmation Bias', 'The Scientific Method'],
  Mathematics: ['Euler\'s Formula e^(i*pi) + 1 = 0', 'Fourier Transform Intuition', 'Bayes Theorem with Real Examples'],
  Physics: ['Schrödinger\'s Cat & Superposition', 'Special Relativity & Time Dilation', 'Wave-Particle Duality'],
  Chemistry: ['Le Chatelier’s Principle', 'Gibbs Free Energy & Spontaneity', 'Orbital Hybridization (sp3, sp2, sp)'],
  Biology: ['CRISPR-Cas9 Gene Editing', 'Action Potential in Neurons', 'Cellular Respiration & ATP Synthase'],
  'Computer Science': ['Recursion & The Call Stack', 'Public-Key Asymmetric Encryption', 'How Backpropagation Works in Neural Nets'],
  History: ['The Printing Press Revolution', 'The Industrial Revolution & Urbanization', 'The Cold War & Nuclear Deterrence'],
  Literature: ['The Hero\'s Journey Monomyth', 'Stream of Consciousness Technique', 'Metaphor vs Allegory'],
  Economics: ['Opportunity Cost & Comparative Advantage', 'Inflation, Interest Rates & Supply Shocks', 'Tragedy of the Commons'],
};

export const ConceptExplainerTab: React.FC<ConceptExplainerTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<'intuitive' | 'feynman' | 'eli5' | 'visual_analogies' | 'academic'>('feynman');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleExplain = async (conceptQuery?: string) => {
    const text = (conceptQuery || topic).trim();
    if (!text || isLoading) return;

    if (conceptQuery) {
      setTopic(conceptQuery);
    }

    setIsLoading(true);
    setExplanation(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: text,
          style,
          educationLevel,
          subject,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to explain concept.');
      }

      const data = await res.json();
      setExplanation(data.explanation);
      onRewardXP(25, 'Concept Master');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error explaining concept';
      setExplanation(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!explanation) return;
    onSaveItem(`Concept: ${topic}`, explanation, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleToggleVoice = async () => {
    if (isSpeaking) {
      stopAudioNarration();
      setIsSpeaking(false);
    } else if (explanation) {
      setIsSpeaking(true);
      await playAudioNarration(explanation.slice(0, 800));
      setIsSpeaking(false);
    }
  };

  const concepts = SAMPLE_CONCEPTS[subject] || SAMPLE_CONCEPTS.General;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-violet-900/30 to-slate-900/50 border border-purple-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-400/30 text-purple-400 shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Concept Explainer & Mental Model Builder
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Demystify intricate, intimidating concepts into simple, intuitive mental models. Choose pedagogical styles from the famous Feynman Technique to ELI5 or visual analogies.
            </p>
          </div>
        </div>

        {/* Quick Concepts */}
        <div className="mt-4 pt-4 border-t border-purple-500/15">
          <p className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Curated topics in {subject}:
          </p>
          <div className="flex flex-wrap gap-2">
            {concepts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExplain(item)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-purple-900/40 border border-slate-700/60 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input & Style Selector */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What concept do you want to truly understand?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            placeholder="e.g., Quantum entanglement, General relativity, Fourier transform, Keynesian economics..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          />
        </div>

        {/* Teaching Style Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Pedagogical Framework:</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'feynman', label: 'Feynman Technique', desc: 'No jargon, vivid analogies' },
              { id: 'eli5', label: 'Explain Like I\'m 10', desc: 'Ultra-simple language' },
              { id: 'intuitive', label: 'Intuitive First', desc: 'Builds from ground up' },
              { id: 'visual_analogies', label: 'Visual Models', desc: 'Diagrams & spatial flow' },
              { id: 'academic', label: 'Academic Rigor', desc: 'Theorems & derivations' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  style === s.id
                    ? 'bg-purple-900/30 border-purple-500/60 shadow-md shadow-purple-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <p className={`text-xs font-semibold ${style === s.id ? 'text-white' : 'text-slate-300'}`}>{s.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => handleExplain()}
            disabled={isLoading || !topic.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deconstructing Concept...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Explain Concept</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explanation Display */}
      {explanation && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400" />
              <h3 className="text-base font-bold text-white capitalize">{topic}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                title="Read aloud"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Listen</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={explanation} />
        </div>
      )}
    </div>
  );
};
