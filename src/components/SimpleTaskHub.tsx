import React, { useState, useRef } from 'react';
import {
  HelpCircle,
  Lightbulb,
  Award,
  FileText,
  Compass,
  Library,
  Sparkles,
  Send,
  Zap,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Bookmark,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  Radio,
  Loader2,
} from 'lucide-react';
import { EducationLevel, Subject, AppLanguage, ImageAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { playAudioNarration, stopAudioNarration } from '../utils/audio';

interface SimpleTaskHubProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'question' | 'note' | 'summary') => void;
  onRewardXP: (xp: number, label: string) => void;
}

type SimpleTaskType = 'ask' | 'concept' | 'quiz' | 'summarize' | 'learning_path' | 'resources';

interface TaskConfig {
  id: SimpleTaskType;
  label: string;
  shortDesc: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
  badge: string;
  samples: string[];
}

const TASKS: TaskConfig[] = [
  {
    id: 'ask',
    label: 'Question & Answer',
    shortDesc: 'Solve academic homework or conceptual problems step-by-step',
    placeholder: 'Enter your math, science, or humanities question here (or upload an image below)...',
    icon: HelpCircle,
    color: 'text-indigo-400',
    activeColor: 'from-indigo-600 to-indigo-700 border-indigo-400',
    badge: 'Problem Solver',
    samples: [
      'Solve the system: 2x + 3y = 12 and x - y = 1.',
      'Explain how Bernoulli\'s principle generates aerodynamic lift.',
      'What were the primary socio-economic causes of the French Revolution?',
    ],
  },
  {
    id: 'concept',
    label: 'Explanation',
    shortDesc: 'Explain difficult topics in simple, intuitive language',
    placeholder: 'Enter a concept you want demystified (e.g. Quantum Superposition, Supply Elasticity, Recursion)...',
    icon: Lightbulb,
    color: 'text-purple-400',
    activeColor: 'from-purple-600 to-purple-700 border-purple-400',
    badge: 'Mental Models',
    samples: [
      'Schrödinger\'s Cat and quantum superposition',
      'The intuition behind Fourier Transform',
      'Opportunity Cost and Comparative Advantage',
    ],
  },
  {
    id: 'quiz',
    label: 'Quiz Generator',
    shortDesc: 'Create 3 MCQs with 4 options (A, B, C, D) from topic or text',
    placeholder: 'Enter a topic or paste a paragraph to generate 3 targeted 4-option multiple choice questions...',
    icon: Award,
    color: 'text-amber-400',
    activeColor: 'from-amber-600 to-amber-700 border-amber-400',
    badge: '3 MCQs',
    samples: [
      'Cellular Respiration and ATP Synthase',
      'Newton\'s Three Laws of Motion',
      'Binary Search Trees and Big-O Time Complexity',
    ],
  },
  {
    id: 'summarize',
    label: 'Text Summarizer',
    shortDesc: 'Distill lengthy passages or articles into concise summaries',
    placeholder: 'Paste long textbook excerpt, paper abstract, or lesson notes to extract key bullet points...',
    icon: FileText,
    color: 'text-emerald-400',
    activeColor: 'from-emerald-600 to-emerald-700 border-emerald-400',
    badge: 'Key Bullets',
    samples: [
      'Photosynthesis is a biological process utilized by plants, algae, and cyanobacteria to convert light energy into chemical energy stored in glucose. The process occurs in two phases: light-dependent reactions where photons split water to make ATP/NADPH, and the Calvin cycle where CO2 is fixed by RuBisCO.',
      'The Industrial Revolution transitioned manufacturing from hand production to machines, increasing coal and iron usage, expanding steam power, and driving rapid urbanization and economic reorganization.',
    ],
  },
  {
    id: 'learning_path',
    label: 'Learning Path',
    shortDesc: 'Personalized beginner-to-advanced curriculum roadmap',
    placeholder: 'Enter any skill, academic field, or exam topic to generate a 3-stage learning path...',
    icon: Compass,
    color: 'text-cyan-400',
    activeColor: 'from-cyan-600 to-cyan-700 border-cyan-400',
    badge: 'Roadmap',
    samples: [
      'Calculus from Scratch to Multivariable',
      'Machine Learning and Neural Networks',
      'Microeconomics and Market Structures',
    ],
  },
  {
    id: 'resources',
    label: 'Learning Recommendations',
    shortDesc: 'Curate educational videos, articles, and benchmark textbooks',
    placeholder: 'Enter a topic to get curated recommendations of videos, articles, and books...',
    icon: Library,
    color: 'text-rose-400',
    activeColor: 'from-rose-600 to-rose-700 border-rose-400',
    badge: 'Videos & Books',
    samples: [
      'General Relativity and Spacetime',
      'Data Structures & Algorithms',
      'World War II Diplomacy',
    ],
  },
];

