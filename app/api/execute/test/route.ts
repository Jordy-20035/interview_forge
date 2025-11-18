import { NextRequest, NextResponse } from 'next/server';
import { DockerSandbox } from '@/lib/docker';

export async function POST(request: NextRequest) {
  try {
    const { code, language, testCases } = await request.json();

    if (!code || !language || !testCases) {
      return NextResponse.json(
        { error: 'Code, language, and testCases are required' },
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

    const results = await DockerSandbox.testCode(code, language, testCases);

    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;

    return NextResponse.json({
      success: allPassed,
      results,
      summary: {
        passed: passedCount,
        total: results.length,
        passRate: passedCount / results.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

