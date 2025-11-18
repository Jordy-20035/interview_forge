import { NextRequest, NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ollama';

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt, context, conversationHistory } = await request.json();

    let response: string;

    if (context && conversationHistory) {
      // Interviewer response with context
      response = await ollamaClient.generateInterviewerResponse(context, conversationHistory);
    } else {
      // Simple generation
      response = await ollamaClient.generate(prompt, systemPrompt);
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

