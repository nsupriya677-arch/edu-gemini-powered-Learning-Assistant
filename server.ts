import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini client strictly using @google/genai with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

// Helper for error formatting
const handleApiError = (res: Response, error: unknown, defaultMsg: string) => {
  console.error(`[EduGenie Error] ${defaultMsg}:`, error);
  const message = error instanceof Error ? error.message : defaultMsg;
  return res.status(500).json({ error: message });
};

// 1. Interactive AI Chat with Multimodal & Multilingual Support
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, educationLevel = 'high_school', subject = 'General', language = 'English', image } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required.' });
    }

    const systemInstruction = `You are EduGenie, an intelligent, inspiring, empathetic, and expert personal learning tutor.
Your mission is to help students truly master concepts, solve academic problems, build intuition, and develop lifelong study skills.
- Target audience academic level: "${educationLevel}". Adjust vocabulary, depth, and pedagogical pacing accordingly.
- Current domain/subject focus: "${subject}".
- Output language: Respond fluently and naturally in ${language}.
- Provide lucid, structured explanations using clean Markdown, LaTeX/math expressions formatted with backticks or standard math notation, bullet points, and code blocks where applicable.
- Guide with the Socratic method when appropriate, encouraging critical thinking rather than just giving a sterile answer.
- If an image or diagram was provided, analyze it thoroughly and relate your explanation directly to it.
- At the very end of your response, add a dedicated section:
### 💡 Explore Further
Provide 2-3 brief, relevant follow-up questions or thought experiments the student can ask you next to test their understanding.`;

    // Format messages for gemini-3.8-flash contents
    const contents: any[] = messages.map((m: { role: string; content: string }, index: number) => {
      const parts: any[] = [{ text: m.content }];
      // If the latest message has an attached image, add inlineData
      if (index === messages.length - 1 && image && image.data && image.mimeType) {
        parts.unshift({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        });
      }
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts,
      };
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I apologize, I could not generate a response. Please try rephrasing.';
    return res.json({ reply });
  } catch (error) {
    return handleApiError(res, error, 'Failed to process chat query');
  }
});

