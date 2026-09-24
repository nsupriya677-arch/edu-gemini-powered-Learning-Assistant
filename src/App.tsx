/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Lightbulb,
  Award,
  FileText,
  Compass,
  MessageSquare,
  BookMarked,
  Calendar,
  Library,
  Sparkles,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { EducationLevel, Subject, AppLanguage, SavedItem, GamificationState } from './types';
import { Navbar } from './components/Navbar';
import { ChatTab } from './components/ChatTab';
import { AskQuestionTab } from './components/AskQuestionTab';
import { ConceptExplainerTab } from './components/ConceptExplainerTab';
import { SummarizerTab } from './components/SummarizerTab';
import { NoteGeneratorTab } from './components/NoteGeneratorTab';
import { QuizTab } from './components/QuizTab';
import { StudyPlanTab } from './components/StudyPlanTab';
import { LearningPathTab } from './components/LearningPathTab';
import { ResourcesTab } from './components/ResourcesTab';
import { SimpleTaskHub } from './components/SimpleTaskHub';
import { NotebookModal } from './components/NotebookModal';
import { ProjectSummaryModal } from './components/ProjectSummaryModal';

type TabType =
  | 'simple'
  | 'ask'
  | 'concept'
  | 'quiz'
  | 'summarize'
  | 'learning_path'
  | 'resources'
  | 'chat'
  | 'notes'
  | 'study_plan';

interface TabItem {
  id: TabType;
  label: string;
  badge?: string;
  isCore?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  // Simple Interface & Real-Time Hub
  { id: 'simple', label: 'Simple Interface', badge: 'Real-Time AI', isCore: true, icon: Zap },
  // 6 Main System Modules
  { id: 'ask', label: '1. Question & Answer', badge: 'Core', isCore: true, icon: HelpCircle },
  { id: 'concept', label: '2. Explanation', badge: 'Core', isCore: true, icon: Lightbulb },
  { id: 'quiz', label: '3. Quiz Generator', badge: '3 MCQs', isCore: true, icon: Award },
  { id: 'summarize', label: '4. Summarizer', badge: 'Core', isCore: true, icon: FileText },
  { id: 'learning_path', label: '5. Learning Path', badge: 'Roadmap', isCore: true, icon: Compass },
  { id: 'resources', label: '6. Learning Recommendations', badge: 'Videos & Books', isCore: true, icon: Library },
  // Extended Study Tools
  { id: 'chat', label: 'AI Study Tutor', icon: MessageSquare },
  { id: 'notes', label: 'Cornell Notes', icon: BookMarked },
  { id: 'study_plan', label: 'Study Timetable', icon: Calendar },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('simple');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('high_school');
  const [subject, setSubject] = useState<Subject>('General');
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gamification state
  const [gamification, setGamification] = useState<GamificationState>({
    xp: 60,
    level: 1,
    streakDays: 3,
    questionsSolved: 2,
    quizzesCompleted: 1,
    summariesMade: 1,
    badges: ['First Step', 'Explorer'],
  });

  // Load saved notebook & gamification from localStorage
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('edugenie_saved_items');
      if (storedItems) setSavedItems(JSON.parse(storedItems));

