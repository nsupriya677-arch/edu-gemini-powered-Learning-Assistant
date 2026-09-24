import React, { useState } from 'react';
import { Calendar, Sparkles, CheckSquare, Square, Clock, Target, Bookmark, Copy, Check, Loader2 } from 'lucide-react';
import { EducationLevel, Subject } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudyPlanTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  onSaveItem: (title: string, content: string, type: 'study_plan') => void;
}

export const StudyPlanTab: React.FC<StudyPlanTabProps> = ({ educationLevel, subject, onSaveItem }) => {
  const [goal, setGoal] = useState('');
  const [timeframeDays, setTimeframeDays] = useState<number>(14);
  const [hoursPerDay, setHoursPerDay] = useState<number>(2);
  const [currentLevel, setCurrentLevel] = useState<'beginner' | 'intermediate' | 'revision'>('intermediate');
  const [learningStyle, setLearningStyle] = useState<'active_recall' | 'balanced' | 'deep_dives'>('active_recall');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Parsed interactive checklist items
  const [checklist, setChecklist] = useState<{ id: number; text: string; done: boolean }[]>([]);

  const extractMilestones = (rawText: string) => {
    const lines = rawText.split('\n');
    const tasks: { id: number; text: string; done: boolean }[] = [];
    let counter = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        (trimmed.startsWith('- [ ]') || trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) &&
        (trimmed.toLowerCase().includes('day ') ||
          trimmed.toLowerCase().includes('week ') ||
          trimmed.toLowerCase().includes('phase ') ||
          trimmed.toLowerCase().includes('review') ||
          trimmed.toLowerCase().includes('master') ||
          trimmed.toLowerCase().includes('complete') ||
          trimmed.toLowerCase().includes('practice'))
      ) {
        const clean = trimmed
          .replace(/^- \[[ x]\]\s*/i, '')
          .replace(/^(\d+\.|\-|\*)\s*/, '')
          .replace(/[*_]/g, '')
          .trim();

        if (clean.length > 8 && clean.length < 120) {
          tasks.push({ id: counter++, text: clean, done: false });
        }
      }
    }

    setChecklist(tasks.slice(0, 8));
  };

  const handleGenerate = async (presetGoal?: string) => {
    const text = (presetGoal || goal).trim();
    if (!text || isLoading) return;

    if (presetGoal) {
      setGoal(presetGoal);
    }

    setIsLoading(true);
    setPlan(null);
    setChecklist([]);
    setIsSaved(false);

  try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: text,
          timeframeDays,
          hoursPerDay,
          subject,
          educationLevel,
          currentLevel,
          learningStyle,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate study plan.');
      }

      const data = await res.json();
      setPlan(data.plan);
      extractMilestones(data.plan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating study plan';
      setPlan(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleCopy = () => {
    if (!plan) return;
    navigator.clipboard.writeText(plan);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!plan) return;
    onSaveItem(`Study Plan: ${goal.slice(0, 30)}`, plan, 'study_plan');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const completedCount = checklist.filter((i) => i.done).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900/40 via-cyan-900/30 to-slate-900/50 border border-teal-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600/30 border border-teal-400/30 text-teal-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Personalized Study Plan & Timetable Architect
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Build a science-backed roadmap for upcoming exams or self-study goals using active recall, spaced repetition, and milestone checklists.
            </p>
          </div>
        </div>

        {/* Quick Goal Presets */}
        <div className="mt-4 pt-4 border-t border-teal-500/15 flex flex-wrap gap-2">
          {[
            'Ace AP Calculus BC in 3 weeks',
            'Master Data Structures & Algorithms for interviews in 30 days',
            'Prepare for High School Chemistry Midterms in 10 days',
            'Learn Microeconomics fundamentals from scratch in 14 days',
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleGenerate(preset)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/40 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Goal Input & Timing Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Exam or Study Goal:
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g., Score 90%+ on University Linear Algebra Final, Master Molecular Genetics..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Timeframe */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Time Available:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[7, 14, 30, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeframeDays(days)}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    timeframeDays === days
                      ? 'bg-teal-600/30 border-teal-500 text-teal-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Daily hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Hours / Day:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 5].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setHoursPerDay(hrs)}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    hoursPerDay === hrs
                      ? 'bg-teal-600/30 border-teal-500 text-teal-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>

          {/* Current Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-teal-400" />
              Current State:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'beginner', label: 'Fresh' },
                { id: 'intermediate', label: 'Midway' },
                { id: 'revision', label: 'Review' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setCurrentLevel(lvl.id as any)}
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    currentLevel === lvl.id
                      ? 'bg-teal-600/30 border-teal-500 text-teal-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl.label}
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
            disabled={isLoading || !goal.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Designing Study Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Study Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Milestone Checklist */}
      {checklist.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-400" />
              Interactive Study Milestones ({completedCount}/{checklist.length})
            </h3>
            <span className="text-xs font-mono font-bold text-teal-400">{progressPercent}% Completed</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  item.done
                    ? 'bg-teal-950/40 border-teal-500/50 text-slate-400 line-through'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
              >
                {item.done ? (
                  <CheckSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Plan Markdown Display */}
      {plan && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500" />
              <h3 className="text-base font-bold text-white">Full Personalized Study Roadmap</h3>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save Plan'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={plan} />
        </div>
      )}
    </div>
  );
};
