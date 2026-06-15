export interface Option {
  id?: number;
  key?: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Question {
  id?: number;
  key?: string;
  questionText: string;
  questionType: string;
  options: Option[];
}

export interface Quiz {
  id?: number;
  title: string;
  description: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  questions: Question[];
}

export interface Lesson {
  id: number;
  sectionId?: number;
  title: string;
  contentType: "video" | "document" | "quiz";
  contentUrl: string | null;
  durationSeconds: number;
  isPreview: boolean;
  orderIndex: number;
  quiz?: Quiz | null;
  attachments?: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
}

export interface Section {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}
