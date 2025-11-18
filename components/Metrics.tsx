'use client';

import { Metrics as MetricsType } from '@/types';
import styles from './Metrics.module.css';

interface MetricsProps {
  metrics: MetricsType;
  interviewStartTime: Date | null;
}

export default function Metrics({ metrics, interviewStartTime }: MetricsProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentTime = interviewStartTime
    ? Math.max(0, Date.now() - interviewStartTime.getTime())
    : 0;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>📊 Metrics</h3>
      <div className={styles.grid}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Problems Solved</div>
          <div className={styles.metricValue}>
            {metrics.problemsSolved} / {metrics.totalProblems}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total Attempts</div>
          <div className={styles.metricValue}>{metrics.totalAttempts}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Test Pass Rate</div>
          <div className={styles.metricValue}>
            {Math.round(metrics.testPassRate * 100)}%
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Time Spent</div>
          <div className={styles.metricValue}>
            {interviewStartTime ? formatTime(currentTime) : '0:00'}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Code Quality</div>
          <div className={styles.metricValue}>
            {Math.round(metrics.codeQualityScore)}%
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Avg Attempts/Problem</div>
          <div className={styles.metricValue}>
            {metrics.averageAttemptsPerProblem.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}

