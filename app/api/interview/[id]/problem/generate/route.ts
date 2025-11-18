import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { ProblemGenerator } from '@/lib/problems';

export async function POST(
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

    if (!interview.experienceLevel || !interview.language) {
      return NextResponse.json(
        { error: 'Interview must be started first' },
        { status: 400 }
      );
    }

    const currentProblems = dbHelpers.getProblems(interviewId);
    const nextIndex = currentProblems.length;

    // Check if we should generate more problems
    const difficultyProgression = ProblemGenerator.getDifficultyProgression(
      interview.experienceLevel
    );

    if (nextIndex >= difficultyProgression.length) {
      return NextResponse.json(
        { error: 'Maximum number of problems reached' },
        { status: 400 }
      );
    }

    const problem = await ProblemGenerator.generateProblem(
      interviewId,
      interview.experienceLevel,
      interview.language,
      nextIndex
    );

    // Update interview
    dbHelpers.updateInterview(interviewId, {
      currentProblemIndex: nextIndex,
    });

    // Update metrics
    const metrics = dbHelpers.getOrCreateMetrics(interviewId);
    dbHelpers.updateMetrics(interviewId, {
      totalProblems: metrics.totalProblems + 1,
    });

    return NextResponse.json({ problem });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

