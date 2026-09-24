import React from 'react';
import { Sparkles, GraduationCap, BookOpen, Bookmark, Globe, Info, Zap, ChevronDown } from 'lucide-react';
import { EducationLevel, Subject, AppLanguage, GamificationState } from '../types';

interface NavbarProps {
  educationLevel: EducationLevel;
  setEducationLevel: (level: EducationLevel) => void;
  subject: Subject;
  setSubject: (subj: Subject) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  savedCount: number;
  gamification: GamificationState;
  onOpenNotebook: () => void;
  onOpenSummary: () => void;
}

const levelLabels: Record<EducationLevel, string> = {
  elementary: 'Grade 1-5 (Elementary)',
  middle_school: 'Grade 6-8 (Middle School)',
  high_school: 'Grade 9-12 (High School)',
  undergraduate: 'College / University',
  graduate: 'Graduate / Professional',
};

const subjects: Subject[] = [
  'General',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Literature',
  'Economics',
];

const languages: AppLanguage[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Mandarin',
  'Japanese',
  'Arabic',
  'Portuguese',
];

export const Navbar: React.FC<NavbarProps> = ({
  educationLevel,
  setEducationLevel,
  subject,
  setSubject,
  language,
  setLanguage,
  savedCount,
  gamification,
  onOpenNotebook,
  onOpenSummary,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  EduGenie
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  AI Study Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Powered by Google Gemini Generative AI
              </p>
            </div>
          </div>

          {/* Center: Gamification Stats */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-amber-400">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Lvl {gamification.level}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">{gamification.xp} XP</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">🔥 {gamification.streakDays}d Streak</span>
          </div>

          {/* Controls: Language, Subject, Education Level, Notebook, Architecture */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none hidden sm:block" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                className="text-xs font-medium bg-slate-900 border border-slate-700/70 text-slate-200 rounded-lg pl-2 sm:pl-8 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                title="Output Language"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Subject Selector */}
            <div className="relative flex items-center">
              <BookOpen className="absolute left-2.5 w-3.5 h-3.5 text-indigo-400 pointer-events-none hidden md:block" />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="text-xs font-medium bg-slate-900 border border-slate-700/70 text-slate-200 rounded-lg pl-2 md:pl-8 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                title="Academic Subject"
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Academic Level */}
            <div className="relative flex items-center">
              <GraduationCap className="absolute left-2.5 w-3.5 h-3.5 text-purple-400 pointer-events-none hidden md:block" />
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                className="text-xs font-medium bg-slate-900 border border-slate-700/70 text-slate-200 rounded-lg pl-2 md:pl-8 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors max-w-[130px] sm:max-w-none truncate"
                title="Academic Level"
              >
                {Object.entries(levelLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Notebook Button */}
            <button
              onClick={onOpenNotebook}
              type="button"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all group cursor-pointer"
              title="Saved Study Notebook"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Notebook</span>
              {savedCount > 0 && (
                <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-indigo-500 text-[10px] font-bold text-white ml-0.5">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Architecture Overview Trigger */}
            <button
              onClick={onOpenSummary}
              type="button"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="View EduGenie Project Architecture & Specifications"
            >
              <Info className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
