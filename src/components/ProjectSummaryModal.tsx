import React from 'react';
import { X, Layers, Code2, Cpu, CheckCircle2, Sparkles, Rocket, Globe, Award, HelpCircle, FileText, BookOpen, Compass } from 'lucide-react';

interface ProjectSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSummaryModal: React.FC<ProjectSummaryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                EduGenie – Architecture & Project Summary
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-normal">
                  Production Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">Intelligent Virtual Learning Assistant Powered by Google Gemini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Executive Overview */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Project Overview & Mission
            </h3>
            <p className="text-xs leading-relaxed text-slate-300">
              <strong>EduGenie</strong> is a lightweight, AI-powered learning assistant designed to help students learn more easily using Generative AI. It can answer questions, explain difficult concepts in simple language, generate quizzes, summarize educational content, and provide personalized learning paths.
            </p>
          </div>

          {/* 5 Core Modules */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> 5 Main System Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>1. Question & Answer</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Answers academic and general questions using Gemini with step-by-step reasoning, formula breakdown, sanity checks, and multimodal image input support.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>2. Explanation</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explains complex topics in simple language using intuitive analogies, the Feynman Technique, ELI5 mode, and interactive self-test checkpoints.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs mb-1">
                  <Award className="w-4 h-4" />
                  <span>3. Quiz Generator</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Creates 3 MCQs with 4 options from given content or topics using strict Gemini JSON schemas, providing hints, instant answer validation, and explanations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs mb-1">
                  <FileText className="w-4 h-4" />
                  <span>4. Summarizer</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Converts lengthy content or uploaded documents into concise, high-retention summaries (bullets, executive briefs, TL;DR, or mind-maps).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 md:col-span-2">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
                  <Compass className="w-4 h-4" />
                  <span>5. Learning Path</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Creates beginner-to-advanced personalized learning recommendations, organizing study into clear stages (Foundations → Intermediate Problem Solving → Advanced Mastery).
                </p>
              </div>
            </div>
          </div>

          {/* System Workflow (4 Stages) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-pink-400" /> 4-Stage System Workflow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {[
                { stage: 'Stage 1', title: 'Model & Architecture', desc: 'Select AI models (Gemini 3.8) and organize the project into separate modular services.' },
                { stage: 'Stage 2', title: 'Core Development', desc: 'Implement explanation, Q&A, quiz, summary, and learning-path backend endpoints.' },
                { stage: 'Stage 3', title: 'Frontend Development', desc: 'Build simple, attractive UI with task selection menu, text input, image drop, and result display.' },
                { stage: 'Stage 4', title: 'Deployment & Testing', desc: 'Run server, test Q&A, explanations, quizzes, summaries, and learning paths across devices.' },
              ].map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">{s.stage}</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{s.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Implemented & Future Enhancements */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Enhancements Integrated in EduGenie
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Voice-based learning (TTS)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Multilingual support (8+ langs)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Image & diagram question answering
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Progress tracking & study streaks
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Gamification (XP, Levels, Badges)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Cornell Notes & Flashcards deck
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <span>EduGenie Virtual Learning Assistant • Powered by Google Gemini</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
