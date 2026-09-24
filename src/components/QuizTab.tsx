import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  FileText,
  Target,
  Bookmark,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EducationLevel, Subject, AppLanguage, QuizData, QuizQuestion } from '../types';

interface QuizTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const SAMPLE_PASSAGES = [
  {
    title: 'Biology: Cellular Respiration & Mitochondria',
    text: `Cellular respiration is a metabolic pathway that breaks down glucose and produces adenosine triphosphate (ATP). The stages of cellular respiration include glycolysis, pyruvate oxidation, the citric acid cycle (Krebs cycle), and oxidative phosphorylation. Glycolysis takes place in the cytosol of the cell and does not require oxygen. In contrast, the citric acid cycle and oxidative phosphorylation occur inside the mitochondria and are aerobic processes. During oxidative phosphorylation, electrons travel through the electron transport chain in the inner mitochondrial membrane, generating a proton gradient that drives ATP synthase to produce the vast majority of cellular ATP.`,
  },
  {
    title: 'Physics: Newton\'s Laws & Momentum',
    text: `Sir Isaac Newton formulated three fundamental laws of motion. The first law, the law of inertia, states that an object at rest remains at rest, and an object in uniform motion continues in motion unless acted upon by a net external force. The second law defines force as the time rate of change of momentum (F = dp/dt), which simplifies to F = ma for constant mass. The third law establishes that whenever one body exerts a force on a second body, the second body simultaneously exerts an equal and opposite force on the first body. These principles form the cornerstone of classical Newtonian mechanics.`,
  },
  {
    title: 'Computer Science: Hash Tables & Collisions',
    text: `A hash table is a data structure that implements an associative array abstract data type, mapping keys to values using a hash function. A good hash function uniformly distributes keys across the array buckets, yielding O(1) average time complexity for insertions, deletions, and lookups. However, when two distinct keys produce the same hash index, a collision occurs. Two primary strategies exist for collision resolution: separate chaining (where each bucket holds a linked list or tree of colliding entries) and open addressing (such as linear probing, quadratic probing, or double hashing, which search for alternative empty slots within the table array).`,
  },
];

const SAMPLE_TOPICS = [
  'Mitochondria & Cellular Respiration',
  'Newton\'s Laws of Motion',
  'Supply and Demand Elasticity',
  'Binary Search Trees & Big-O',
  'The French Revolution (1789)',
  'Plate Tectonics & Continental Drift',
];

