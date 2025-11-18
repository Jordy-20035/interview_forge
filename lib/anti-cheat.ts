// Anti-cheating measures

export interface ActivityTracker {
  startTime: Date;
  lastActivity: Date;
  inactivityTime: number;
  tabSwitches: number;
  copyEvents: number;
  pasteEvents: number;
  suspiciousPatterns: string[];
}

export class AntiCheatTracker {
  private tracker: ActivityTracker;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.tracker = {
      startTime: new Date(),
      lastActivity: new Date(),
      inactivityTime: 0,
      tabSwitches: 0,
      copyEvents: 0,
      pasteEvents: 0,
      suspiciousPatterns: [],
    };
  }

  start() {
    // Monitor tab visibility
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.tracker.tabSwitches++;
          this.flagSuspicious('Tab switch detected');
        } else {
          this.updateActivity();
        }
      });

      // Monitor copy/paste
      document.addEventListener('copy', () => {
        this.tracker.copyEvents++;
        if (this.tracker.copyEvents > 5) {
          this.flagSuspicious('Excessive copy events');
        }
      });

      document.addEventListener('paste', () => {
        this.tracker.pasteEvents++;
        if (this.tracker.pasteEvents > 3) {
          this.flagSuspicious('Paste detected - copying code is not allowed');
        }
      });

      // Monitor keyboard activity
      document.addEventListener('keydown', () => {
        this.updateActivity();
      });

      // Monitor mouse activity
      document.addEventListener('mousemove', () => {
        this.updateActivity();
      });

      // Periodic inactivity check
      this.checkInterval = setInterval(() => {
        const now = new Date();
        const inactiveTime = now.getTime() - this.tracker.lastActivity.getTime();
        
        if (inactiveTime > 5 * 60 * 1000) { // 5 minutes
          this.tracker.inactivityTime = inactiveTime;
          this.flagSuspicious('Extended inactivity period');
        }
      }, 60000); // Check every minute
    }
  }

  private updateActivity() {
    this.tracker.lastActivity = new Date();
  }

  private flagSuspicious(pattern: string) {
    if (!this.tracker.suspiciousPatterns.includes(pattern)) {
      this.tracker.suspiciousPatterns.push(pattern);
    }
  }

  getMetrics() {
    return {
      ...this.tracker,
      totalTime: Date.now() - this.tracker.startTime.getTime(),
      cheatingFlags: this.tracker.suspiciousPatterns.length,
    };
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  getCheatingScore(): number {
    let score = 0;
    
    // Tab switches (each switch = 10 points)
    score += this.tracker.tabSwitches * 10;
    
    // Copy events (each after 5 = 5 points)
    score += Math.max(0, this.tracker.copyEvents - 5) * 5;
    
    // Paste events (each after 1 = 20 points)
    score += Math.max(0, this.tracker.pasteEvents - 1) * 20;
    
    // Extended inactivity (more than 10 minutes = 15 points)
    if (this.tracker.inactivityTime > 10 * 60 * 1000) {
      score += 15;
    }

    return Math.min(100, score); // Cap at 100
  }
}

// Time-based cheating detection
export function detectSuspiciousTiming(
  submissionTimes: Date[],
  problemDifficulty: string
): boolean {
  if (submissionTimes.length < 2) return false;

  const difficulties: Record<string, number> = {
    easy: 5 * 60 * 1000,    // 5 minutes minimum
    medium: 10 * 60 * 1000, // 10 minutes minimum
    hard: 15 * 60 * 1000,   // 15 minutes minimum
  };

  const minTime = difficulties[problemDifficulty] || 10 * 60 * 1000;

  for (let i = 1; i < submissionTimes.length; i++) {
    const timeDiff = submissionTimes[i].getTime() - submissionTimes[i - 1].getTime();
    
    // If solutions are submitted too quickly (less than expected time)
    if (timeDiff < minTime) {
      return true;
    }
  }

  return false;
}

// Code similarity detection (basic)
export function detectCodePlagiarism(code: string, previousCodes: string[]): boolean {
  if (previousCodes.length === 0) return false;

  // Simple approach: check if code is identical or very similar
  const normalizedCode = normalizeCode(code);

  for (const prevCode of previousCodes) {
    const normalizedPrev = normalizeCode(prevCode);
    
    // Check for identical code
    if (normalizedCode === normalizedPrev) {
      return true;
    }

    // Check for high similarity (simple line-based comparison)
    const similarity = calculateSimilarity(normalizedCode, normalizedPrev);
    if (similarity > 0.9) {
      return true;
    }
  }

  return false;
}

function normalizeCode(code: string): string {
  return code
    .replace(/\s+/g, ' ')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
    .toLowerCase();
}

function calculateSimilarity(str1: string, str2: string): number {
  const lines1 = str1.split('\n').filter(l => l.trim());
  const lines2 = str2.split('\n').filter(l => l.trim());

  if (lines1.length === 0 || lines2.length === 0) return 0;

  const matches = lines1.filter(line => lines2.includes(line)).length;
  return matches / Math.max(lines1.length, lines2.length);
}

