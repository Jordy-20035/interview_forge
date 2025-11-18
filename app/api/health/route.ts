import { NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ollama';
import { DockerSandbox } from '@/lib/docker';

export async function GET() {
  const checks = {
    ollama: false,
    docker: false,
    timestamp: new Date().toISOString(),
  };

  try {
    checks.ollama = await ollamaClient.checkConnection();
  } catch (error) {
    console.error('Ollama check failed:', error);
  }

  try {
    checks.docker = await DockerSandbox.checkDockerAvailability();
  } catch (error) {
    console.error('Docker check failed:', error);
  }

  const allHealthy = checks.ollama && checks.docker;

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}

