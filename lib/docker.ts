import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const docker = new Docker();

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string | null;
  executionTime: number;
}

export class DockerSandbox {
  private static readonly MAX_EXECUTION_TIME = 10000; // 10 seconds
  private static readonly MEMORY_LIMIT = 256 * 1024 * 1024; // 256 MB

  private static getLanguageConfig(language: string): {
    image: string;
    compileCommand?: string;
    runCommand: string;
    extension: string;
    fileName: string;
  } {
    const configs: Record<string, any> = {
      python: {
        image: 'python:3.11-slim',
        runCommand: 'python /sandbox/code.py',
        extension: 'py',
        fileName: 'code.py',
      },
      javascript: {
        image: 'node:18-slim',
        runCommand: 'node /sandbox/code.js',
        extension: 'js',
        fileName: 'code.js',
      },
      typescript: {
        image: 'node:18-slim',
        compileCommand: 'npm install -g typescript && tsc /sandbox/code.ts',
        runCommand: 'node /sandbox/code.js',
        extension: 'ts',
        fileName: 'code.ts',
      },
      java: {
        image: 'openjdk:17-jdk-slim',
        compileCommand: 'javac /sandbox/Main.java',
        runCommand: 'java -cp /sandbox Main',
        extension: 'java',
        fileName: 'Main.java',
      },
      cpp: {
        image: 'gcc:latest',
        compileCommand: 'g++ -o /sandbox/code /sandbox/code.cpp',
        runCommand: '/sandbox/code',
        extension: 'cpp',
        fileName: 'code.cpp',
      },
    };

    return configs[language.toLowerCase()] || configs.python;
  }

  static async executeCode(
    code: string,
    language: string,
    input: string = ''
  ): Promise<ExecutionResult> {
    const config = this.getLanguageConfig(language);
    const containerId = uuidv4();
    const sandboxDir = path.join(process.cwd(), 'docker-sandbox', containerId);

    try {
      // Create sandbox directory
      fs.mkdirSync(sandboxDir, { recursive: true });

      // Write code to file
      const codePath = path.join(sandboxDir, config.fileName);
      fs.writeFileSync(codePath, code);

      // Create container
      const container = await docker.createContainer({
        Image: config.image,
        Cmd: ['sh', '-c', 'tail -f /dev/null'], // Keep container running
        HostConfig: {
          Memory: this.MEMORY_LIMIT,
          MemorySwap: this.MEMORY_LIMIT,
          NetworkMode: 'none', // No network access
          AutoRemove: true,
          Binds: [`${sandboxDir}:/sandbox`],
        },
        WorkingDir: '/sandbox',
        AttachStdout: true,
        AttachStderr: true,
      });

      await container.start();

      try {
        const startTime = Date.now();

        // Compile if needed
        if (config.compileCommand) {
          const compileExec = await container.exec({
            Cmd: ['sh', '-c', config.compileCommand],
            AttachStdout: true,
            AttachStderr: true,
          });

          const compileStream = await compileExec.start({ hijack: true, stdin: false });
          const compileOutput = await this.getStreamOutput(compileStream);

          if (compileOutput.stderr) {
            return {
              success: false,
              output: '',
              error: compileOutput.stderr,
              executionTime: Date.now() - startTime,
            };
          }
        }

        // Execute code
        const runCommand = input 
          ? `echo "${input.replace(/"/g, '\\"')}" | ${config.runCommand}`
          : config.runCommand;

        const exec = await container.exec({
          Cmd: ['sh', '-c', `timeout ${this.MAX_EXECUTION_TIME / 1000} ${runCommand}`],
          AttachStdout: true,
          AttachStderr: true,
        });

        const stream = await exec.start({ hijack: true, stdin: false });
        const output = await this.getStreamOutput(stream);
        const executionTime = Date.now() - startTime;

        return {
          success: !output.stderr && output.stdout !== null,
          output: output.stdout || '',
          error: output.stderr || null,
          executionTime,
        };
      } finally {
        try {
          await container.stop({ t: 0 });
          await container.remove();
        } catch (error) {
          console.error('Error cleaning up container:', error);
        }
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Execution failed',
        executionTime: 0,
      };
    } finally {
      // Clean up sandbox directory
      try {
        if (fs.existsSync(sandboxDir)) {
          fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
      } catch (error) {
        console.error('Error cleaning up sandbox:', error);
      }
    }
  }

  private static async getStreamOutput(stream: NodeJS.ReadableStream): Promise<{
    stdout: string | null;
    stderr: string | null;
  }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      stream.on('data', (chunk: Buffer) => {
        const header = chunk.slice(0, 8);
        const payload = chunk.slice(8);

        if (header[0] === 1) {
          stdout += payload.toString();
        } else if (header[0] === 2) {
          stderr += payload.toString();
        }
      });

      stream.on('end', () => {
        resolve({
          stdout: stdout || null,
          stderr: stderr || null,
        });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({
          stdout: stdout || null,
          stderr: stderr || (stdout ? null : 'Execution timeout'),
        });
      }, 5000);
    });
  }

  static async testCode(
    code: string,
    language: string,
    testCases: Array<{ input: string; expectedOutput: string }>
  ): Promise<Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string | null;
    passed: boolean;
    error: string | null;
    executionTime: number;
  }>> {
    const results = [];

    for (const testCase of testCases) {
      const result = await this.executeCode(code, language, testCase.input);
      
      const actualOutput = result.output?.trim() || null;
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput && result.success;

      results.push({
        input: testCase.input,
        expectedOutput,
        actualOutput,
        passed,
        error: result.error,
        executionTime: result.executionTime,
      });
    }

    return results;
  }

  static async checkDockerAvailability(): Promise<boolean> {
    try {
      await docker.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

