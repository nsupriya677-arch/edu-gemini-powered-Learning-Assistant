import React, { useState, useRef } from 'react';
import { FileText, Sparkles, Copy, Check, Bookmark, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { EducationLevel, AppLanguage, ImageAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SummarizerTabProps {
  educationLevel: EducationLevel;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'summary') => void;
  onRewardXP: (xp: number, label: string) => void;
}

const SAMPLE_TEXT = `Photosynthesis is a biological process utilized by plants, algae, and certain bacteria to convert light energy, usually from the Sun, into chemical energy stored in glucose molecules. This synthesized chemical energy is later released through cellular respiration to fuel the organisms' metabolic activities. The process takes place predominantly in the chloroplasts of plant leaves, using the specialized green pigment chlorophyll. 

Photosynthesis occurs in two main phases: the light-dependent reactions and the light-independent reactions (also known as the Calvin Cycle). In the light reactions, photon energy is absorbed to split water molecules (photolysis), releasing oxygen gas as a byproduct and generating high-energy ATP and NADPH molecules. In the Calvin Cycle, which takes place in the stroma, atmospheric carbon dioxide is fixed into organic triose phosphate sugars through the catalytic action of the enzyme RuBisCO.

Photosynthesis is fundamentally responsible for producing and maintaining the oxygen content of the Earth's atmosphere, and it supplies nearly all the organic compounds and energy necessary for complex aerobic life on Earth.`;

export const SummarizerTab: React.FC<SummarizerTabProps> = ({
  educationLevel,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [text, setText] = useState('');
  const [format, setFormat] = useState<'bullets' | 'executive' | 'tldr' | 'mindmap_outline' | 'flashcard_points'>('bullets');
  const [length, setLength] = useState<'concise' | 'standard' | 'comprehensive'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

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

  const handleSummarize = async () => {
    if ((!text.trim() && !image) || isLoading) return;

    setIsLoading(true);
    setSummary(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          format,
          length,
          educationLevel,
          language,
          image: image ? { data: image.data, mimeType: image.mimeType } : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to summarize text.');
      }

      const data = await res.json();
      setSummary(data.summary);
      onRewardXP(20, 'Text Synthesizer');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error summarizing text';
      setSummary(`⚠️ **Error**: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!summary) return;
    onSaveItem('Text Summary', summary, 'summary');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/50 border border-emerald-500/20 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Text & Document Summarizer
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Paste long textbook passages, academic articles, or upload photos of book pages. EduGenie distills the essence into high-retention outlines, key takeaways, and flashcard bullets.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
          <span className="text-xs text-emerald-300">Need to test quickly?</span>
          <button
            type="button"
            onClick={() => setText(SAMPLE_TEXT)}
            className="text-xs px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all cursor-pointer"
          >
            Insert Sample Biology Passage
          </button>
        </div>
      </div>

      {/* Input & Formats */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Paste Material or Upload Document Photo:
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {wordCount} words / {text.length} chars
            </span>
          </div>
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw textbook excerpt, paper abstract, meeting/lecture notes here, or upload a photo below..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all leading-relaxed"
          />
        </div>

        {/* Attached image preview */}
        {image && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
            <img src={image.previewUrl} alt="Document preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{image.name}</p>
              <p className="text-[11px] text-emerald-400">Textbook photo attached • Multimodal Optical Extraction</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Output Format:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bullets', label: 'Key Bullets' },
                { id: 'executive', label: 'Executive Brief' },
                { id: 'tldr', label: 'Quick TL;DR' },
                { id: 'mindmap_outline', label: 'Mindmap Tree' },
                { id: 'flashcard_points', label: 'Flashcard Q&A' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    format === f.id
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Length:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'concise', label: 'Concise (Fast)' },
                { id: 'standard', label: 'Standard (Balanced)' },
                { id: 'comprehensive', label: 'Deep & Detailed' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLength(l.id as any)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    length === l.id
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit & Upload Button */}
        <div className="flex items-center justify-between pt-2">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Page Photo</span>
          </button>

          <button
            type="button"
            onClick={handleSummarize}
            disabled={isLoading || (!text.trim() && !image)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Distilling Insights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summarize Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {summary && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-base font-bold text-white">Synthesized Academic Summary</h3>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={summary} />
        </div>
      )}
    </div>
  );
};
