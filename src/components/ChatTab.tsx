import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Trash2, Download, Copy, Check, Bookmark, Volume2, VolumeX, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { EducationLevel, Subject, AppLanguage, ChatMessage, ImageAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { playAudioNarration, stopAudioNarration } from '../utils/audio';

interface ChatTabProps {
  educationLevel: EducationLevel;
  subject: Subject;
  language: AppLanguage;
  onSaveItem: (title: string, content: string, type: 'note') => void;
  onRewardXP: (xp: number, label: string) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  educationLevel,
  subject,
  language,
  onSaveItem,
  onRewardXP,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello! I'm **EduGenie**, your personal AI virtual learning assistant.\n\nWhether you need help with **${subject}**, want to unpack a difficult theorem, review an essay, or prepare for an exam, I'm here to support you at your **${educationLevel.replace('_', ' ')}** level.\n\nWhat would you like to explore today?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if ((!textToSend && !image) || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend || 'Please analyze the attached image.',
      timestamp: Date.now(),
      image: image || undefined,
    };

    const currentImage = image;
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          educationLevel,
          subject,
          language,
          image: currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error while generating response');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages([...newHistory, assistantMsg]);
      onRewardXP(15, 'Curious Scholar');
    } catch (error: unknown) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Connection Error**: ${
          error instanceof Error ? error.message : 'Could not contact EduGenie server'
        }. Please check your connection and try again.`,
        timestamp: Date.now(),
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotebook = (content: string) => {
    const title = content.slice(0, 30).replace(/^[#*`_\s]+/, '') || 'EduGenie Response';
    onSaveItem(title, content, 'note');
  };

  const handleToggleVoice = async (id: string, text: string) => {
    if (speakingId === id) {
      stopAudioNarration();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      await playAudioNarration(text.slice(0, 600));
      setSpeakingId(null);
    }
  };

  const handleExportChat = () => {
    const chatExport = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${
            m.role === 'user' ? 'Student' : 'EduGenie'
          }:\n${m.content}\n\n`
      )
      .join('----------------------------------------\n');

    const blob = new Blob([chatExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edugenie-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear current conversation history?')) {
      stopAudioNarration();
      setMessages([
        {
          id: 'welcome-fresh',
          role: 'model',
          content: `New study session started! Ask me any academic question, paste your notes, or upload a diagram to solve.`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Chat Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Interactive Study Tutor
            </h2>
            <p className="text-[11px] text-slate-400">
              Socratic guidance • {subject} • {language}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Export chat transcript"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-indigo-300 border border-slate-700/80 shadow-md'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Uploaded image preview in chat message */}
                  {message.image && (
                    <div className="mb-3">
                      <img
                        src={message.image.previewUrl}
                        alt="Attached problem"
                        className="max-h-48 rounded-lg border border-white/20 object-cover"
                      />
                    </div>
                  )}

                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                </div>

                {/* Message Actions */}
                {!isUser && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 pl-1">
                    <button
                      type="button"
                      onClick={() => handleToggleVoice(message.id, message.content)}
                      className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Read aloud"
                    >
                      {speakingId === message.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-400">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(message.id, message.content)}
                      className="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSaveToNotebook(message.content)}
                      className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Save to Notebook"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>EduGenie is reasoning through your query...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/70">
        {/* Attached image preview banner */}
        {image && (
          <div className="flex items-center gap-3 p-2 mb-2 rounded-xl bg-slate-900 border border-indigo-500/40">
            <img src={image.previewUrl} alt="Attached preview" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{image.name}</p>
              <p className="text-[10px] text-emerald-400">Attached for multimodal analysis</p>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-inner">
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
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Attach problem photo or diagram"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask EduGenie in ${language}... (Press Enter to send, Shift+Enter for newline)`}
            className="flex-1 max-h-32 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none py-1.5 px-2 leading-relaxed"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !image)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
