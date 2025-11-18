'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './InterviewerChat.module.css';
import { Message } from '@/types';

interface InterviewerChatProps {
  interviewId: string;
  messages: Message[];
  onNewMessage?: () => void;
}

export default function InterviewerChat({
  interviewId,
  messages,
  onNewMessage,
}: InterviewerChatProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageContent = input.trim();
    setInput('');
    setLoading(true);

    try {
      await axios.post(`/api/interview/${interviewId}/message`, {
        content: messageContent,
        type: 'response',
      });

      if (onNewMessage) {
        onNewMessage();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>💬 Interviewer Chat</h3>
      </div>
      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.role === 'interviewer' ? styles.interviewer : styles.candidate
            }`}
          >
            <div className={styles.messageContent}>
              {message.content}
            </div>
            <div className={styles.timestamp}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.interviewer}`}>
            <div className={styles.messageContent}>
              <span className={styles.typing}>Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className={styles.input}
          disabled={loading}
        />
        <button type="submit" className={styles.sendButton} disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

