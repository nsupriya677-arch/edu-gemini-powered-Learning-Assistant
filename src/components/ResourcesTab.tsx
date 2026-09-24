import React, { useState } from 'react';
import { Library, Sparkles, ExternalLink, BookOpen, Video, Code2, Globe, Bookmark, Copy, Check, Loader2 } from 'lucide-react';
import { EducationLevel, Subject } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ResourcesTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  onSaveItem: (title: string, content: string, type: 'note') => void;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ educationLevel, subject, onSaveItem }) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const curatedPortals = [
    {
      name: 'MIT OpenCourseWare',
      category: 'University Lectures',
      url: 'https://ocw.mit.edu',
      desc: 'Free lecture notes, exams, and videos from MIT.',
      icon: BookOpen,
    },
    {
      name: 'Khan Academy',
      category: 'K-12 & College',
      url: 'https://www.khanacademy.org',
      desc: 'Interactive exercises and mastery video guides.',
      icon: Video,
    },
    {
      name: 'PhET Interactive Simulations',
      category: 'STEM Simulations',
      url: 'https://phet.colorado.edu',
      desc: 'Physics, chemistry, and math game-like visualizers.',
      icon: Globe,
    },
    {
      name: '3Blue1Brown',
      category: 'Visual Math & Science',
      url: 'https://www.3blue1brown.com',
      desc: 'Intuitive animated mathematics and machine learning.',
      icon: Video,
    },
  ];

  const handleFetchResources = async (queryTopic?: string) => {
    const text = (queryTopic || topic).trim();
    if (!text || isLoading) return;

    if (queryTopic) {
      setTopic(queryTopic);
    }

    setIsLoading(true);
    setResources(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/learning-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: text,
          subject,
          educationLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to curate resources.');
      }

      const data = await res.json();
      setResources(data.resources);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching learning resources';
      setResources(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resources) return;
    navigator.clipboard.writeText(resources);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!resources) return;
    onSaveItem(`Resources: ${topic}`, resources, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-900/40 via-pink-900/30 to-slate-900/50 border border-rose-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-400/30 text-rose-400 shrink-0">
            <Library className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Curated Academic Library & Resources
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Discover vetted textbooks, open-source courses, interactive virtual labs, and problem repositories hand-tailored for your syllabus.
            </p>
          </div>
        </div>

        {/* Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-rose-500/15">
          {curatedPortals.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <a
                key={idx}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-rose-300 mb-1">
                  <span>{portal.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-rose-400" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">{portal.desc}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Topic to Curate Resources For:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchResources()}
              placeholder="e.g., Quantum Mechanics, Deep Learning, Organic Chemistry synthesis, World History..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
            />
            <button
              type="button"
              onClick={() => handleFetchResources()}
              disabled={isLoading || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Curate Resources</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Topics */}
        <div className="flex flex-wrap gap-2 pt-1">
          {['Linear Algebra & Matrices', 'Genetics & CRISPR', 'Data Structures & Algorithms', 'Classical Electrodynamics', 'Behavioral Economics'].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleFetchResources(item)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {resources && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              <h3 className="text-base font-bold text-white capitalize">{topic} — Recommended Resources</h3>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={resources} />
        </div>
      )}
    </div>
  );
};