// Real-Time Streaming AI Responses for all Core Tasks (Server-Sent Events)
app.post('/api/stream-task', async (req: Request, res: Response) => {
  try {
    const {
      task = 'ask',
      input = '',
      subject = 'General',
      educationLevel = 'high_school',
      language = 'English',
      image,
    } = req.body;

    if (!input && !image) {
      return res.status(400).json({ error: 'Text input or image is required.' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let systemInstruction = `You are EduGenie, an intelligent, real-time AI learning assistant. Respond in ${language} for a ${educationLevel} level student. Subject: ${subject}.`;
    let userPrompt = '';

    if (task === 'ask') {
      systemInstruction = `You are EduGenie's Academic Problem Solver. Break down questions rigorously and clearly for a ${educationLevel} student. Respond in ${language}.`;
      userPrompt = `Student Question:
"""
${input || 'Please analyze and solve the attached image problem.'}
"""

Provide a comprehensive, pedagogical response with:
1. **Direct Answer / Executive Solution**: Clear, upfront answer or thesis.
2. **Concept & Principles**: Fundamental laws, theorems, or formulas applied.
3. **Step-by-Step Derivation**: Detailed reasoning with intermediate checkpoints.
4. **Common Pitfalls & Mistakes**: Where students typically go wrong.
5. **Quick Verification / Sanity Check**: How to independently check the result.
6. **Key Takeaway**: 1-2 sentence core rule to remember.`;
    } else if (task === 'concept') {
      systemInstruction = `You are EduGenie's Concept Architect. Teach complex ideas with intuitive analogies, mental models, and the Feynman technique in ${language}.`;
      userPrompt = `Explain the following topic for a ${educationLevel} student:
Topic: "${input}"

Structure the explanation:
1. **The Core Intuition**: A vivid, everyday analogy without confusing jargon.
2. **First-Principles Breakdown**: How it actually works step-by-step.
3. **Why It Matters**: Practical real-world significance and applications.
4. **Interactive Knowledge Check**: A quick thought experiment with answer hidden in a markdown block.`;
    } else if (task === 'quiz') {
      systemInstruction = `You are EduGenie's Quiz Master. Formulate exactly 3 high-quality multiple choice questions with 4 options (A, B, C, D) in ${language}.`;
      userPrompt = `Generate 3 interactive MCQs with 4 options based on:
"${input}"

For each question:
- State the question clearly.
- Provide 4 distinct options labeled A), B), C), D).
- State the correct answer.
- Provide a helpful hint and a detailed explanation of why the correct option is right.`;
    } else if (task === 'summarize') {
      systemInstruction = `You are EduGenie's Executive Academic Summarizer. Distill content into high-retention takeaways in ${language}.`;
      userPrompt = `Summarize the following educational content concisely for a ${educationLevel} student:
"""
${input}
"""

Include:
1. **Executive TL;DR**: 2-3 sentence overview.
2. **Key Takeaways & Core Arguments**: 4-6 bullet points.
3. **Crucial Terminology**: Key terms defined concisely.
4. **Actionable Summary / Study Tip**.`;
    } else if (task === 'learning_path') {
      systemInstruction = `You are EduGenie's Master Curriculum Designer. Create structured beginner-to-advanced learning roadmaps in ${language}.`;
      userPrompt = `Design a comprehensive, structured beginner-to-advanced learning path for "${input}".
Organize into:
- Stage 1: Beginner Foundations (Prerequisites & Intuition)
- Stage 2: Intermediate Proficiency (Core Methods & Problem Solving)
- Stage 3: Advanced Mastery (Complex Systems & Real-World Projects)
Include milestones, estimated hours, and self-assessment criteria.`;
    } else if (task === 'resources') {
      systemInstruction = `You are EduGenie's Academic Resource Advisor. Curate real, authoritative educational resources in ${language}.`;
      userPrompt = `Suggest curated learning resources for "${input}":
1. 🎥 **Recommended Educational Videos & YouTube Channels** (e.g., Khan Academy, MIT OCW, 3Blue1Brown, CrashCourse)
2. 📰 **Articles, Peer-Reviewed Papers & Guides**
3. 📖 **Essential Textbooks & Reference Books** (Standard & Intuitive)
4. 🧪 **Interactive Tools, Simulations & Practice Portals**
5. 🎯 **Suggested Study Sequence**.`;
    } else {
      userPrompt = input;
    }

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    parts.push({ text: userPrompt });

    const responseStream = await ai.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[Stream Error]', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Streaming failed' });
    }
    res.write(`data: ${JSON.stringify({ error: 'Streaming interrupted' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// 2. Question & Answer Module (Answers academic & general questions with optional image problem solving)
app.post('/api/ask-question', async (req: Request, res: Response) => {
  try {
    const { question, educationLevel = 'high_school', subject = 'General', detailLevel = 'step_by_step', language = 'English', image } = req.body;

    if (!question && !image) {
      return res.status(400).json({ error: 'Question text or an uploaded image is required.' });
    }

    const promptText = `Student Academic Question:
"""
${question || 'Please analyze and solve the problem shown in the attached image.'}
"""

Subject: ${subject}
Student Level: ${educationLevel}
Mode: ${detailLevel}
Output Language: ${language}

Provide a comprehensive, pedagogical response with:
1. **Direct Answer / Executive Solution**: Clear, upfront answer or thesis.
2. **Concept & Principles**: The fundamental laws, theorems, or formulas applied.
3. **Step-by-Step Walkthrough**: Detailed derivation or reasoning with intermediate checkpoints.
4. **Common Pitfalls & Mistakes**: Where students typically go wrong on this type of problem.
5. **Quick Verification / Sanity Check**: How the student can independently check if their answer is correct.
6. **Key Takeaway**: 1-2 sentence core rule to remember.`;

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts },
      config: {
        systemInstruction: `You are EduGenie's Academic Problem Solver. Break down questions rigorously and clearly for a ${educationLevel} student. Respond in ${language}.`,
        temperature: 0.4,
      },
    });

    return res.json({ solution: response.text || 'No solution generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to solve question');
  }
});