export const SimpleTaskHub: React.FC<SimpleTaskHubProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [selectedTask, setSelectedTask] = useState<SimpleTaskType>('ask');
  const [inputContent, setInputContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const activeConfig = TASKS.find((t) => t.id === selectedTask) || TASKS[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setImage({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteTask = async (customPrompt?: string) => {
    const textToRun = (customPrompt || inputContent).trim();
    if ((!textToRun && !image) || isStreaming) return;

    if (customPrompt) {
      setInputContent(customPrompt);
    }

    setIsStreaming(true);
    setStreamedText('');
    setIsSaved(false);
    setIsSpeaking(false);
    stopAudioNarration();

    const startTime = performance.now();
    setStreamStartTime(startTime);
    setElapsedMs(null);

    try {
      const response = await fetch('/api/stream-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: selectedTask,
          input: textToRun,
          subject,
          educationLevel,
          language,
          image: image ? { data: image.data, mimeType: image.mimeType } : undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Real-time streaming failed to connect.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamedText(accumulated);
              }
            } catch {
              // ignore partial json chunk
            }
          }
        }
      }

      const finishTime = performance.now();
      setElapsedMs(Math.round(finishTime - startTime));
      onRewardXP(25, `${activeConfig.label} Real-Time Completion`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating response';
      setStreamedText(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = () => {
    if (!streamedText) return;
    navigator.clipboard.writeText(streamedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!streamedText) return;
    const type = selectedTask === 'ask' ? 'question' : selectedTask === 'summarize' ? 'summary' : 'note';
    const title = `${activeConfig.label}: ${inputContent.slice(0, 30) || 'Study Result'}`;
    onSaveItem(title, streamedText, type);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleToggleVoice = async () => {
    if (isSpeaking) {
      stopAudioNarration();
      setIsSpeaking(false);
    } else if (streamedText) {
      setIsSpeaking(true);
      await playAudioNarration(streamedText.slice(0, 800));
      setIsSpeaking(false);
    }
  };

  const wordCount = inputContent.trim() ? inputContent.trim().split(/\s+/).length : 0;
  const resultWordCount = streamedText.trim() ? streamedText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner: Simple Interface & Real-Time Responses */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Simple Web Interface
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-normal">
                  Real-Time AI Responses
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Select an educational task, enter your problem or topic, and watch Google Gemini stream real-time, personalized academic responses token-by-token.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <p className="font-semibold text-slate-200">Live SSE Streaming</p>
              <p className="text-[10px] text-slate-400">Gemini 3.8 Flash Engine</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Task Selection Menu */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white font-mono">
              1
            </span>
            Select Learning Task:
          </label>
          <span className="text-[11px] text-slate-400">
            Current: <strong className="text-indigo-300">{activeConfig.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TASKS.map((task) => {
            const Icon = task.icon;
            const isSelected = selectedTask === task.id;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  setSelectedTask(task.id);
                  setStreamedText('');
                  setElapsedMs(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-r from-slate-900 to-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-slate-900 ${isSelected ? task.color : 'text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{task.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {task.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">{task.shortDesc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Content Input Area */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[11px] text-white font-mono">
              2
            </span>
            Enter Content or Learning Requirement:
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {wordCount} words / {inputContent.length} chars
          </span>
        </div>

        <textarea
          rows={4}
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleExecuteTask();
            }
          }}
          placeholder={activeConfig.placeholder}
          className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all leading-relaxed"
        />

        {/* Uploaded Image Preview */}
        {image && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/40">
            <img src={image.previewUrl} alt="Problem preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{image.name}</p>
              <p className="text-[11px] text-emerald-400">Attached diagram/worksheet for multimodal analysis</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-500 font-medium">Quick examples:</span>
          {activeConfig.samples.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleExecuteTask(sample)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer line-clamp-1 max-w-xs text-left"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* STEP 3: Submit Button & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Attach Diagram / Photo</span>
            </button>

            {streamedText && !isStreaming && (
              <button
                type="button"
                onClick={() => {
                  setStreamedText('');
                  setElapsedMs(null);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Result</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleExecuteTask()}
            disabled={isStreaming || (!inputContent.trim() && !image)}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-sm font-bold shadow-xl shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Streaming Real-Time Response...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Submit & Get Real-Time AI Result</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STEP 4: Real-Time Results Display */}
      {(streamedText || isStreaming) && (
        <div
          ref={outputRef}
          className="p-6 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl space-y-4 animate-in fade-in duration-300"
        >
          {/* Header & Latency Indicator */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-3 w-3 rounded-full ${isStreaming ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Real-Time AI Response
                  <span className="text-[11px] font-mono font-normal text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30">
                    {activeConfig.label}
                  </span>
                </h3>
              </div>
            </div>

            {/* Metrics & Actions */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {elapsedMs !== null && (
                <span className="flex items-center gap-1 text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  {elapsedMs < 1000 ? `${elapsedMs}ms` : `${(elapsedMs / 1000).toFixed(1)}s`}
                </span>
              )}
              {resultWordCount > 0 && (
                <span className="text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 hidden sm:inline-block">
                  {resultWordCount} words
                </span>
              )}

              <button
                type="button"
                onClick={handleToggleVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Read aloud"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Stream Content with Live Cursor */}
          <div className="relative">
            <MarkdownRenderer content={streamedText || '...'} />
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
