import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interview = dbHelpers.getInterview(params.id);
    
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const problems = dbHelpers.getProblems(params.id);
    const messages = dbHelpers.getMessages(params.id);
    const metrics = dbHelpers.getOrCreateMetrics(params.id);

    return NextResponse.json({
      interview,
      problems,
      messages,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    dbHelpers.updateInterview(params.id, updates);
    
    const interview = dbHelpers.getInterview(params.id);
    return NextResponse.json({ interview });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

