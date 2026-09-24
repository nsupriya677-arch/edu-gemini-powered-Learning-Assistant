import React, { useState, useRef } from 'react';
import { HelpCircle, Sparkles, Send, Copy, Check, Bookmark, BookOpen, Volume2, VolumeX, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { EducationLevel, Subject, AppLanguage, ImageAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { playAudioNarration, stopAudioNarration } from '../utils/audio';

interface AskQuestionTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'question') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const SAMPLE_QUESTIONS: Record<Subject, string[]> = {
  General: [
    'Why is the sky blue during the day and red during sunset?',
    'How do mRNA vaccines train the human immune system?',
    'What is the difference between deductive and inductive reasoning?',
  ],
  Mathematics: [
    'Find the limit as x approaches 0 of (sin(3x) / x) and explain why.',
    'How do eigenvalues and eigenvectors geometrically transform a matrix?',
    'Solve the differential equation dy/dx = 2xy with initial condition y(0)=1.',
  ],
  Physics: [
    'Explain how Bernoulli\'s principle and Newton\'s third law explain aircraft lift.',
    'A 2kg projectile is launched at 30 m/s at 45 degrees. Find maximum height and range.',
    'What is the physical interpretation of Maxwell\'s displacement current?',
  ],
  Chemistry: [
    'Explain the mechanism of SN1 vs SN2 nucleophilic substitution reactions.',
    'Why does ice float on liquid water in terms of hydrogen bonding?',
    'Calculate the pH of a 0.05 M acetic acid solution with Ka = 1.8 × 10^-5.',
  ],
  Biology: [
    'How does the sodium-potassium pump maintain resting membrane potential?',
    'Explain the light reactions of photosynthesis vs the Calvin cycle.',
    'What happens during DNA replication when RNA primers are replaced by DNA polymerase I?',
  ],
  'Computer Science': [
    'Explain QuickSort partition algorithm with average vs worst-case Big-O.',
    'What is the difference between TCP and UDP protocols and when to use which?',
    'How does public-key RSA cryptography work mathematically?',
  ],
  History: [
    'What were the primary socio-economic triggers of the French Revolution of 1789?',
    'Analyze the key geopolitical outcomes of the 1648 Peace of Westphalia.',
    'How did the Silk Road influence cultural and technological diffusion?',
  ],
  Literature: [
    'Analyze the symbolism of the green light at the end of Daisy’s dock in The Great Gatsby.',
    'Explain the narrative function of dramatic irony in Sophocles\' Oedipus Rex.',
    'Compare the Romantic ethos of William Wordsworth with Lord Byron.',
  ],
  Economics: [
    'How do central banks use open market operations to control interest rates?',
    'Explain the deadweight loss of monopoly vs perfect competition.',
    'What is the Nash Equilibrium and how does it apply to the Prisoner’s Dilemma?',
  ],
};

export const AskQuestionTab: React.FC<AskQuestionTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [question, setQuestion] = useState('');
  const [detailLevel, setDetailLevel] = useState<'step_by_step' | 'concise' | 'intuitive_analogy'>('step_by_step');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setImage({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSolve = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if ((!q && !image) || isLoading) return;

    if (queryText) {
      setQuestion(queryText);
    }

    setIsLoading(true);
    setSolution(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          educationLevel,
          subject,
          detailLevel,
          language,
          image: image ? { data: image.data, mimeType: image.mimeType } : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to solve question.');
      }

      const data = await res.json();
      setSolution(data.solution);
      onRewardXP(20, 'Problem Solver');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error solving problem';
      setSolution(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!solution) return;
    onSaveItem(question.slice(0, 30) || 'Academic Solution', solution, 'question');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleToggleVoice = async () => {
    if (isSpeaking) {
      stopAudioNarration();
      setIsSpeaking(false);
    } else if (solution) {
      setIsSpeaking(true);
      await playAudioNarration(solution.slice(0, 800));
      setIsSpeaking(false);
    }
  };

  const sampleList = SAMPLE_QUESTIONS[subject] || SAMPLE_QUESTIONS.General;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-indigo-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-400 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Question & Answer Problem Solver
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Enter any homework problem, conceptual question, or upload a photo of your textbook diagram. EduGenie provides direct answers, step-by-step reasoning, formulas, and common pitfalls.
            </p>
          </div>
        </div>

        {/* Preset Samples */}
        <div className="mt-4 pt-4 border-t border-indigo-500/15">
          <p className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Quick questions in {subject}:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleList.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSolve(sample)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-indigo-900/40 border border-slate-700/60 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer text-left line-clamp-1"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Box & Mode Selectors */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Your Academic Question or Problem Statement:
          </label>
          <textarea
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSolve();
              }
            }}
            placeholder="Type your question or homework problem here, or upload an image below (Ctrl+Enter to submit)..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all leading-relaxed"
          />
        </div>

        {/* Uploaded Image Preview */}
        {image && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/40">
            <img src={image.previewUrl} alt="Problem preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{image.name}</p>
              <p className="text-[11px] text-emerald-400">Image attached • Gemini Multimodal Vision Active</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Detail Mode + Image Button + Solve Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Mode:</span>
            {[
              { id: 'step_by_step', label: 'Step-by-Step Derivation' },
              { id: 'concise', label: 'Fast & Direct' },
              { id: 'intuitive_analogy', label: 'Intuitive Analogy' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDetailLevel(mode.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  detailLevel === mode.id
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Upload homework problem photo or diagram"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Attach Image</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSolve()}
            disabled={isLoading || (!question.trim() && !image)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving Problem...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Solve & Explain</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Solution Display Card */}
      {solution && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-bold text-white">Academic Solution & Breakdown</h3>
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
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={solution} />
        </div>
      )}
    </div>
  );
};
