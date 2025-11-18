# Interview Forge

A complete AI-powered technical interview platform with a virtual interviewer. All models run locally using Ollama.

## Features

- 🤖 **Local LLM Interviewer** - Powered by Ollama, runs completely offline
- 📝 **Adaptive Problem Generation** - AI generates coding challenges based on skill level
- 💻 **Browser-Based IDE** - Monaco Editor with syntax highlighting for multiple languages
- 🐳 **Code Execution Sandbox** - Docker-based isolated environment for safe code execution
- ✅ **Auto-Testing** - Automated test framework validates solutions
- 💬 **Real-Time Dialogue** - Interactive conversation with virtual interviewer
- 📊 **Metrics Tracking** - Comprehensive performance analytics
- 🛡️ **Anti-Cheating** - Time tracking and activity monitoring
- 📄 **Report Generation** - Detailed candidate evaluation reports

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Docker** - For code execution isolation [Download](https://www.docker.com/get-started)
3. **Ollama** - For local LLM capabilities [Download](https://ollama.ai)

### Setting Up Ollama

After installing Ollama:

```bash
# Pull a coding model (recommended):
ollama pull codellama

# Alternative smaller models:
ollama pull mistral
ollama pull llama3.2
```

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure Docker is running (Docker Desktop on Windows/Mac)

3. Make sure Ollama is running:
   ```bash
   ollama serve
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## Usage

1. Start a new interview session
2. The virtual interviewer will greet you and ask about your experience
3. Based on your responses, problems will be generated
4. Solve the problems in the browser-based IDE
5. Submit your solution for automated testing
6. Receive real-time feedback from the virtual interviewer
7. View your performance metrics and final report

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Monaco Editor
- **Backend**: Next.js API Routes
- **LLM**: Ollama (local)
- **Code Execution**: Docker
- **Database**: SQLite
- **Charts**: Recharts

## Project Structure

```
interview_forge/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── ollama/        # LLM integration
│   │   ├── execute/       # Code execution
│   │   ├── interview/     # Interview management
│   │   └── metrics/       # Metrics tracking
│   ├── interview/         # Interview UI pages
│   └── layout.tsx
├── lib/                   # Core libraries
│   ├── db.ts             # Database setup
│   ├── ollama.ts         # Ollama client
│   ├── docker.ts         # Docker sandbox
│   └── problems.ts       # Problem generator
├── components/            # React components
│   ├── InterviewRoom/
│   ├── CodeEditor/
│   ├── InterviewerChat/
│   └── Metrics/
└── types/                 # TypeScript types
```

## License

MIT
