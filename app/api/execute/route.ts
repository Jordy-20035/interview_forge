import { NextRequest, NextResponse } from 'next/server';
import { DockerSandbox } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { code, language, input } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    // Check Docker availability
    const dockerAvailable = await DockerSandbox.checkDockerAvailability();
    if (!dockerAvailable) {
      return NextResponse.json(
        { error: 'Docker is not available. Please ensure Docker is running.' },
        { status: 503 }
      );
    }

    const result = await DockerSandbox.executeCode(code, language, input || '');

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