// 3. Explanation Module (Explains complex topics in simple language, analogies, Feynman)
app.post('/api/explain-concept', async (req: Request, res: Response) => {
  try {
    const { topic, style = 'intuitive', educationLevel = 'high_school', subject = 'General', language = 'English' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    let stylePromptModifier = '';
    switch (style) {
      case 'eli5':
        stylePromptModifier = 'Explain this in ultra-simple, friendly language (Explain Like I\'m 10). Use everyday objects, intuitive analogies, and zero jargon.';
        break;
      case 'feynman':
        stylePromptModifier = 'Apply the Feynman Technique: Strip away unnecessary jargon, find the core underlying truth, use a vivid physical analogy, and target misconceptions.';
        break;
      case 'academic':
        stylePromptModifier = 'Provide a rigorous breakdown with formal definitions, mathematical formulation, underlying mechanisms, and edge cases.';
        break;
      case 'visual_analogies':
        stylePromptModifier = 'Focus heavily on visual analogies, mental models, spatial relationships, and ASCII/text diagrams illustrating the process flow.';
        break;
      default:
        stylePromptModifier = 'Provide an intuitive, clear explanation that builds understanding from the ground up with relatable examples.';
    }

    const prompt = `Topic to Explain: "${topic}"
Subject Domain: ${subject}
Target Audience Level: ${educationLevel}
Explanation Approach: ${stylePromptModifier}
Output Language: ${language}

Please structure your explanation with the following sections in ${language}:
# 🧠 ${topic}

### 🎯 The Big Picture (In 2 Sentences)
(Crisp, punchy summary of what it is and why it matters)

### 🧩 Intuitive Analogy / Mental Model
(Relate it to something vivid, tangible, and relatable)

### 🔬 Deep Dive: How It Actually Works
(The core components, rules, steps, or mechanisms explained simply)

### 🌍 Real-World Applications & Examples
(Where do we see this in nature, technology, society, or industry?)

### ⚠️ Common Misconceptions Debunked
(Clarify what this is NOT, or mistakes people frequently make)

### ❓ Self-Test Checkpoint
(1 thought-provoking question for the student, with an expandable or revealed answer below)
<details>
<summary>Click to reveal answer & explanation</summary>
...
</details>`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Concept Architect. You turn complicated academic topics into intuitive, unforgettable knowledge in ${language}.`,
        temperature: 0.6,
      },
    });

    return res.json({ explanation: response.text || 'No explanation generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to explain concept');
  }
});

// 4. Summarizer Module (Converts lengthy content into concise summaries)
app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const { text, format = 'bullets', length = 'standard', educationLevel = 'high_school', language = 'English', image } = req.body;

    if ((!text || typeof text !== 'string' || text.trim().length === 0) && !image) {
      return res.status(400).json({ error: 'Text or image to summarize is required.' });
    }

    const prompt = `Please summarize the following educational material.

Target Student Level: ${educationLevel}
Desired Summary Format: ${format} (e.g. bullets, executive, tldr, mindmap_outline, or flashcard_points)
Desired Length: ${length}
Output Language: ${language}

Source Material:
"""
${text || 'Extract and summarize key concepts from the attached document or image.'}
"""

Ensure the summary retains key terminology, core arguments, evidence, formulas/data points, and conclusions without unnecessary fluff. Highlight critical terms in **bold**. Respond in ${language}.`;

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts },
      config: {
        systemInstruction: `You are EduGenie's Precision Summarizer. Distill academic content with extreme clarity and fidelity in ${language}.`,
        temperature: 0.3,
      },
    });

    return res.json({ summary: response.text || 'No summary generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to summarize text');
  }
});

