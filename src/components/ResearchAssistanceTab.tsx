import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  FlaskConical,
  Scale,
  Quote,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Loader2,
  FileText,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ResearchAssistanceTabProps {
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

type ResearchMode = 'literature_review' | 'hypothesis' | 'counter_arguments' | 'citations';

const RESEARCH_PRESETS = [
  { label: 'Impact of Generative AI on Secondary Education', mode: 'literature_review' as ResearchMode, level: 'undergraduate' },
  { label: 'Microplastics Bioaccumulation in Marine Food Webs', mode: 'hypothesis' as ResearchMode, level: 'undergraduate' },
  { label: 'Universal Basic Income & Labor Market Dynamics', mode: 'counter_arguments' as ResearchMode, level: 'graduate' },
  { label: 'CRISPR Gene Therapy: Ethical Governance Frameworks', mode: 'literature_review' as ResearchMode, level: 'graduate' },
];

export const ResearchAssistanceTab: React.FC<ResearchAssistanceTabProps> = ({
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ResearchMode>('literature_review');
  const [academicLevel, setAcademicLevel] = useState('undergraduate');
  const [citationStyle, setCitationStyle] = useState('APA 7th Edition');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleApplyPreset = (p: typeof RESEARCH_PRESETS[0]) => {
    setTopic(p.label);
    setMode(p.mode);
    setAcademicLevel(p.level);
  };

  const handleRunResearch = async (customTopic?: string) => {
    const activeTopic = (customTopic || topic).trim();
    if (!activeTopic || isLoading) return;

    if (customTopic) {
      setTopic(customTopic);
    }

    setIsLoading(true);
    setReport(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/research-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          mode,
          academicLevel,
          citationStyle,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to conduct academic research synthesis.');
      }

      const data = await res.json();
      setReport(data.researchReport);
      onRewardXP(30, 'Academic Research Completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error conducting research synthesis';
      setReport(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!report) return;
    const title = `Research: ${topic.slice(0, 30)}`;
    onSaveItem(title, report, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900 border border-blue-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">AI-Based Research Assistance</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                Literature Reviews • Hypotheses • Citations
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Formulate defensible thesis statements, synthesize academic schools of thought, explore counter-arguments, and format citations.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-blue-500/15">
          <span className="text-xs text-slate-400 font-medium">Explore research inquiries:</span>
          {RESEARCH_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration & Input */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Academic Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Academic Depth:
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="high_school">High School AP / IB</option>
              <option value="undergraduate">Undergraduate Degree</option>
              <option value="graduate">Graduate / Master's / PhD</option>
            </select>
          </div>

          {/* Citation Format */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Citation Standard:
            </label>
            <select
              value={citationStyle}
              onChange={(e) => setCitationStyle(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            >
              <option value="APA 7th Edition">APA 7th Edition</option>
              <option value="MLA 9th Edition">MLA 9th Edition</option>
              <option value="Chicago Manual (Author-Date)">Chicago Manual</option>
              <option value="Harvard Referencing">Harvard Referencing</option>
              <option value="BibTeX / LaTeX">BibTeX / LaTeX</option>
            </select>
          </div>

          {/* Research Mode */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Research Objective:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'literature_review', label: 'Lit Review', icon: BookOpen },
                { id: 'hypothesis', label: 'Hypothesis', icon: FlaskConical },
                { id: 'counter_arguments', label: 'Counters', icon: Scale },
                { id: 'citations', label: 'Citations', icon: Quote },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id as ResearchMode)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Research Question, Hypothesis, or Inquiry Draft:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunResearch()}
              placeholder="e.g., How does high-frequency trading affect market volatility in emerging economies?"
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              type="button"
              onClick={() => handleRunResearch()}
              disabled={isLoading || !topic.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Research</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {report && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold text-white capitalize">
                {topic} — Academic Research Report
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save to Notebook'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={report} />
        </div>
      )}
    </div>
  );
};
