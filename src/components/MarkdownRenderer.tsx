import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/audio';

interface MarkdownRendererProps {
  content: string;
  allowAudio?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, allowAudio = true }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakText(
        content,
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  // Pre-process markdown into blocks
  const renderFormattedText = (text: string): React.ReactNode => {
    // Process bold, italic, inline code, and links
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded text-pink-400 font-mono text-sm">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const title = part.substring(1, part.indexOf(']('));
        const url = part.substring(part.indexOf('](') + 2, part.length - 1);
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            {title}
          </a>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const renderedBlocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';
  let codeBlockIndex = 0;
  let inTable = false;
  let tableRows: string[][] = [];
  let inDetails = false;
  let detailsSummary = '';
  let detailsContent: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Handle code block fences
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const fullCode = codeBlockContent.join('\n');
        const currentIndex = codeBlockIndex++;
        renderedBlocks.push(
          <div key={`code-${idx}`} className="my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950/90 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-mono text-indigo-300">{codeBlockLang || 'code'}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, currentIndex)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Copy code"
              >
                {copiedIndex === currentIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle HTML details tags
    if (line.includes('<details>')) {
      inDetails = true;
      detailsContent = [];
      detailsSummary = 'Click to reveal explanation';
      continue;
    }
    if (inDetails && line.includes('</details>')) {
      inDetails = false;
      renderedBlocks.push(
        <details key={`details-${idx}`} className="my-3 rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3 group">
          <summary className="font-semibold text-indigo-300 cursor-pointer hover:text-indigo-200 select-none flex items-center gap-2">
            <span>🔍</span>
            <span>{detailsSummary}</span>
          </summary>
          <div className="mt-3 pl-4 border-l-2 border-indigo-500/40 text-slate-300 space-y-2 text-sm leading-relaxed">
            {detailsContent.map((dLine, dIdx) => (
              <p key={dIdx}>{renderFormattedText(dLine)}</p>
            ))}
          </div>
        </details>
      );
      continue;
    }
    if (inDetails) {
      if (line.includes('<summary>') && line.includes('</summary>')) {
        detailsSummary = line.replace(/<\/?summary>/g, '').trim();
      } else if (!line.includes('<summary>')) {
        detailsContent.push(line);
      }
      continue;
    }

    // Handle Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Check if divider line
      if (!line.includes('---')) {
        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Flush table
      inTable = false;
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const rows = tableRows.slice(1);
        renderedBlocks.push(
          <div key={`table-${idx}`} className="my-4 overflow-x-auto rounded-lg border border-slate-700/60 shadow-md">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-800/80">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-4 py-2.5 text-left font-semibold text-slate-200">
                      {renderFormattedText(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {rows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    {r.map((c, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-slate-300">
                        {renderFormattedText(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // Handle Headings
    if (line.startsWith('# ')) {
      renderedBlocks.push(
        <h1 key={`h1-${idx}`} className="text-2xl font-bold text-slate-50 mt-6 mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
          {renderFormattedText(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      renderedBlocks.push(
        <h2 key={`h2-${idx}`} className="text-xl font-semibold text-indigo-300 mt-5 mb-2.5 flex items-center gap-2">
          {renderFormattedText(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      renderedBlocks.push(
        <h3 key={`h3-${idx}`} className="text-base font-semibold text-sky-400 mt-4 mb-2 flex items-center gap-1.5">
          {renderFormattedText(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      renderedBlocks.push(
        <h4 key={`h4-${idx}`} className="text-sm font-semibold text-amber-300 mt-3 mb-1">
          {renderFormattedText(line.slice(5))}
        </h4>
      );
    } else if (line.startsWith('> ')) {
      renderedBlocks.push(
        <blockquote key={`quote-${idx}`} className="my-3 pl-4 py-1.5 border-l-4 border-indigo-500 bg-indigo-500/5 rounded-r-lg text-slate-300 italic text-sm">
          {renderFormattedText(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      renderedBlocks.push(
        <div key={`li-${idx}`} className="flex items-start gap-2.5 my-1.5 text-slate-300 text-sm leading-relaxed pl-2">
          <span className="text-indigo-400 font-bold mt-1 leading-none text-xs">●</span>
          <div className="flex-1">{renderFormattedText(line.trim().slice(2))}</div>
        </div>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+)\.\s(.*)$/);
      if (match) {
        renderedBlocks.push(
          <div key={`oli-${idx}`} className="flex items-start gap-2.5 my-1.5 text-slate-300 text-sm leading-relaxed pl-2">
            <span className="px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 text-xs font-mono font-bold mt-0.5">
              {match[1]}
            </span>
            <div className="flex-1">{renderFormattedText(match[2])}</div>
          </div>
        );
      }
    } else if (line.trim() === '---') {
      renderedBlocks.push(<hr key={`hr-${idx}`} className="my-6 border-slate-800" />);
    } else if (line.trim().length > 0) {
      renderedBlocks.push(
        <p key={`p-${idx}`} className="my-2 text-slate-300 text-sm leading-relaxed">
          {renderFormattedText(line)}
        </p>
      );
    }
  }

  return (
    <div className="relative prose-academic text-slate-200 text-sm leading-relaxed">
      {allowAudio && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isPlayingAudio
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
            title={isPlayingAudio ? 'Stop reading aloud' : 'Read aloud with AI voice'}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span>Stop Voice</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Listen</span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="space-y-1">{renderedBlocks}</div>
    </div>
  );
};
