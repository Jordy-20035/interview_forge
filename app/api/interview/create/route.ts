import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { candidateName } = await request.json();

    if (!candidateName) {
      return NextResponse.json(
        { error: 'Candidate name is required' },
        { status: 400 }
      );
    }

    const interviewId = dbHelpers.createInterview({
      candidateName,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      currentProblemIndex: 0,
      experienceLevel: null,
      language: null,
    });

    // Initialize metrics
    dbHelpers.getOrCreateMetrics(interviewId);

    return NextResponse.json({ interviewId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

