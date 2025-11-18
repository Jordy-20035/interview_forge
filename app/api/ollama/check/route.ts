import { NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ollama';

export async function GET() {
  try {
    const isConnected = await ollamaClient.checkConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { connected: false, error: 'Ollama is not running. Please start Ollama and pull a model (e.g., ollama pull codellama)' },
        { status: 503 }
      );
    }

    return NextResponse.json({ connected: true });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}

