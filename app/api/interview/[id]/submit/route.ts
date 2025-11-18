import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';
import { DockerSandbox } from '@/lib/docker';
import { ollamaClient } from '@/lib/ollama';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { problemId, code } = await request.json();
    const interviewId = params.id;

    const interview = dbHelpers.getInterview(interviewId);
    const problem = dbHelpers.getProblem(problemId);

    if (!interview || !problem) {
      return NextResponse.json(
        { error: 'Interview or problem not found' },
        { status: 404 }
      );
    }

    // Get previous submissions for attempt number
    const previousSubmissions = dbHelpers.getSubmissions(problemId);
    const attemptNumber = previousSubmissions.length + 1;

    // Test the code
    const testResults = await DockerSandbox.testCode(
      code,
      problem.language,
      problem.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }))
    );

    // Map to our test result format
    const formattedResults = testResults.map((result, index) => ({
      testCaseId: problem.testCases[index]?.id || `tc_${index}`,
      passed: result.passed,
      input: result.input,
      expectedOutput: result.expectedOutput,
      actualOutput: result.actualOutput,
      error: result.error || null,
      executionTime: result.executionTime,
    }));

    const allPassed = formattedResults.every(r => r.passed);
    const status = allPassed ? 'passed' : 'failed';

    // Create submission
    const submissionId = dbHelpers.createSubmission({
      problemId,
      interviewId,
      code,
      language: problem.language,
      status,
      testResults: formattedResults,
      submittedAt: new Date(),
      attemptNumber,
      executionTime: testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length,
    });

    // Update metrics
    const metrics = dbHelpers.getOrCreateMetrics(interviewId);
    dbHelpers.updateMetrics(interviewId, {
      totalAttempts: metrics.totalAttempts + 1,
      averageAttemptsPerProblem: (metrics.totalAttempts + 1) / (metrics.totalProblems || 1),
    });

    if (allPassed) {
      dbHelpers.updateMetrics(interviewId, {
        problemsSolved: metrics.problemsSolved + 1,
      });
    }

    // Generate interviewer feedback
    const problemDescription = `${problem.title}: ${problem.description}`;
    const feedback = await ollamaClient.evaluateSolution(
      problemDescription,
      code,
      formattedResults
    );

    dbHelpers.createMessage({
      interviewId,
      role: 'interviewer',
      content: feedback,
      timestamp: new Date(),
      type: allPassed ? 'evaluation' : 'feedback',
    });

    return NextResponse.json({
      submission: {
        id: submissionId,
        status,
        testResults: formattedResults,
        attemptNumber,
      },
      feedback,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

