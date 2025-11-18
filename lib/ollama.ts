import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaClient {
  private model: string;
  private baseUrl: string;

  constructor(model: string = 'codellama', baseUrl: string = OLLAMA_BASE_URL) {
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.status === 200;
    } catch (error) {
      console.error('Ollama connection failed:', error);
      return false;
    }
  }

  async generate(prompt: string, systemPrompt?: string, options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      const messages: OllamaMessage[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages,
          stream: options?.stream || false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2000,
          },
        },
        {
          timeout: 60000,
        }
      );

      if (options?.stream) {
        // Handle streaming response
        return response.data as any;
      }

      return response.data.message?.content || '';
    } catch (error: any) {
      console.error('Ollama generation error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async streamGenerate(
    prompt: string,
    systemPrompt?: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const messages: OllamaMessage[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages,
          stream: true,
          options: {
            temperature: 0.7,
            num_predict: 2000,
          },
        },
        {
          responseType: 'stream',
          timeout: 60000,
        }
      );

      let buffer = '';

      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                onChunk(data.message.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.message?.content) {
            onChunk(data.message.content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    } catch (error: any) {
      console.error('Ollama streaming error:', error);
      throw new Error(`Failed to stream response: ${error.message}`);
    }
  }

  async generateProblem(
    experienceLevel: string,
    language: string,
    previousProblems: string[] = []
  ): Promise<{ title: string; description: string; difficulty: string; starterCode: string; testCases: any[]; hints: string[] }> {
    const systemPrompt = `You are an expert technical interviewer generating coding problems. 
Generate problems that are appropriate for the candidate's experience level.
Return your response as a JSON object with the following structure:
{
  "title": "Problem title",
  "description": "Detailed problem description with examples",
  "difficulty": "easy" | "medium" | "hard",
  "starterCode": "Initial code template with function signature",
  "testCases": [
    {"input": "test input", "expectedOutput": "expected output", "isHidden": false},
    {"input": "test input 2", "expectedOutput": "expected output 2", "isHidden": true}
  ],
  "hints": ["hint 1", "hint 2", "hint 3"]
}`;

    const previousProblemsText = previousProblems.length > 0 
      ? `\n\nPrevious problems given: ${previousProblems.join(', ')}` 
      : '';

    const prompt = `Generate a ${experienceLevel}-level coding problem in ${language}.

Requirements:
- Appropriate difficulty for ${experienceLevel} level
- Clear problem description with examples
- Provide a function signature or class structure as starter code
- Include 3-5 test cases (mix of visible and hidden)
- Provide 2-3 helpful hints
${previousProblemsText}

Return ONLY the JSON object, no markdown formatting.`;

    try {
      const response = await this.generate(prompt, systemPrompt, { temperature: 0.8 });
      
      // Extract JSON from response (handle markdown code blocks if present)
      let jsonStr = response.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const problem = JSON.parse(jsonStr);
      
      // Validate and set defaults
      return {
        title: problem.title || 'Coding Problem',
        description: problem.description || '',
        difficulty: problem.difficulty || 'medium',
        starterCode: problem.starterCode || '',
        testCases: problem.testCases || [],
        hints: problem.hints || [],
      };
    } catch (error: any) {
      console.error('Problem generation error:', error);
      // Return a fallback problem
      return this.getFallbackProblem(language, experienceLevel);
    }
  }

  private getFallbackProblem(language: string, level: string): any {
    const problems: Record<string, Record<string, any>> = {
      python: {
        easy: {
          title: 'Sum of Two Numbers',
          description: 'Write a function that takes two numbers as input and returns their sum.',
          difficulty: 'easy',
          starterCode: 'def add(a, b):\n    # Your code here\n    pass',
          testCases: [
            { input: '2, 3', expectedOutput: '5', isHidden: false },
            { input: '-1, 1', expectedOutput: '0', isHidden: false },
            { input: '100, 200', expectedOutput: '300', isHidden: true },
          ],
          hints: ['Think about simple arithmetic operations', 'Make sure to handle negative numbers'],
        },
        medium: {
          title: 'Find Maximum in Array',
          description: 'Write a function that finds the maximum value in an array without using built-in max() function.',
          difficulty: 'medium',
          starterCode: 'def find_max(arr):\n    # Your code here\n    pass',
          testCases: [
            { input: '[1, 3, 2]', expectedOutput: '3', isHidden: false },
            { input: '[-1, -3, -2]', expectedOutput: '-1', isHidden: false },
            { input: '[5, 5, 5]', expectedOutput: '5', isHidden: true },
          ],
          hints: ['Iterate through the array', 'Keep track of the maximum value seen so far'],
        },
      },
      javascript: {
        easy: {
          title: 'Sum of Two Numbers',
          description: 'Write a function that takes two numbers as input and returns their sum.',
          difficulty: 'easy',
          starterCode: 'function add(a, b) {\n    // Your code here\n}',
          testCases: [
            { input: '2, 3', expectedOutput: '5', isHidden: false },
            { input: '-1, 1', expectedOutput: '0', isHidden: false },
            { input: '100, 200', expectedOutput: '300', isHidden: true },
          ],
          hints: ['Think about simple arithmetic operations', 'Make sure to handle negative numbers'],
        },
        medium: {
          title: 'Find Maximum in Array',
          description: 'Write a function that finds the maximum value in an array without using Math.max().',
          difficulty: 'medium',
          starterCode: 'function findMax(arr) {\n    // Your code here\n}',
          testCases: [
            { input: '[1, 3, 2]', expectedOutput: '3', isHidden: false },
            { input: '[-1, -3, -2]', expectedOutput: '-1', isHidden: false },
            { input: '[5, 5, 5]', expectedOutput: '5', isHidden: true },
          ],
          hints: ['Iterate through the array', 'Keep track of the maximum value seen so far'],
        },
      },
    };

    return problems[language]?.[level] || problems.python.easy;
  }

  async generateInterviewerResponse(
    context: string,
    conversationHistory: OllamaMessage[]
  ): Promise<string> {
    const systemPrompt = `You are a professional, friendly, and helpful technical interviewer.
Your role is to:
- Guide candidates through coding problems
- Provide helpful feedback without giving away solutions
- Ask clarifying questions when needed
- Encourage candidates and keep them motivated
- Evaluate solutions and provide constructive criticism

Be conversational, professional, and supportive. Keep responses concise (2-3 sentences maximum unless providing detailed feedback).`;

    const historyText = conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Context: ${context}

Conversation history:
${historyText}

Generate an appropriate response as the interviewer:`;

    return await this.generate(prompt, systemPrompt, { temperature: 0.7, maxTokens: 500 });
  }

  async evaluateSolution(
    problemDescription: string,
    solution: string,
    testResults: any[]
  ): Promise<string> {
    const systemPrompt = `You are evaluating a coding solution. Provide constructive feedback on:
1. Code correctness
2. Code quality and style
3. Algorithm efficiency
4. Edge case handling

Be specific and helpful.`;

    const testResultsSummary = testResults
      .map((r, i) => `Test ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}${r.error ? ` - ${r.error}` : ''}`)
      .join('\n');

    const prompt = `Problem: ${problemDescription}

Solution:
\`\`\`
${solution}
\`\`\`

Test Results:
${testResultsSummary}

Provide your evaluation:`;

    return await this.generate(prompt, systemPrompt, { temperature: 0.5, maxTokens: 800 });
  }
}

export const ollamaClient = new OllamaClient();

