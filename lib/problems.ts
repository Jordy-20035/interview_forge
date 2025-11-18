import { ollamaClient } from './ollama';
import { Problem, TestCase } from '@/types';
import { dbHelpers } from './db';

export class ProblemGenerator {
  static async generateProblem(
    interviewId: string,
    experienceLevel: string,
    language: string,
    problemIndex: number
  ): Promise<Problem> {
    // Get previous problems to avoid duplicates
    const previousProblems = dbHelpers.getProblems(interviewId);
    const previousTitles = previousProblems.map(p => p.title);

    // Generate using LLM
    const generated = await ollamaClient.generateProblem(
      experienceLevel,
      language,
      previousTitles
    );

    // Create test cases
    const testCases: TestCase[] = generated.testCases.map((tc: any, index: number) => ({
      id: `tc_${Date.now()}_${index}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden || false,
    }));

    // Create problem
    const problemId = dbHelpers.createProblem({
      interviewId,
      title: generated.title,
      description: generated.description,
      difficulty: generated.difficulty as 'easy' | 'medium' | 'hard',
      language,
      starterCode: generated.starterCode,
      testCases,
      hints: generated.hints,
      index: problemIndex,
    });

    const problem = dbHelpers.getProblem(problemId);
    if (!problem) {
      throw new Error('Failed to create problem');
    }

    return problem;
  }

  static getDifficultyProgression(experienceLevel: string): string[] {
    const progressions: Record<string, string[]> = {
      beginner: ['easy', 'easy', 'medium'],
      intermediate: ['easy', 'medium', 'medium', 'hard'],
      advanced: ['medium', 'hard', 'hard'],
    };

    return progressions[experienceLevel.toLowerCase()] || progressions.intermediate;
  }
}