// 5. Quiz Generator Module (Creates 3 or custom MCQs with 4 options from given content or topic)
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      sourceContent,
      passage,
      questionCount = 3,
      difficulty = 'medium',
      subject = 'General',
      educationLevel = 'high_school',
      language = 'English',
    } = req.body;

    const passageContent = (passage || sourceContent || '').trim();

    if (!topic && !passageContent) {
      return res.status(400).json({ error: 'Quiz topic or passage content is required.' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 3, 3), 10);

    let prompt = '';
    if (passageContent) {
      prompt = `You are EduGenie's Quiz Master. Read the following passage carefully and generate an interactive ${count}-question multiple-choice quiz testing comprehension of this exact passage.

Passage Content:
"""
${passageContent}
"""

Subject Domain: ${subject}
Target Difficulty: ${difficulty}
Student Academic Level: ${educationLevel}
Language: ${language}

Requirements:
- Exactly ${count} questions directly testing comprehension, key concepts, mechanisms, and inferences from the provided passage.
- Each question must have EXACTLY 4 plausible options (A, B, C, D).
- Exactly one option is strictly correct (correctAnswerIndex 0, 1, 2, or 3).
- Provide an instructive explanation that explains why the correct answer is right and why others are incorrect based on the text.
- Provide a helpful hint for students who get stuck.
- All text must be in ${language}.`;
    } else {
      prompt = `You are EduGenie's Quiz Master. Generate an interactive ${count}-question multiple-choice quiz about "${topic}".

Subject Domain: ${subject}
Target Difficulty: ${difficulty}
Student Academic Level: ${educationLevel}
Language: ${language}

Requirements:
- Exactly ${count} questions testing deep conceptual understanding, application, and problem solving.
- Each question must have EXACTLY 4 plausible options (A, B, C, D).
- Exactly one option is strictly correct (correctAnswerIndex 0, 1, 2, or 3).
- Provide an instructive explanation that explains why the correct answer is right and why the distractors are wrong.
- Provide a helpful hint for students who get stuck.
- All text must be in ${language}.`;
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  subtopic: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctAnswerIndex', 'explanation', 'hint', 'subtopic'],
              },
            },
          },
          required: ['title', 'topic', 'difficulty', 'questions'],
        },
        temperature: 0.5,
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    return res.json(parsed);
  } catch (error) {
    return handleApiError(res, error, 'Failed to generate quiz');
  }
});

// 6. Learning Path Module (Creates beginner-to-advanced personalized learning recommendations)
app.post('/api/learning-path', async (req: Request, res: Response) => {
  try {
    const { topicOrGoal, subject = 'General', currentLevel = 'beginner', targetPace = 'balanced', language = 'English' } = req.body;

    if (!topicOrGoal || typeof topicOrGoal !== 'string') {
      return res.status(400).json({ error: 'Topic or goal is required.' });
    }

    const prompt = `Design a comprehensive, structured **Beginner-to-Advanced Personalized Learning Path** for mastering: "${topicOrGoal}".
Subject: ${subject}
Current Learner Starting Point: ${currentLevel}
Pacing: ${targetPace}
Output Language: ${language}

Structure the response with:
# 🗺️ Learning Path: ${topicOrGoal}

### 🎯 Overall Roadmap Vision & Prerequisites
Brief overview of what mastering this topic unlocks, and any essential foundational knowledge required.

### 🟢 Stage 1: Beginner Foundations (Building Core Intuition)
- **Core Concepts to Master**: 3-4 foundational pillars explained simply.
- **Hands-On Exercises / Checkpoints**: What to build, calculate, or solve first.
- **Self-Assessment Question**: How to know you are ready to advance.

### 🟡 Stage 2: Intermediate Proficiency (Mechanisms & Problem Solving)
- **Deep-Dive Concepts**: Core algorithms, laws, formulas, or frameworks.
- **Applied Practice**: Real-world scenarios, case studies, or challenging homework problems.
- **Common Traps to Avoid**: Subtleties where intermediate students stumble.

### 🔴 Stage 3: Advanced Mastery & Real-World Application
- **Advanced Edge Cases & Nuance**: High-level optimization, synthesis, or modern frontiers.
- **Capstone Challenge**: A comprehensive project, proof, or problem to demonstrate true mastery.
- **Recommended Next Frontiers**: Related fields or topics to explore next.

### 📅 Recommended Study Cadence & Weekly Milestones
Suggested timeline breakdown with active recall intervals.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Curriculum Director. Build world-class, personalized beginner-to-advanced educational roadmaps in ${language}.`,
        temperature: 0.5,
      },
    });

    return res.json({ learningPath: response.text || 'No learning path generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to generate learning path');
  }
});