export const QuizTab: React.FC<QuizTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  // Input Mode: 'topic' | 'passage'
  const [mode, setMode] = useState<'topic' | 'passage'>('topic');
  const [topic, setTopic] = useState('');
  const [passage, setPassage] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // Active quiz state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateQuiz = async (customTopic?: string, customPassage?: string) => {
    const activeTopic = (customTopic || topic).trim();
    const activePassage = (customPassage || passage).trim();

    if (mode === 'topic' && !activeTopic) return;
    if (mode === 'passage' && !activePassage) return;
    if (isLoading) return;

    if (customTopic) setTopic(customTopic);
    if (customPassage) setPassage(customPassage);

    setIsLoading(true);
    setQuizData(null);
    setCurrentQuestionIdx(0);
    setSelectedOptions({});
    setRevealedHints({});
    setIsQuizCompleted(false);
    setIsReviewOpen(false);
    setIsSaved(false);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: mode === 'topic' ? activeTopic : undefined,
          passage: mode === 'passage' ? activePassage : undefined,
          questionCount: 3, // Strictly 3 MCQs as specified
          difficulty,
          subject,
          educationLevel,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate 3-MCQ quiz.');
      }

      const data: QuizData = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No quiz questions returned from Gemini.');
      }

      setQuizData(data);
    } catch (err: unknown) {
      alert(`Quiz Error: ${err instanceof Error ? err.message : 'Could not generate quiz'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (selectedOptions[questionIdx] !== undefined) return; // already locked

    const updated = { ...selectedOptions, [questionIdx]: optionIdx };
    setSelectedOptions(updated);

    // If all 3 questions answered, trigger completion
    if (quizData && Object.keys(updated).length === quizData.questions.length) {
      calculateFinish(updated);
    }
  };

  const calculateFinish = (answers: Record<number, number>) => {
    if (!quizData) return;
    let score = 0;
    quizData.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });

    const percent = Math.round((score / quizData.questions.length) * 100);
    if (percent >= 66) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    setIsQuizCompleted(true);
    onRewardXP(score * 15 + 10, '3-MCQ Mastery');
  };

  const toggleHint = (questionIdx: number) => {
    setRevealedHints((prev) => ({ ...prev, [questionIdx]: !prev[questionIdx] }));
  };

  const currentQ: QuizQuestion | undefined = quizData?.questions[currentQuestionIdx];
  const isAnswered = currentQ && selectedOptions[currentQuestionIdx] !== undefined;

  const totalQuestions = quizData?.questions.length || 3;
  const correctCount = quizData
    ? quizData.questions.filter((q, i) => selectedOptions[i] === q.correctAnswerIndex).length
    : 0;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleSaveToNotebook = () => {
    if (!quizData) return;
    const markdownContent = `# 📝 Quiz: ${quizData.title || quizData.topic}\n\n` +
      quizData.questions
        .map(
          (q, idx) =>
            `### Q${idx + 1}: ${q.question}\n` +
            q.options.map((opt, optIdx) => `- [${optIdx === q.correctAnswerIndex ? 'x' : ' '}] ${String.fromCharCode(65 + optIdx)}) ${opt}`).join('\n') +
            `\n\n**Correct Answer**: Option ${String.fromCharCode(65 + q.correctAnswerIndex)}\n**Explanation**: ${q.explanation}\n`
        )
        .join('\n---\n\n');

    onSaveItem(`Quiz: ${quizData.topic || '3 MCQs'}`, markdownContent, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCopyMarkdown = () => {
    if (!quizData) return;
    const text = quizData.questions
      .map(
        (q, idx) =>
          `Q${idx + 1}: ${q.question}\n` +
          q.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n') +
          `\nAnswer: ${String.fromCharCode(65 + q.correctAnswerIndex)}\nExplanation: ${q.explanation}\n`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-slate-900/50 border border-amber-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-400/30 text-amber-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">Quiz Generation</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                3 MCQs • 4 Options (A, B, C, D)
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Generate 3 targeted multiple-choice questions from any educational <strong>topic</strong> or <strong>passage</strong>. Each question features 4 plausible options, hints, instant feedback, and detailed explanations.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Input Form (Topic or Passage) */}
      {!quizData && (
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
          {/* Dual Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('topic')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'topic'
                  ? 'bg-amber-600/30 border border-amber-500/50 text-amber-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span>Generate from Topic</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('passage')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'passage'
                  ? 'bg-amber-600/30 border border-amber-500/50 text-amber-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Generate from Passage / Text Excerpt</span>
            </button>
          </div>

          {/* Mode 1: From Topic */}
          {mode === 'topic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Enter Academic Topic:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
                  placeholder="e.g., Cellular Respiration, Newton's Laws, Price Elasticity of Demand, QuickSort..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Sample Topics */}
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick topic ideas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TOPICS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGenerateQuiz(item)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: From Passage */}
          {mode === 'passage' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Paste Reading Passage or Textbook Excerpt:
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {passage.trim() ? `${passage.trim().split(/\s+/).length} words` : '0 words'}
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Paste paragraph, article, paper abstract, or lesson notes here. EduGenie will formulate 3 MCQs with 4 options testing comprehension of this exact text..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all leading-relaxed"
                />
              </div>

              {/* Quick Sample Passages */}
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Insert a sample passage to test:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PASSAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPassage(sample.text)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Difficulty & Submit Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            {/* Difficulty Tier */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
              {[
                { id: 'easy', label: 'Foundational' },
                { id: 'medium', label: 'Standard' },
                { id: 'hard', label: 'Advanced' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    difficulty === d.id
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={() => handleGenerateQuiz()}
              disabled={isLoading || (mode === 'topic' ? !topic.trim() : !passage.trim())}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing 3 MCQs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create 3 MCQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active 3-MCQ Test Card */}
      {quizData && !isQuizCompleted && currentQ && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-6">
          {/* Header & Step Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-amber-300 uppercase tracking-wider truncate max-w-[70%]">
                {quizData.title || quizData.topic}
              </span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                Question {currentQuestionIdx + 1} of {totalQuestions}
              </span>
            </div>

            {/* Stepped Progress Bar */}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((stepIdx) => {
                const isStepAnswered = selectedOptions[stepIdx] !== undefined;
                const isCurrent = currentQuestionIdx === stepIdx;
                return (
                  <div
                    key={stepIdx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isStepAnswered
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-amber-400'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
              {currentQ.subtopic || 'Concept Verification'}
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Hint Trigger */}
          {currentQ.hint && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleHint(currentQuestionIdx)}
                className="flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 font-medium transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{revealedHints[currentQuestionIdx] ? 'Hide Hint' : '💡 Need a hint?'}</span>
              </button>
              {revealedHints[currentQuestionIdx] && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                  💡 <strong>Hint:</strong> {currentQ.hint}
                </div>
              )}
            </div>
          )}

          {/* Exactly 4 Options: A, B, C, D */}
          <div className="space-y-2.5">
            {currentQ.options.map((optionText, optIdx) => {
              const hasAnsweredThisQ = selectedOptions[currentQuestionIdx] !== undefined;
              const isSelected = selectedOptions[currentQuestionIdx] === optIdx;
              const isCorrect = optIdx === currentQ.correctAnswerIndex;

              let styleClasses = 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200';
              if (hasAnsweredThisQ) {
                if (isCorrect) {
                  styleClasses = 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-sm shadow-emerald-500/10 font-medium';
                } else if (isSelected && !isCorrect) {
                  styleClasses = 'bg-rose-950/40 border-rose-500 text-rose-100';
                } else {
                  styleClasses = 'bg-slate-950/40 border-slate-900 opacity-50 text-slate-400';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={hasAnsweredThisQ}
                  onClick={() => handleSelectOption(currentQuestionIdx, optIdx)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer ${styleClasses}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold shrink-0 ${
                        hasAnsweredThisQ && isCorrect
                          ? 'bg-emerald-600 text-white'
                          : hasAnsweredThisQ && isSelected && !isCorrect
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{optionText}</span>
                  </div>

                  {hasAnsweredThisQ && isCorrect && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold shrink-0 ml-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Correct
                    </span>
                  )}
                  {hasAnsweredThisQ && isSelected && !isCorrect && (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold shrink-0 ml-2">
                      <XCircle className="w-5 h-5 text-rose-400" />
                      Incorrect
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Instructive Explanation on Answer */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed animate-in fade-in duration-200">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Explanation & Rationale:
              </p>
              <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 cursor-pointer"
            >
              Previous
            </button>

            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                type="button"
                disabled={!isAnswered}
                onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-all"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!isAnswered}
                onClick={() => setIsQuizCompleted(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              >
                <span>Complete Quiz & View Score</span>
                <Award className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion Report & Review Card */}
      {isQuizCompleted && quizData && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
            <p className="text-xs text-slate-400">
              Topic: <strong className="text-slate-200">{quizData.topic}</strong>
            </p>
          </div>

          {/* Score Badge */}
          <div className="p-5 max-w-sm mx-auto rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
              {scorePercent}%
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {correctCount} of {totalQuestions} Correct
            </p>
            <p className="text-xs text-slate-400">
              {scorePercent === 100
                ? '🌟 Perfect score! Flawless conceptual mastery.'
                : scorePercent >= 66
                ? '👍 Strong performance! Review the questions below to polish edge cases.'
                : '💡 Keep practicing! Review the explanations to build strong intuition.'}
            </p>
          </div>

          {/* Action Buttons: Save, Copy, Retake, New */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSaveToNotebook}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved to Notebook!' : 'Save to Notebook'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy Q&A'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOptions({});
                setCurrentQuestionIdx(0);
                setIsQuizCompleted(false);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuizData(null);
                setTopic('');
                setPassage('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New 3 MCQs</span>
            </button>
          </div>

          {/* Expandable Review of All 3 Questions */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsReviewOpen(!isReviewOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              <span>Review All 3 Questions, Options & Answers</span>
              {isReviewOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isReviewOpen && (
              <div className="mt-3 space-y-4 animate-in fade-in duration-200">
                {quizData.questions.map((q, qIndex) => {
                  const userChoice = selectedOptions[qIndex];
                  const isUserCorrect = userChoice === q.correctAnswerIndex;
                  return (
                    <div key={q.id || qIndex} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-100 text-sm">
                          Q{qIndex + 1}: {q.question}
                        </p>
                        {isUserCorrect ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Correct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            Incorrect
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => {
                          const isOptionCorrect = optIndex === q.correctAnswerIndex;
                          const isOptionChosen = optIndex === userChoice;
                          return (
                            <div
                              key={optIndex}
                              className={`p-2.5 rounded-lg border flex items-center justify-between ${
                                isOptionCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold'
                                  : isOptionChosen
                                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span>
                                <strong>{String.fromCharCode(65 + optIndex)})</strong> {opt}
                              </span>
                              {isOptionCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-900">
                        <strong className="text-amber-300">Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
