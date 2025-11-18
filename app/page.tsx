'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/interview/create', {
        candidateName: candidateName.trim(),
      });

      router.push(`/interview/${response.data.interviewId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create interview');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Interview Forge</h1>
        <p className={styles.subtitle}>
          AI-Powered Technical Interview Platform
        </p>
        <p className={styles.description}>
          Practice coding interviews with an AI interviewer. All models run locally for privacy.
        </p>

        <form onSubmit={handleStart} className={styles.form}>
          <input
            type="text"
            placeholder="Enter your name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🤖 Local AI</h3>
            <p>Powered by Ollama - runs completely offline</p>
          </div>
          <div className={styles.feature}>
            <h3>💻 Browser IDE</h3>
            <p>Code directly in your browser with syntax highlighting</p>
          </div>
          <div className={styles.feature}>
            <h3>🐳 Secure Execution</h3>
            <p>Docker-based sandbox for safe code execution</p>
          </div>
          <div className={styles.feature}>
            <h3>📊 Detailed Reports</h3>
            <p>Comprehensive performance analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

