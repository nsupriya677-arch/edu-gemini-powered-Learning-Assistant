export type EducationLevel =
  | 'elementary'
  | 'middle_school'
  | 'high_school'
  | 'undergraduate'
  | 'graduate';

export type Subject =
  | 'General'
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Computer Science'
  | 'History'
  | 'Literature'
  | 'Economics';

export type AppLanguage =
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Hindi'
  | 'Mandarin'
  | 'Japanese'
  | 'Arabic'
  | 'Portuguese';

export interface ImageAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 without prefix
  previewUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  image?: ImageAttachment;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint: string;
  subtopic: string;
}

export interface QuizData {
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
}

export interface SavedItem {
  id: string;
  title: string;
  type: 'note' | 'flashcards' | 'question' | 'summary' | 'study_plan' | 'learning_path';
  content: string;
  subject: string;
  createdAt: number;
  tags?: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  streakDays: number;
  questionsSolved: number;
  quizzesCompleted: number;
  summariesMade: number;
  badges: string[];
}
