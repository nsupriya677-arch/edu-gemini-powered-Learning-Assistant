import React, { useState } from 'react';
import {
  Code2,
  Bug,
  Lightbulb,
  Zap,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Loader2,
  Cpu,
} from 'lucide-react';
import { EducationLevel, AppLanguage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CodingAssistanceTabProps {
  educationLevel: EducationLevel;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

type CodeTask = 'explain' | 'debug' | 'optimize' | 'solve' | 'tests';

const PROGRAMMING_LANGUAGES = [
  { id: 'python', label: 'Python 3' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'sql', label: 'SQL' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
];

const CODE_PRESETS = [
  {
    label: 'Two Sum (Hash Map)',
    lang: 'python',
    task: 'optimize' as CodeTask,
    code: `def two_sum(nums, target):
    # Brute force O(n^2) approach
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
    problem: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Optimize from O(n^2) to O(n).',
  },
  {
    label: 'Buggy Binary Search',
    lang: 'python',
    task: 'debug' as CodeTask,
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) # potential off-by-one bug
    while low < high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid # infinite loop bug
        else:
            high = mid - 1
    return -1`,
    problem: 'Fix infinite loop and off-by-one boundary bugs in this binary search implementation.',
  },
  {
    label: 'Fibonacci Memoization',
    lang: 'javascript',
    task: 'explain' as CodeTask,
    code: `function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`,
    problem: 'Explain how top-down dynamic programming with memoization reduces complexity from O(2^n) to O(n).',
  },
  {
    label: 'SQL Window Ranking',
    lang: 'sql',
    task: 'explain' as CodeTask,
    code: `SELECT 
    department_id,
    employee_name,
    salary,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank
FROM employees;`,
    problem: 'Explain window functions, PARTITION BY, and the difference between RANK() and DENSE_RANK().',
  },
];

export const CodingAssistanceTab: React.FC<CodingAssistanceTabProps> = ({
  educationLevel,
  language: appLanguage,
  onSaveItem,
  onRewardXP,
}) => {
  const [selectedLang, setSelectedLang] = useState('python');
  const [task, setTask] = useState<CodeTask>('explain');
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleApplyPreset = (preset: typeof CODE_PRESETS[0]) => {
    setSelectedLang(preset.lang);
    setTask(preset.task);
    setCode(preset.code);
    setProblem(preset.problem);
  };

  const handleRunCodeAssistant = async () => {
    if ((!code.trim() && !problem.trim()) || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/code-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          task,
          code,
          problem,
          educationLevel,
          appLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to process coding query.');
      }

      const data = await res.json();
      setResult(data.result);
      onRewardXP(30, 'Coding Assistance Completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing code assistant';
      setResult(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!result) return;
    const title = `Code (${selectedLang}): ${problem.slice(0, 30) || task}`;
    onSaveItem(title, result, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900 border border-emerald-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-400 shrink-0">
            <Terminal className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">Coding & Programming Assistance</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Debug • Explain • Optimize • Tests
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Debug errors, inspect algorithms step-by-step, optimize Big-O complexity, and generate unit tests across 8 programming languages.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-emerald-500/15">
          <span className="text-xs text-slate-400 font-medium">Try classic problems:</span>
          {CODE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Task Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Programming Language:
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-mono"
            >
              {PROGRAMMING_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Task Action Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Assistance Goal:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'explain', label: 'Explain', icon: Lightbulb },
                { id: 'debug', label: 'Debug', icon: Bug },
                { id: 'optimize', label: 'Optimize', icon: Zap },
                { id: 'solve', label: 'Solve', icon: Code2 },
                { id: 'tests', label: 'Tests', icon: CheckCircle2 },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = task === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTask(t.id as CodeTask)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-1" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Problem or Requirement Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Problem Description or Goal:
          </label>
          <input
            type="text"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g., Given a sorted array, write a function to remove duplicates in-place..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Code Input Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Code Snippet:
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              {selectedLang.toUpperCase()}
            </span>
          </div>
          <textarea
            rows={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Paste your ${selectedLang} code here to analyze, debug, or optimize...`}
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 font-mono text-xs sm:text-sm text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleRunCodeAssistant}
            disabled={isLoading || (!code.trim() && !problem.trim())}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Code...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Coding Assistant</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Coding Assistant Result ({selectedLang.toUpperCase()})
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save to Notebook'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={result} />
        </div>
      )}
    </div>
  );
};
