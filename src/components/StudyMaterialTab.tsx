import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  X,
  Copy,
  Check,
  Bookmark,
  Loader2,
  BookOpen,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { EducationLevel, Subject, AppLanguage, ImageAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface StudyMaterialTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const SAMPLE_MATERIALS = [
  {
    title: 'Cellular Respiration Lecture Notes',
    text: `Cellular respiration consists of glycolysis (cytoplasm), pyruvate oxidation, the citric acid (Krebs) cycle (mitochondrial matrix), and oxidative phosphorylation (inner mitochondrial membrane). Glycolysis produces 2 ATP and 2 NADH per glucose. Krebs cycle generates 2 ATP, 6 NADH, and 2 FADH2. The electron transport chain uses the proton gradient across ATP synthase to generate ~26-28 ATP, totaling ~30-32 ATP per glucose molecule. Oxygen acts as the final electron acceptor, yielding H2O.`,
  },
  {
    title: 'Kinematics & Projectile Motion Excerpt',
    text: `Projectile motion is two-dimensional motion under constant gravitational acceleration g = 9.8 m/s^2 downwards. Horizontal velocity vx = v0 * cos(theta) remains constant assuming negligible air drag. Vertical velocity vy(t) = v0 * sin(theta) - g * t. The maximum height is H = (v0^2 * sin^2(theta)) / (2*g). Range on flat ground is R = (v0^2 * sin(2*theta)) / g. At maximum height, vertical velocity is momentarily zero, but vertical acceleration remains non-zero (-g).`,
  },
];

export const StudyMaterialTab: React.FC<StudyMaterialTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [materialText, setMaterialText] = useState('');
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const [analysisGoal, setAnalysisGoal] = useState<'comprehensive' | 'formula_sheet' | 'quiz_from_notes'>('comprehensive');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textDocInputRef = useRef<HTMLInputElement>(null);

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

  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMaterialText(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if ((!materialText.trim() && !image) || isLoading) return;

    setIsLoading(true);
    setAnalysisResult(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: materialText,
          image: image ? { data: image.data, mimeType: image.mimeType } : undefined,
          analysisGoal,
          subject,
          educationLevel,
          language,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to analyze study material.');
      }

      const data = await res.json();
      setAnalysisResult(data.analysis);
      onRewardXP(30, 'Study Material Analyzed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error analyzing material';
      setAnalysisResult(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!analysisResult) return;
    const title = `Analysis: ${materialText.slice(0, 30) || image?.name || 'Study Material'}`;
    onSaveItem(title, analysisResult, 'note');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-slate-900 border border-violet-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-400/30 text-violet-400 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">Study Material Upload & Analysis</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                Multimodal OCR • Lecture Slides • Notes
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Upload textbook photos, lecture slide captures, or paste raw study notes. Gemini extracts formulas, synthesizes core concepts, and builds active self-quizzes.
            </p>
          </div>
        </div>

        {/* Quick Sample Materials */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-violet-500/15">
          <span className="text-xs text-slate-400 font-medium">Or test sample notes:</span>
          {SAMPLE_MATERIALS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMaterialText(sample.text)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone & Form */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        {/* Goal Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Analysis Objective:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'comprehensive', label: 'Comprehensive Study Guide', desc: 'Glossary, explanations, and core themes' },
              { id: 'formula_sheet', label: 'Extract Formulas & Laws', desc: 'Isolate key equations and conditions' },
              { id: 'quiz_from_notes', label: 'Generate Knowledge Checks', desc: 'Create self-test questions from notes' },
            ].map((g) => {
              const isSelected = analysisGoal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setAnalysisGoal(g.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200 mb-0.5">{g.label}</p>
                  <p className="text-[11px] text-slate-400">{g.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={textDocInputRef}
            onChange={handleTextFileUpload}
            accept=".txt,.md,.csv,.json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-violet-400" />
            <span>Upload Photo of Book / Slide</span>
          </button>

          <button
            type="button"
            onClick={() => textDocInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Import Text/Markdown File</span>
          </button>
        </div>

        {/* Image Preview */}
        {image && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-violet-500/40">
            <img src={image.previewUrl} alt="Upload preview" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{image.name}</p>
              <p className="text-[11px] text-violet-400">Attached image ready for optical & conceptual analysis</p>
            </div>
            <button
              type="button"
              onClick={() => setImage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Input Area */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Or Paste Study Material Text / Lecture Transcript:
          </label>
          <textarea
            rows={6}
            value={materialText}
            onChange={(e) => setMaterialText(e.target.value)}
            placeholder="Paste syllabus notes, textbook chapter excerpts, research abstract, or lecture transcripts here..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading || (!materialText.trim() && !image)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting & Analyzing Material...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Study Material</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {analysisResult && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <h3 className="text-base font-bold text-white">
                Study Material Analysis & Pedagogical Guide
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save to Notebook'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={analysisResult} />
        </div>
      )}
    </div>
  );
};
