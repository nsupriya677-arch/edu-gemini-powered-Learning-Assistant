import React, { useState } from 'react';
import { X, Bookmark, Trash2, Download, Search, FileText, BookMarked, HelpCircle, Calendar, Copy, Check } from 'lucide-react';
import { SavedItem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isOpen,
  onClose,
  savedItems,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<SavedItem | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredItems = savedItems.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesQuery && matchesType;
  });

  const handleExportAll = () => {
    const fullText = savedItems
      .map(
        (item) =>
          `# ${item.title}\n*Type: ${item.type} | Subject: ${item.subject} | Saved: ${new Date(
            item.createdAt
          ).toLocaleDateString()}*\n\n${item.content}\n\n---\n`
      )
      .join('\n');

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edugenie-notebook-archive-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyActive = () => {
    if (!activeItem) return;
    navigator.clipboard.writeText(activeItem.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
      case 'flashcards':
        return <BookMarked className="w-4 h-4 text-blue-400" />;
      case 'question':
        return <HelpCircle className="w-4 h-4 text-indigo-400" />;
      case 'summary':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'study_plan':
        return <Calendar className="w-4 h-4 text-teal-400" />;
      default:
        return <Bookmark className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">EduGenie Study Notebook</h2>
              <p className="text-xs text-slate-400">
                {savedItems.length} saved study artifact{savedItems.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  title="Export everything as Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export All</span>
                </button>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Layout: Left List + Right Detail Viewer */}
        <div className="flex flex-1 overflow-hidden">
          {/* List Sidebar */}
          <div className="w-full sm:w-80 border-r border-slate-800 flex flex-col bg-slate-950/40">
            {/* Search & Filter */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved notes..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                {['all', 'note', 'question', 'summary', 'study_plan'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`px-2 py-0.5 rounded capitalize whitespace-nowrap ${
                      filterType === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'study_plan' ? 'Plans' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                  No saved items yet. Save any note, solution, or quiz review to access it here!
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = activeItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`p-2.5 rounded-xl text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/60 border border-indigo-500/50 shadow-sm'
                          : 'hover:bg-slate-850 hover:bg-slate-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getTypeIcon(item.type)}
                          <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                            if (activeItem?.id === item.id) setActiveItem(null);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete this item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.content.replace(/^[#*`_\s]+/gm, '')}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{item.subject}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Detail Pane */}
          <div className="hidden sm:flex flex-1 flex-col overflow-y-auto p-6 bg-slate-900/60">
            {activeItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">{activeItem.title}</h3>
                    <p className="text-xs text-slate-400">
                      Subject: {activeItem.subject} • Saved on{' '}
                      {new Date(activeItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyActive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Content'}</span>
                  </button>
                </div>
                <MarkdownRenderer content={activeItem.content} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2">
                <Bookmark className="w-10 h-10 opacity-30 text-indigo-400" />
                <p className="text-sm font-medium text-slate-400">Select an item from your notebook</p>
                <p className="text-xs max-w-xs">
                  Review your saved Cornell notes, practice problem solutions, and study schedules.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
