import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { Report, ProblemReport } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;

    const interview = dbHelpers.getInterview(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const problems = dbHelpers.getProblems(interviewId);
    const messages = dbHelpers.getMessages(interviewId);
    const metrics = dbHelpers.getOrCreateMetrics(interviewId);

    // Build problem reports
    const problemReports: ProblemReport[] = problems.map(problem => {
      const submissions = dbHelpers.getSubmissions(problem.id);
      const successfulSubmission = submissions.find(s => s.status === 'passed');
      const solved = !!successfulSubmission;

      const attempts = submissions.length;
      const timeSpent = submissions.reduce((sum, s) => sum + (s.executionTime || 0), 0);

      // Calculate code quality (simplified - based on attempts and solution correctness)
      const codeQuality = solved
        ? Math.max(0, 100 - (attempts - 1) * 10)
        : Math.max(0, 50 - attempts * 5);

      return {
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        solved,
        attempts,
        timeSpent,
        testResults: successfulSubmission?.testResults || [],
        codeQuality,
        hintsUsed: 0, // Could track this if needed
      };
    });

    // Calculate overall score
    const overallScore =
      (metrics.testPassRate * 40 +
        metrics.codeQualityScore * 30 +
        (metrics.problemsSolved / metrics.totalProblems) * 30) || 0;

    const report: Report = {
      interviewId,
      candidateName: interview.candidateName,
      overallScore: Math.round(overallScore),
      metrics,
      problems: problemReports,
      messages,
      generatedAt: new Date(),
    };

    // Mark interview as completed
    if (interview.status === 'in_progress') {
      dbHelpers.updateInterview(interviewId, {
        status: 'completed',
        completedAt: new Date(),
      });
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