      const storedGamify = localStorage.getItem('edugenie_gamification');
      if (storedGamify) setGamification(JSON.parse(storedGamify));
    } catch {
      // Ignore localStorage error
    }
  }, []);

  const saveItemsToStorage = (items: SavedItem[]) => {
    setSavedItems(items);
    try {
      localStorage.setItem('edugenie_saved_items', JSON.stringify(items));
    } catch {
      // Ignore localStorage error
    }
  };

  const handleRewardXP = (earnedXp: number, actionName: string) => {
    setGamification((prev) => {
      const newXp = prev.xp + earnedXp;
      const newLevel = Math.floor(newXp / 100) + 1;
      const leveledUp = newLevel > prev.level;

      const updated = {
        ...prev,
        xp: newXp,
        level: newLevel,
      };

      try {
        localStorage.setItem('edugenie_gamification', JSON.stringify(updated));
      } catch {
        // Ignore
      }

      if (leveledUp) {
        showToast(`🎉 Level Up! You reached Level ${newLevel}! (+${earnedXp} XP: ${actionName})`);
      } else {
        showToast(`⚡ +${earnedXp} XP earned for ${actionName}!`);
      }

      return updated;
    });
  };

  const handleSaveItem = (title: string, content: string, type: SavedItem['type']) => {
    const newItem: SavedItem = {
      id: `saved-${Date.now()}`,
      title,
      type,
      content,
      subject,
      createdAt: Date.now(),
    };
    const updated = [newItem, ...savedItems];
    saveItemsToStorage(updated);
    showToast(`Saved to Notebook: "${title.slice(0, 30)}..."`);
    handleRewardXP(15, 'Notebook Archiving');
  };

  const handleDeleteItem = (id: string) => {
    const updated = savedItems.filter((i) => i.id !== id);
    saveItemsToStorage(updated);
  };

  const handleClearAllItems = () => {
    if (window.confirm('Are you sure you want to clear your entire notebook?')) {
      saveItemsToStorage([]);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* Navbar */}
      <Navbar
        educationLevel={educationLevel}
        setEducationLevel={setEducationLevel}
        subject={subject}
        setSubject={setSubject}
        language={language}
        setLanguage={setLanguage}
        savedCount={savedItems.length}
        gamification={gamification}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        onOpenSummary={() => setIsSummaryOpen(true)}
      />

      {/* Task Selection Menu (Highlights the 5 core modules) */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20'
                      : tab.isCore
                      ? 'text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isCore ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && !isActive && (
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Interactive Task Workflow Status Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Interactive Task Hub
              </span>
              <span className="text-slate-300 font-medium">
                1. Select Task &rarr; 2. Enter Content &rarr; 3. Receive Real-Time Results
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Real-Time Responses
              </span>
              <span>•</span>
              <span className="text-slate-400">Cloud Gemini AI</span>
              <span>•</span>
              <span className="text-slate-400">Lightweight Architecture</span>
            </div>
          </div>
        </div>

        {activeTab === 'simple' && (
          <SimpleTaskHub
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'ask' && (
          <AskQuestionTab
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'concept' && (
          <ConceptExplainerTab
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizTab
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'summarize' && (
          <SummarizerTab
            educationLevel={educationLevel}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'learning_path' && (
          <LearningPathTab
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
        {activeTab === 'notes' && (
          <NoteGeneratorTab
            educationLevel={educationLevel}
            subject={subject}
            onSaveItem={handleSaveItem}
          />
        )}
        {activeTab === 'study_plan' && (
          <StudyPlanTab
            educationLevel={educationLevel}
            subject={subject}
            onSaveItem={handleSaveItem}
          />
        )}
        {activeTab === 'resources' && (
          <ResourcesTab
            educationLevel={educationLevel}
            subject={subject}
            language={language}
            onSaveItem={handleSaveItem}
            onRewardXP={handleRewardXP}
          />
        )}
      </main>

      {/* Notebook Drawer Modal */}
      <NotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        savedItems={savedItems}
        onDeleteItem={handleDeleteItem}
        onClearAll={handleClearAllItems}
      />

      {/* Project Summary & Architecture Modal */}
      <ProjectSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs font-semibold text-indigo-100 shadow-2xl shadow-indigo-500/20 animate-in slide-in-from-bottom-3 duration-200">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400 font-semibold">EduGenie</span>
            <span>•</span>
            <span>Google Gemini Generative AI Model</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Language: <strong className="text-slate-300">{language}</strong></span>
            <span>•</span>
            <span>Level: <strong className="text-slate-300 capitalize">{educationLevel.replace('_', ' ')}</strong></span>
            <span>•</span>
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
            >
              Project Specifications
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