// 7. Note Generation (Cornell Notes, Revision Cheat Sheets, Formula Sheets)
app.post('/api/generate-notes', async (req: Request, res: Response) => {
  try {
    const { topicOrText, format = 'cornell', subject = 'General', educationLevel = 'high_school', language = 'English' } = req.body;

    if (!topicOrText || typeof topicOrText !== 'string') {
      return res.status(400).json({ error: 'Topic or text is required.' });
    }

    let formatInstructions = '';
    if (format === 'cornell') {
      formatInstructions = `Generate structured **Cornell Method Notes**:
- **Metadata**: Topic, Subject, Target Level
- **Cue Column (Questions & Keywords)**: Key terms, testable questions, and memory triggers.
- **Notes Column**: Main lecture/concept notes, bullet points, definitions, concise formulas.
- **Summary**: A high-impact 3-4 sentence synthesis at the bottom summarizing the core understanding.`;
    } else if (format === 'revision_cheat_sheet') {
      formatInstructions = `Generate a high-density **Exam Revision Cheat Sheet**:
- Core Principles & Golden Rules
- High-Yield Definitions
- Key Formulas / Theorems / Data Table
- Mnemonics & Memory Hacks
- "Watch Out For" Exam Traps`;
    } else if (format === 'flashcards') {
      formatInstructions = `Generate 6-10 active-recall **Revision Flashcards**:
Format each flashcard clearly with:
Card 1:
- **Front / Prompt**: [Active recall question or scenario]
- **Back / Answer**: [Concise, accurate answer with explanation]
...`;
    } else if (format === 'formula_sheet') {
      formatInstructions = `Generate a comprehensive **Formula & Concept Reference Sheet**:
- Grouped by sub-topic
- Formula / Equation / Rule
- Variables & Constants with SI units defined
- Condition / Assumption of validity
- Common application example`;
    }

    const prompt = `Create comprehensive, beautifully organized study notes for:
"""
${topicOrText}
"""

Subject: ${subject}
Student Level: ${educationLevel}
Format Style: ${format}
Language: ${language}

${formatInstructions}
Respond in ${language}.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Study Note Master. You craft structured, aesthetic, and study-optimized notes in ${language}.`,
        temperature: 0.5,
      },
    });

    return res.json({ notes: response.text || 'No notes generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to generate notes');
  }
});

// 8. Personalized Study Plan Generator
app.post('/api/study-plan', async (req: Request, res: Response) => {
  try {
    const { goal, timeframeDays = 14, hoursPerDay = 2, subject = 'General', educationLevel = 'high_school', currentLevel = 'beginner', language = 'English' } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Study goal is required.' });
    }

    const prompt = `Generate a realistic, science-backed personalized study plan.
Student Goal: "${goal}"
Subject: ${subject}
Student Level: ${educationLevel}
Current Readiness: ${currentLevel}
Time Horizon: ${timeframeDays} days
Daily Study Budget: ${hoursPerDay} hours per day
Language: ${language}

Provide:
1. **Executive Roadmap Overview**: Strategy, phase breakdown (Foundation -> Deep Practice -> Review & Mock Testing).
2. **Weekly / Daily Milestones**: Actionable daily study blocks incorporating Active Recall and Spaced Repetition.
3. **High-Yield Priority Topics**: What matters most for maximum retention and exam success.
4. **Recommended Study Habits & Routine**: Pomodoro schedule, break intervals, and self-quizzing prompts.
5. **Readiness Checklist**: Key competencies to tick off before exam/completion day.
Respond in ${language}.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Master Academic Coach. Formulate structured study roadmaps in ${language}.`,
        temperature: 0.5,
      },
    });

    return res.json({ plan: response.text || 'No study plan generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to generate study plan');
  }
});

