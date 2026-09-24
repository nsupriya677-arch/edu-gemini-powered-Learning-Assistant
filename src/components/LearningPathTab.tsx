import React, { useState } from 'react';
import { Compass, Sparkles, MapPin, CheckCircle, ChevronRight, Copy, Check, Bookmark, Loader2, Flag } from 'lucide-react';
import { EducationLevel, Subject, AppLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface LearningPathTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'learning_path') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const SAMPLE_PATHS: Record<string, string[]> = {
  Mathematics: [
    'Mastering Linear Algebra for Machine Learning',
    'From Algebra to Single-Variable Calculus',
    'Probability Theory & Bayesian Inference',
  ],
  'Computer Science': [
    'Full Stack Web Development Roadmap',
    'Data Structures, Algorithms & LeetCode Mastery',
    'Foundations of Deep Learning and PyTorch',
  ],
  Physics: [
    'Classical Mechanics to Quantum Foundations',
    'Electromagnetism & Circuit Theory',
    'Astrophysics & Stellar Evolution',
  ],
  Chemistry: [
    'Organic Chemistry Reaction Mechanisms',
    'Physical Chemistry & Thermodynamics',
    'Biochemistry & Molecular Biology',
  ],
  General: [
    'Critical Thinking & Cognitive Fallacies',
    'Academic Research Paper Writing & Publishing',
    'Data Literacy & Applied Statistics',
  ],
};

export const LearningPathTab: React.FC<LearningPathTabProps> = ({
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [topic, setTopic] = useState('');
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [targetPace, setTargetPace] = useState<'fast' | 'balanced' | 'thorough'>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const samples = SAMPLE_PATHS[subject] || SAMPLE_PATHS['General'];

  const handleGenerate = async (presetTopic?: string) => {
    const text = (presetTopic || topic).trim();
    if (!text || isLoading) return;

    if (presetTopic) {
      setTopic(presetTopic);
    }

    setIsLoading(true);
    setLearningPath(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrGoal: text,
          subject,
          currentLevel,
          targetPace,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate personalized learning path.');
      }

      const data = await res.json();
      setLearningPath(data.learningPath);
      onRewardXP(30, 'Learning Path Architect');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating roadmap';
      setLearningPath(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!learningPath) return;
    navigator.clipboard.writeText(learningPath);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!learningPath) return;
    onSaveItem(`Path: ${topic}`, learningPath, 'learning_path');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900/50 border border-cyan-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-600/30 border border-cyan-400/30 text-cyan-400 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Personalized Learning Path
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-normal">
                Beginner → Advanced
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Step-by-step personalized curriculum tailored to your starting point. Master any academic field through progressive milestones, hands-on tasks, and capstone challenges.
            </p>
          </div>
        </div>

        {/* Quick Starters */}
        <div className="mt-4 pt-4 border-t border-cyan-500/15">
          <p className="text-xs font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Curated pathways in {subject}:
          </p>
          <div className="flex flex-wrap gap-2">
            {samples.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleGenerate(s)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-900/40 border border-slate-700/60 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Config Form */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            What skill or academic domain do you want a pathway for?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g., Quantum Computing, Organic Chemistry synthesis, Machine Learning, World History..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Starting Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Current Level:</label>
            <div className="flex gap-2">
              {[
                { id: 'beginner', label: '🟢 Absolute Beginner' },
                { id: 'intermediate', label: '🟡 Intermediate' },
                { id: 'advanced', label: '🔴 Advanced' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setCurrentLevel(lvl.id as any)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    currentLevel === lvl.id
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pacing */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Learning Pace:</label>
            <div className="flex gap-2">
              {[
                { id: 'fast', label: '⚡ Fast Track' },
                { id: 'balanced', label: '⚖️ Balanced' },
                { id: 'thorough', label: '🔬 Deep & Thorough' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTargetPace(p.id as any)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    targetPace === p.id
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isLoading || !topic.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Designing Learning Path...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Learning Path</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {learningPath && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <h3 className="text-base font-bold text-white">Curated Beginner-to-Advanced Roadmap</h3>
            </div>
            <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save Path'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={learningPath} />
        </div>
      )}
    </div>
  );
};
