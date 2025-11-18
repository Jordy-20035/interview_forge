import Database from 'better-sqlite3';
import path from 'path';
import { Interview, Problem, Submission, Message, Metrics, Report } from '@/types';

const dbPath = path.join(process.cwd(), 'interview_forge.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    candidateName TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    startedAt INTEGER,
    completedAt INTEGER,
    currentProblemIndex INTEGER DEFAULT 0,
    experienceLevel TEXT,
    language TEXT
  );

  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    interviewId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    language TEXT NOT NULL,
    starterCode TEXT NOT NULL,
    testCases TEXT NOT NULL,
    hints TEXT NOT NULL,
    index INTEGER NOT NULL,
    FOREIGN KEY (interviewId) REFERENCES interviews(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    problemId TEXT NOT NULL,
    interviewId TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT NOT NULL,
    testResults TEXT NOT NULL,
    submittedAt INTEGER NOT NULL,
    attemptNumber INTEGER NOT NULL,
    executionTime INTEGER,
    FOREIGN KEY (problemId) REFERENCES problems(id),
    FOREIGN KEY (interviewId) REFERENCES interviews(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    interviewId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (interviewId) REFERENCES interviews(id)
  );

  CREATE TABLE IF NOT EXISTS metrics (
    interviewId TEXT PRIMARY KEY,
    totalProblems INTEGER DEFAULT 0,
    problemsSolved INTEGER DEFAULT 0,
    totalAttempts INTEGER DEFAULT 0,
    averageAttemptsPerProblem REAL DEFAULT 0,
    totalTimeSpent INTEGER DEFAULT 0,
    averageTimePerProblem REAL DEFAULT 0,
    testPassRate REAL DEFAULT 0,
    codeQualityScore REAL DEFAULT 0,
    hintsUsed INTEGER DEFAULT 0,
    cheatingFlags INTEGER DEFAULT 0,
    FOREIGN KEY (interviewId) REFERENCES interviews(id)
  );
`);

export const dbHelpers = {
  // Interview operations
  createInterview: (interview: Omit<Interview, 'id'>) => {
    const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO interviews (id, candidateName, status, startedAt, completedAt, currentProblemIndex, experienceLevel, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      interview.candidateName,
      interview.status,
      interview.startedAt?.getTime() || null,
      interview.completedAt?.getTime() || null,
      interview.currentProblemIndex,
      interview.experienceLevel,
      interview.language
    );
    return id;
  },

  getInterview: (id: string): Interview | null => {
    const stmt = db.prepare('SELECT * FROM interviews WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      startedAt: row.startedAt ? new Date(row.startedAt) : null,
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
    };
  },

  updateInterview: (id: string, updates: Partial<Interview>) => {
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'startedAt' || key === 'completedAt') {
          fields.push(`${key} = ?`);
          values.push(value ? (value as Date).getTime() : null);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });
    
    if (fields.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE interviews SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  },

  // Problem operations
  createProblem: (problem: Omit<Problem, 'id'>) => {
    const id = `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO problems (id, interviewId, title, description, difficulty, language, starterCode, testCases, hints, index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      problem.interviewId,
      problem.title,
      problem.description,
      problem.difficulty,
      problem.language,
      problem.starterCode,
      JSON.stringify(problem.testCases),
      JSON.stringify(problem.hints),
      problem.index
    );
    return id;
  },

  getProblems: (interviewId: string): Problem[] => {
    const stmt = db.prepare('SELECT * FROM problems WHERE interviewId = ? ORDER BY index');
    const rows = stmt.all(interviewId) as any[];
    return rows.map(row => ({
      ...row,
      testCases: JSON.parse(row.testCases),
      hints: JSON.parse(row.hints),
    }));
  },

  getProblem: (id: string): Problem | null => {
    const stmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      testCases: JSON.parse(row.testCases),
      hints: JSON.parse(row.hints),
    };
  },

  // Submission operations
  createSubmission: (submission: Omit<Submission, 'id'>) => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO submissions (id, problemId, interviewId, code, language, status, testResults, submittedAt, attemptNumber, executionTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      submission.problemId,
      submission.interviewId,
      submission.code,
      submission.language,
      submission.status,
      JSON.stringify(submission.testResults),
      submission.submittedAt.getTime(),
      submission.attemptNumber,
      submission.executionTime
    );
    return id;
  },

  getSubmissions: (problemId: string): Submission[] => {
    const stmt = db.prepare('SELECT * FROM submissions WHERE problemId = ? ORDER BY submittedAt');
    const rows = stmt.all(problemId) as any[];
    return rows.map(row => ({
      ...row,
      testResults: JSON.parse(row.testResults),
      submittedAt: new Date(row.submittedAt),
    }));
  },

  // Message operations
  createMessage: (message: Omit<Message, 'id'>) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO messages (id, interviewId, role, content, timestamp, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      message.interviewId,
      message.role,
      message.content,
      message.timestamp.getTime(),
      message.type
    );
    return id;
  },

  getMessages: (interviewId: string): Message[] => {
    const stmt = db.prepare('SELECT * FROM messages WHERE interviewId = ? ORDER BY timestamp');
    const rows = stmt.all(interviewId) as any[];
    return rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
    }));
  },

  // Metrics operations
  getOrCreateMetrics: (interviewId: string): Metrics => {
    const stmt = db.prepare('SELECT * FROM metrics WHERE interviewId = ?');
    let row = stmt.get(interviewId) as any;
    
    if (!row) {
      const insertStmt = db.prepare('INSERT INTO metrics (interviewId) VALUES (?)');
      insertStmt.run(interviewId);
      row = { interviewId, totalProblems: 0, problemsSolved: 0, totalAttempts: 0, averageAttemptsPerProblem: 0, totalTimeSpent: 0, averageTimePerProblem: 0, testPassRate: 0, codeQualityScore: 0, hintsUsed: 0, cheatingFlags: 0 };
    }
    
    return row;
  },

  updateMetrics: (interviewId: string, updates: Partial<Metrics>) => {
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'interviewId') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (fields.length > 0) {
      values.push(interviewId);
      const stmt = db.prepare(`UPDATE metrics SET ${fields.join(', ')} WHERE interviewId = ?`);
      stmt.run(...values);
    }
  },
};

export default db;

