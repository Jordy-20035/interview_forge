import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { ollamaClient } from '@/lib/ollama';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, type } = await request.json();
    const interviewId = params.id;

    // Save candidate message
    dbHelpers.createMessage({
      interviewId,
      role: 'candidate',
      content,
      timestamp: new Date(),
      type: type || 'response',
    });

    // Get conversation history
    const messages = dbHelpers.getMessages(interviewId);
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role === 'interviewer' ? 'assistant' as const : 'user' as const,
      content: msg.content,
    }));

    // Get interview context
    const interview = dbHelpers.getInterview(interviewId);
    const problems = dbHelpers.getProblems(interviewId);
    const currentProblem = problems[interview?.currentProblemIndex || 0];

    const context = currentProblem
      ? `Current problem: ${currentProblem.title}. Candidate is working on: ${currentProblem.description}`
      : 'Interview in progress';

    // Generate interviewer response
    const response = await ollamaClient.generateInterviewerResponse(
      context,
      conversationHistory
    );

    // Save interviewer message
    dbHelpers.createMessage({
      interviewId,
      role: 'interviewer',
      content: response,
      timestamp: new Date(),
      type: 'feedback',
    });

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

