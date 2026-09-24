import React, { useState } from 'react';
import { BookMarked, Sparkles, Download, Copy, Check, Bookmark, RotateCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { EducationLevel, Subject, Flashcard } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteGeneratorTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  onSaveItem: (title: string, content: string, type: 'note' | 'flashcards') => void;
}

export const NoteGeneratorTab: React.FC<NoteGeneratorTabProps> = ({ educationLevel, subject, onSaveItem }) => {
  const [inputTopic, setInputTopic] = useState('');
  const [format, setFormat] = useState<'cornell' | 'revision_cheat_sheet' | 'flashcards' | 'formula_sheet'>('cornell');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const parseFlashcards = (rawText: string): Flashcard[] => {
    const cards: Flashcard[] = [];
    const cardBlocks = rawText.split(/(?:Card\s*\d+:|### Card\s*\d+|Front\s*:)/i);

    for (let i = 0; i < cardBlocks.length; i++) {
      const block = cardBlocks[i];
      const frontMatch = block.match(/(?:\*\*Front|\*Front|Front)[\s\w/]*\*\*?:?\s*(.+?)(?=(?:\*\*Back|\*Back|Back)|$)/is);
      const backMatch = block.match(/(?:\*\*Back|\*Back|Back)[\s\w/]*\*\*?:?\s*(.+?)(?=(?:Card|\*\*Front)|$)/is);

      if (frontMatch && backMatch) {
        cards.push({
          id: `card-${i}`,
          front: frontMatch[1].trim(),
          back: backMatch[1].trim(),
        });
      }
    }

    // Fallback parser if format varied
    if (cards.length === 0) {
      const qaBlocks = rawText.split(/\n(?=Q\d*[:.]|\*\*Q\d*|\d+\.\s*\*\*Q)/i);
      qaBlocks.forEach((b, idx) => {
        const lines = b.split('\n').filter((l) => l.trim());
        if (lines.length >= 2) {
          cards.push({
            id: `card-${idx}`,
            front: lines[0].replace(/^(\d+\.|\*|Q[:.]|\*\*Q[:.]\*\*)\s*/, '').trim(),
            back: lines.slice(1).join('\n').replace(/^(A[:.]|\*\*A[:.]\*\*)\s*/, '').trim(),
          });
        }
      });
    }

    return cards;
  };

  const handleGenerate = async (topicQuery?: string) => {
    const text = (topicQuery || inputTopic).trim();
    if (!text || isLoading) return;

    if (topicQuery) {
      setInputTopic(topicQuery);
    }

    setIsLoading(true);
    setNotes(null);
    setFlashcards([]);
    setIsSaved(false);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);

    try {
      const res = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrText: text,
          format,
          subject,
          educationLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate study notes.');
      }

      const data = await res.json();
      setNotes(data.notes);

      if (format === 'flashcards') {
        const parsed = parseFlashcards(data.notes);
        if (parsed.length > 0) {
          setFlashcards(parsed);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating notes';
      setNotes(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!notes) return;
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edugenie-notes-${inputTopic.slice(0, 20).replace(/\s+/g, '_') || 'study'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (!notes) return;
    onSaveItem(
      `Notes: ${inputTopic.slice(0, 30)}`,
      notes,
      format === 'flashcards' ? 'flashcards' : 'note'
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border border-blue-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 shrink-0">
            <BookMarked className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Smart Study Note & Flashcard Generator
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Transform any subject syllabus, chapter, or topic into Cornell Notes, high-density exam cheat sheets, active-recall flashcard decks, or formula sheets.
            </p>
          </div>
        </div>

        {/* Quick Starters */}
        <div className="mt-4 pt-4 border-t border-blue-500/15 flex flex-wrap gap-2">
          {['Calculus Derivatives & Integrals', 'Mendelian Genetics & Inheritance', 'Macroeconomics Fiscal & Monetary Policy', 'World War II Timeline & Treaties', 'Object-Oriented Design Patterns'].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleGenerate(sample)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-blue-900/40 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Enter Topic, Lecture Transcript, or Syllabus Outline:
          </label>
          <textarea
            rows={4}
            value={inputTopic}
            onChange={(e) => setInputTopic(e.target.value)}
            placeholder="e.g., Photosynthesis light & dark reactions, Microeconomics price elasticity, Newton's Laws of Motion..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all leading-relaxed"
          />
        </div>

        {/* Formats */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Select Note Architecture:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'cornell', name: 'Cornell Notes', desc: 'Cues, Notes & Summary' },
              { id: 'revision_cheat_sheet', name: 'Exam Cheat Sheet', desc: 'High-yield formulas & traps' },
              { id: 'flashcards', name: 'Active Flashcards', desc: 'Flippable Q&A deck' },
              { id: 'formula_sheet', name: 'Formula & Concept Sheet', desc: 'Variables, units & rules' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  format === f.id
                    ? 'bg-blue-900/30 border-blue-500/60 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <p className={`text-xs font-semibold ${format === f.id ? 'text-white' : 'text-slate-300'}`}>{f.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isLoading || !inputTopic.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Structuring Study Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Flashcard Deck Viewer (if flashcards format) */}
      {flashcards.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-blue-400" />
              Interactive Flashcard Study Mode
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Card {currentCardIndex + 1} of {flashcards.length}
            </span>
          </div>

          {/* Card Frame */}
          <div
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            className="relative min-h-[200px] sm:min-h-[220px] p-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 cursor-pointer shadow-xl flex flex-col justify-between transition-all select-none"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold uppercase">
                {isCardFlipped ? 'Answer (Back)' : 'Question (Front)'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <RotateCw className="w-3 h-3" /> Click card to flip
              </span>
            </div>

            <div className="py-4 my-auto text-center">
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                {isCardFlipped ? flashcards[currentCardIndex].back : flashcards[currentCardIndex].front}
              </p>
            </div>

            <div className="text-center text-[11px] text-slate-500">
              Active Recall • Tap space or card to toggle
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentCardIndex === 0}
              onClick={() => {
                setIsCardFlipped(false);
                setCurrentCardIndex((prev) => Math.max(0, prev - 1));
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Card</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="px-4 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-xs font-semibold text-indigo-200 transition-colors"
            >
              Flip Card
            </button>

            <button
              type="button"
              disabled={currentCardIndex === flashcards.length - 1}
              onClick={() => {
                setIsCardFlipped(false);
                setCurrentCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <span>Next Card</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generated Full Notes Content */}
      {notes && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              <h3 className="text-base font-bold text-white capitalize">{inputTopic} — Notes</h3>
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
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                title="Download as Markdown file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download .md</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={notes} />
        </div>
      )}
    </div>
  );
};
