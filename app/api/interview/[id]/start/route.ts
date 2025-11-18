import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { ProblemGenerator } from '@/lib/problems';
import { ollamaClient } from '@/lib/ollama';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { experienceLevel, language } = await request.json();
    const interviewId = params.id;

    const interview = dbHelpers.getInterview(interviewId);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Update interview
    dbHelpers.updateInterview(interviewId, {
      status: 'in_progress',
      startedAt: new Date(),
      experienceLevel: experienceLevel || 'intermediate',
      language: language || 'python',
    });

    // Generate greeting message
    const greeting = await ollamaClient.generate(
      `Greet a candidate starting a technical interview. They have ${experienceLevel || 'intermediate'} experience level and prefer ${language || 'python'}. Be welcoming and professional.`,
      'You are a friendly technical interviewer.',
      { temperature: 0.7, maxTokens: 200 }
    );

    dbHelpers.createMessage({
      interviewId,
      role: 'interviewer',
      content: greeting,
      timestamp: new Date(),
      type: 'greeting',
    });

    // Generate first problem
    const problem = await ProblemGenerator.generateProblem(
      interviewId,
      experienceLevel || 'intermediate',
      language || 'python',
      0
    );

    // Update metrics
    dbHelpers.updateMetrics(interviewId, {
      totalProblems: 1,
    });

    return NextResponse.json({
      interview: dbHelpers.getInterview(interviewId),
      problem,
      greeting,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

