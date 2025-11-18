'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import CodeEditor from '@/components/CodeEditor';
import InterviewerChat from '@/components/InterviewerChat';
import Metrics from '@/components/Metrics';
import styles from './page.module.css';
import { Interview, Problem, Message, Metrics as MetricsType, TestResult } from '@/types';

export default function InterviewPage() {
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<MetricsType | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInterview();
  }, [interviewId]);

  const loadInterview = async () => {
    try {
      const response = await axios.get(`/api/interview/${interviewId}`);
      const data = response.data;

      setInterview(data.interview);
      setMessages(data.messages || []);
      setMetrics(data.metrics);

      if (data.problems && data.problems.length > 0) {
        const currentProblem = data.problems[data.interview.currentProblemIndex] || data.problems[0];
        setProblem(currentProblem);
        setCode(currentProblem.starterCode);
      }

      if (data.interview.status === 'pending') {
        // Interview not started yet
        showSetupDialog();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  const showSetupDialog = () => {
    const experienceLevel = prompt('What is your experience level? (beginner/intermediate/advanced)');
    const language = prompt('What programming language do you prefer? (python/javascript/java/cpp/typescript)');

    if (experienceLevel && language) {
      startInterview(experienceLevel, language);
    }
  };

  const startInterview = async (experienceLevel: string, language: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/interview/${interviewId}/start`, {
        experienceLevel: experienceLevel.toLowerCase(),
        language: language.toLowerCase(),
      });

      setInterview(response.data.interview);
      setProblem(response.data.problem);
      setCode(response.data.problem.starterCode);
      setMessages([{
        id: 'greeting',
        interviewId,
        role: 'interviewer',
        content: response.data.greeting,
        timestamp: new Date(),
        type: 'greeting',
      }]);

      await loadInterview();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || !code.trim()) return;

    setSubmitting(true);
    setError('');
    setShowResults(false);

    try {
      const response = await axios.post(`/api/interview/${interviewId}/submit`, {
        problemId: problem.id,
        code,
      });

      setTestResults(response.data.submission.testResults);
      setShowResults(true);

      // Reload to get updated messages and metrics
      await loadInterview();

      // If all tests passed, show success and prepare for next problem
      if (response.data.submission.status === 'passed') {
        setTimeout(() => {
          if (confirm('Great job! Would you like to try another problem?')) {
            generateNextProblem();
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  const generateNextProblem = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/interview/${interviewId}/problem/generate`);
      setProblem(response.data.problem);
      setCode(response.data.problem.starterCode);
      setTestResults(null);
      setShowResults(false);
      await loadInterview();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate next problem');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async () => {
    if (!problem || !code.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post('/api/execute/test', {
        code,
        language: problem.language,
        testCases: problem.testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      });

      setTestResults(response.data.results);
      setShowResults(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to run tests');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReport = async () => {
    try {
      const response = await axios.get(`/api/interview/${interviewId}/report`);
      const report = response.data.report;

      // Create a new window with the report
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`
          <html>
            <head>
              <title>Interview Report - ${report.candidateName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto; }
                h1 { color: #667eea; }
                .section { margin: 2rem 0; }
                .metric { display: inline-block; margin: 1rem; padding: 1rem; background: #f0f0f0; border-radius: 8px; }
                .problem { margin: 1rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
                .passed { color: green; }
                .failed { color: red; }
              </style>
            </head>
            <body>
              <h1>Interview Report</h1>
              <div class="section">
                <h2>Candidate: ${report.candidateName}</h2>
                <h2>Overall Score: ${report.overallScore}/100</h2>
              </div>
              <div class="section">
                <h3>Metrics</h3>
                <div class="metric">Problems Solved: ${report.metrics.problemsSolved}/${report.metrics.totalProblems}</div>
                <div class="metric">Total Attempts: ${report.metrics.totalAttempts}</div>
                <div class="metric">Test Pass Rate: ${Math.round(report.metrics.testPassRate * 100)}%</div>
                <div class="metric">Code Quality: ${Math.round(report.metrics.codeQualityScore)}%</div>
              </div>
              <div class="section">
                <h3>Problems</h3>
                ${report.problems.map((p: any) => `
                  <div class="problem">
                    <h4>${p.title} (${p.difficulty})</h4>
                    <p>Solved: ${p.solved ? 'Yes' : 'No'} | Attempts: ${p.attempts} | Code Quality: ${p.codeQuality}%</p>
                    <h5>Test Results:</h5>
                    ${p.testResults.map((tr: any) => `
                      <div class="${tr.passed ? 'passed' : 'failed'}">
                        Test: ${tr.passed ? 'PASSED' : 'FAILED'} - Expected: ${tr.expectedOutput}, Got: ${tr.actualOutput || 'Error'}
                      </div>
                    `).join('')}
                  </div>
                `).join('')}
              </div>
            </body>
          </html>
        `);
        reportWindow.document.close();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate report');
    }
  };

  if (loading && !interview) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading interview...</p>
      </div>
    );
  }

  if (!interview || !problem) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Interview not found or not started</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Interview Forge</h1>
        <div className={styles.headerActions}>
          <button onClick={handleViewReport} className={styles.reportButton}>
            View Report
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.main}>
        <div className={styles.leftColumn}>
          <div className={styles.problemSection}>
            <h2 className={styles.problemTitle}>{problem.title}</h2>
            <div className={styles.problemDifficulty}>
              Difficulty: <span className={styles[problem.difficulty]}>{problem.difficulty.toUpperCase()}</span>
            </div>
            <div className={styles.problemDescription}>
              {problem.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          <div className={styles.editorSection}>
            <CodeEditor
              language={problem.language}
              value={code}
              onChange={(value) => setCode(value || '')}
              height="400px"
            />
            <div className={styles.editorActions}>
              <button
                onClick={handleRunTests}
                className={styles.testButton}
                disabled={submitting}
              >
                Run Tests
              </button>
              <button
                onClick={handleSubmit}
                className={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            </div>
          </div>

          {showResults && testResults && (
            <div className={styles.testResults}>
              <h3>Test Results</h3>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`${styles.testResult} ${
                    result.passed ? styles.passed : styles.failed
                  }`}
                >
                  <div className={styles.testHeader}>
                    <span>Test {index + 1}</span>
                    <span>{result.passed ? '✓ PASSED' : '✗ FAILED'}</span>
                  </div>
                  <div className={styles.testDetails}>
                    <div>Input: <code>{result.input}</code></div>
                    <div>Expected: <code>{result.expectedOutput}</code></div>
                    {result.actualOutput && (
                      <div>Got: <code>{result.actualOutput}</code></div>
                    )}
                    {result.error && (
                      <div className={styles.testError}>Error: {result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          {metrics && (
            <Metrics
              metrics={metrics}
              interviewStartTime={interview.startedAt}
            />
          )}
          <InterviewerChat
            interviewId={interviewId}
            messages={messages}
            onNewMessage={loadInterview}
          />
        </div>
      </div>
    </div>
  );
}

