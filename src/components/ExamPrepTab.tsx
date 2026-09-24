import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Clock,
  Copy,
  Check,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Loader2,
  Award,
} from 'lucide-react';
import { EducationLevel, Subject, AppLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExamPrepTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

type ExamMode = 'cheat_sheet' | 'flashcards' | 'mock_test' | 'strategy';

const EXAM_PRESETS = [
  { label: 'AP Calculus BC: Derivatives & Series', exam: 'AP Exams', topic: 'Taylor Series, Integration by Parts, L\'Hopital\'s Rule' },
  { label: 'SAT / ACT: Circle Theorems & Quadratic Functions', exam: 'SAT / ACT', topic: 'Circle Equations, Quadratics Vertex Form, Angles' },
  { label: 'General Chemistry: Equilibrium & Le Chatelier', exam: 'University Final', topic: 'Chemical Equilibrium, ICE Tables, Le Chatelier\'s Principle' },
  { label: 'AP Biology: Photosynthesis & Respiration', exam: 'AP Exams', topic: 'Light Reactions, Krebs Cycle, Chemiosmosis' },
  { label: 'Microeconomics: Market Structures', exam: 'University Midterm', topic: 'Perfect Competition, Monopoly, Deadweight Loss' },
];

export const ExamPrepTab: React.FC<ExamPrepTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [examType, setExamType] = useState('University Midterm / Final');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ExamMode>('cheat_sheet');
  const [isLoading, setIsLoading] = useState(false);
  const [prepMaterial, setPrepMaterial] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleApplyPreset = (p: typeof EXAM_PRESETS[0]) => {
    setExamType(p.exam);
    setTopic(p.topic);
  };

  const handleGeneratePrep = async (customTopic?: string) => {
    const activeTopic = (customTopic || topic).trim();
    if (!activeTopic || isLoading) return;

    if (customTopic) {
      setTopic(customTopic);
    }

    setIsLoading(true);
    setPrepMaterial(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/exam-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          topic: activeTopic,
          mode,
          educationLevel,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate exam prep.');
      }

      const data = await res.json();
      setPrepMaterial(data.prepMaterial);
      onRewardXP(30, 'Exam Preparation Completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating exam materials';
      setPrepMaterial(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!prepMaterial) return;
    navigator.clipboard.writeText(prepMaterial);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!prepMaterial) return;
    const title = `Exam Prep (${examType}): ${topic.slice(0, 30)}`;
    onSaveItem(title, prepMaterial, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-slate-900 border border-amber-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-400/30 text-amber-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">Exam Preparation & High-Yield Mastery</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                Cheat Sheets • Flashcards • Mock Tests
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Targeted revision for AP, SAT, GRE, and University exams. Generate high-yield formula sheets, active recall flashcards, and rubrics.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-amber-500/15">
          <span className="text-xs text-slate-400 font-medium">Quick exam drills:</span>
          {EXAM_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input & Mode Settings */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Exam Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Exam Format:
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
            >
              <option value="AP Exams (Advanced Placement)">AP Exams (Advanced Placement)</option>
              <option value="SAT / ACT College Admissions">SAT / ACT College Admissions</option>
              <option value="GRE / GMAT Graduate Exams">GRE / GMAT Graduate Exams</option>
              <option value="GCSE / A-Levels">GCSE / A-Levels</option>
              <option value="University Midterm / Final">University Midterm / Final</option>
              <option value="High School General Exam">High School General Exam</option>
            </select>
          </div>

          {/* Prep Mode Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Preparation Mode:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'cheat_sheet', label: 'Cheat Sheet', icon: FileSpreadsheet },
                { id: 'flashcards', label: 'Flashcards', icon: Layers },
                { id: 'mock_test', label: 'Mock Test', icon: HelpCircle },
                { id: 'strategy', label: '72h Strategy', icon: Clock },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id as ExamMode)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Exam Syllabus, Unit, or Topic:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrep()}
              placeholder="e.g., Organic Reaction Mechanisms, Macroeconomics Monetary Policy, Thermodynamics..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button
              type="button"
              onClick={() => handleGeneratePrep()}
              disabled={isLoading || !topic.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Materials...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Exam Prep</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {prepMaterial && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white capitalize">
                {topic} — {examType} ({mode.replace('_', ' ').toUpperCase()})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save to Notebook'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={prepMaterial} />
        </div>
      )}
    </div>
  );
};