// 9. Curated Learning Recommendations (Videos, Articles, Books & Interactive Tools)
app.post('/api/learning-resources', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      resourceType = 'all',
      subject = 'General',
      educationLevel = 'high_school',
      language = 'English',
    } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `You are EduGenie's Academic Resource Advisor. Suggest high-quality, trusted learning resources for a student studying "${topic}".

Subject Domain: ${subject}
Student Academic Level: ${educationLevel}
Target Resource Focus: ${resourceType}
Language: ${language}

Provide comprehensive, categorized learning recommendations structured into the following sections:

### 1. 🎥 Recommended Educational Videos & Online Lectures
- Specific YouTube channels or creators renowned for this topic (e.g., 3Blue1Brown, Khan Academy, MIT OpenCourseWare, CrashCourse, Professor Leonard, StatQuest, Kurzgesagt, etc.).
- Specific recommended video titles or lecture series to search for.
- Brief note on why each video/channel is best for this concept.

### 2. 📰 Recommended Articles, Papers & Web Guides
- Authoritative reference articles, encyclopedias (e.g., Stanford Encyclopedia of Philosophy, Nature Scitable, Britannica, LibreTexts).
- Peer-reviewed overview papers, open-access journals, or university explainer guides.
- Documentation or tutorial websites (e.g., MDN, W3Schools, GeeksforGeeks, Paul's Online Math Notes).

### 3. 📖 Essential Books & Textbooks
- **Standard Benchmark Textbook**: The definitive academic standard textbook with author, edition recommendation, and why it is the gold standard.
- **Intuitive / Accessible Book**: A reader-friendly or popular-science book that explains the topic with high engagement.
- Recommended chapters or sections to prioritize.

### 4. 🧪 Interactive Tools, Simulations & Practice Portals
- Hands-on visualizers (e.g., PhET Interactive Simulations, Desmos, GeoGebra, Wolfram Alpha).
- Problem repositories, interactive coding or active recall tools (e.g., LeetCode, Brilliant, Project Euler).

### 5. 🎯 Suggested Study Sequence (How to consume these resources)
- **Step 1 (Warmup & Intuition)**: What video to watch first.
- **Step 2 (Deep Dive & Rigor)**: What book chapter or article to read.
- **Step 3 (Consolidation & Practice)**: Which simulation or problem set to solve.

Ensure all suggestions are real, reputable, and directly relevant to "${topic}". Respond in ${language}.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Chief Learning Resources Advisor. You curate precise, authoritative educational recommendations (videos, articles, books, and interactive tools) in ${language}.`,
        temperature: 0.4,
      },
    });

    return res.json({ resources: response.text || 'No recommendations generated.' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch learning recommendations');
  }
});

// 10. Audio Narration / Text-to-Speech via Gemini TTS
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const cleanText = text.slice(0, 1000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, engaging, articulate academic tutor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Could not generate speech audio' });
    }

    return res.json({ audio: base64Audio });
  } catch (error) {
    console.warn('[EduGenie TTS Error, client will fallback]:', error);
    return res.status(500).json({ error: 'TTS failed on server, using browser speech.' });
  }
});

// Dev vs Production static handling with Vite
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EduGenie server running on port ${PORT}`);
});
