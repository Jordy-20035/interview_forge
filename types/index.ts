export interface Interview {
  id: string;
  candidateName: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: Date | null;
  completedAt: Date | null;
  currentProblemIndex: number;
  experienceLevel: string | null;
  language: string | null;
}

export interface Problem {
  id: string;
  interviewId: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  starterCode: string;
  testCases: TestCase[];
  hints: string[];
  index: number;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Submission {
  id: string;
  problemId: string;
  interviewId: string;
  code: string;
  language: string;
  status: 'running' | 'passed' | 'failed' | 'error';
  testResults: TestResult[];
  submittedAt: Date;
  attemptNumber: number;
  executionTime: number | null;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  error: string | null;
  executionTime: number;
}

export interface Message {
  id: string;
  interviewId: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  type: 'greeting' | 'question' | 'feedback' | 'hint' | 'evaluation' | 'response';
}

export interface Metrics {
  interviewId: string;
  totalProblems: number;
  problemsSolved: number;
  totalAttempts: number;
  averageAttemptsPerProblem: number;
  totalTimeSpent: number;
  averageTimePerProblem: number;
  testPassRate: number;
  codeQualityScore: number;
  hintsUsed: number;
  cheatingFlags: number;
}

export interface Report {
  interviewId: string;
  candidateName: string;
  overallScore: number;
  metrics: Metrics;
  problems: ProblemReport[];
  messages: Message[];
  generatedAt: Date;
}

export interface ProblemReport {
  problemId: string;
  title: string;
  difficulty: string;
  solved: boolean;
  attempts: number;
  timeSpent: number;
  testResults: TestResult[];
  codeQuality: number;
  hintsUsed: number;
}

