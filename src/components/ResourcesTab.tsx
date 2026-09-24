import React, { useState } from 'react';
import {
  Library,
  Sparkles,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  Bookmark,
  Copy,
  Check,
  Search,
  Youtube,
  Globe,
  Loader2,
} from 'lucide-react';
import { EducationLevel, Subject, AppLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ResourcesTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const FEATURED_PORTALS = [
  {
    name: 'Khan Academy',
    type: 'Videos & Practice',
    url: 'https://www.khanacademy.org',
    desc: 'Mastery videos and interactive practice exercises for all grades.',
    icon: Video,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
  },
  {
    name: 'MIT OpenCourseWare',
    type: 'Lectures & Notes',
    url: 'https://ocw.mit.edu',
    desc: 'Free university syllabus, full lecture video series, and problem sets.',
    icon: BookOpen,
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/30',
  },
  {
    name: '3Blue1Brown',
    type: 'Animated Visualizations',
    url: 'https://www.3blue1brown.com',
    desc: 'Geometric and intuitive explanations for mathematics and physics.',
    icon: Video,
    color: 'text-sky-400 border-sky-500/30 bg-sky-950/30',
  },
  {
    name: 'PhET Interactive Simulations',
    type: 'Virtual Science Labs',
    url: 'https://phet.colorado.edu',
    desc: 'Interactive simulations for physics, chemistry, biology, and math.',
    icon: Globe,
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/30',
  },
];

const PRESET_TOPICS: Record<Subject, string[]> = {
  General: ['Scientific Method & Critical Thinking', 'Cognitive Biases', 'History of Technology'],
  Mathematics: ['Calculus & Differential Equations', 'Linear Algebra & Eigenvalues', 'Probability & Bayesian Statistics'],
  Physics: ['Classical Mechanics & Momentum', 'Electromagnetism & Maxwell Equations', 'Quantum Mechanics & Wavepackets'],
  Chemistry: ['Chemical Bonding & Molecular Orbitals', 'Thermodynamics & Enthalpy', 'Organic Reaction Mechanisms'],
  Biology: ['Cellular Respiration & Krebs Cycle', 'DNA Replication & CRISPR', 'Evolutionary Genetics'],
  'Computer Science': ['Data Structures & Graph Algorithms', 'Machine Learning Foundations', 'Computer Architecture & OS'],
  History: ['The Renaissance & Scientific Revolution', 'World War II Diplomacy & Battles', 'The Industrial Revolution'],
  Literature: ['Shakespearean Tragedies', 'Literary Modernism & Postmodernism', 'Narrative Poetics & Symbolism'],
  Economics: ['Microeconomics: Supply, Demand & Elasticity', 'Macroeconomics: Monetary Policy & Inflation', 'Game Theory'],
};

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [topic, setTopic] = useState('');
  const [resourceFocus, setResourceFocus] = useState<'all' | 'videos' | 'articles' | 'books'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleFetchRecommendations = async (customTopic?: string) => {
    const activeTopic = (customTopic || topic).trim();
    if (!activeTopic || isLoading) return;

    if (customTopic) {
      setTopic(customTopic);
    }

    setIsLoading(true);
    setRecommendations(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/learning-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          resourceType: resourceFocus,
          subject,
          educationLevel,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to curate learning recommendations.');
      }

      const data = await res.json();
      setRecommendations(data.resources);
      onRewardXP(25, 'Resource Exploration');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error retrieving recommendations';
      setRecommendations(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!recommendations) return;
    navigator.clipboard.writeText(recommendations);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!recommendations) return;
    onSaveItem(`Resources: ${topic}`, recommendations, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const currentTopic = topic.trim() || 'Physics & Mathematics';
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(currentTopic + ' tutorial lecture')}`;
  const googleScholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(currentTopic)}`;
  const openLibraryUrl = `https://openlibrary.org/search?q=${encodeURIComponent(currentTopic)}`;

  const presetList = PRESET_TOPICS[subject] || PRESET_TOPICS.General;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-900/40 via-pink-900/30 to-slate-900/50 border border-rose-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-400/30 text-rose-400 shrink-0">
            <Library className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">Learning Recommendations</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                Videos • Articles • Books
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Discover top-rated educational videos, authoritative articles, peer-reviewed papers, and benchmark textbooks handpicked for your exact topic and level.
            </p>
          </div>
        </div>

        {/* Featured Educational Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-rose-500/15">
          {FEATURED_PORTALS.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <a
                key={idx}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer group ${portal.color}`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{portal.name}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{portal.desc}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Input Box & Format Controls */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Topic or Subject to Recommend Resources For:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchRecommendations()}
              placeholder="e.g., Quantum Mechanics, Deep Learning, Organic Chemistry synthesis, World History..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
            />
            <button
              type="button"
              onClick={() => handleFetchRecommendations()}
              disabled={isLoading || !topic.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Curating Recommendations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Get Recommendations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Topic Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 font-medium">Quick ideas in {subject}:</span>
          {presetList.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleFetchRecommendations(item)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-white transition-all cursor-pointer line-clamp-1"
            >
              {item}
            </button>
          ))}
        </div>

        {/* External Quick Searches for Active Topic */}
        {topic.trim() && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">Live search web for "{topic}":</span>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-medium transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Search YouTube Videos</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={googleScholarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-medium transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Google Scholar Articles</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={openLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Library Books</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Result Display Card */}
      {recommendations && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              <h3 className="text-base font-bold text-white capitalize">
                {topic} — Curated Learning Recommendations
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={recommendations} />
        </div>
      )}
    </div>
  );
};
