# Setup Guide

## Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Docker** - [Download here](https://www.docker.com/get-started)
3. **Ollama** - [Download here](https://ollama.ai)

## Step 1: Install Ollama and Pull a Model

```bash
# Install Ollama from https://ollama.ai

# Pull a coding model (recommended):
ollama pull codellama

# Alternative smaller models:
ollama pull mistral
ollama pull llama3.2
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Start Docker

Make sure Docker Desktop (or Docker daemon) is running on your system.

## Step 4: Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: Verify Setup

1. Check Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Check Docker is running:
   ```bash
   docker ps
   ```

## Troubleshooting

### Ollama not connecting
- Make sure Ollama is installed and running
- Check if Ollama is listening on `http://localhost:11434`
- Try: `ollama serve`

### Docker not available
- Ensure Docker Desktop is running
- On Windows/Mac: Start Docker Desktop application
- On Linux: `sudo systemctl start docker`

### Code execution fails
- Verify Docker is running
- Check Docker has enough resources allocated
- Ensure the required Docker images are available (Python, Node.js, etc.)

### Database errors
- SQLite database will be created automatically
- If issues occur, delete `interview_forge.db` and restart

## Usage

1. Navigate to http://localhost:3000
2. Enter your name and start an interview
3. Select your experience level and preferred programming language
4. The AI interviewer will guide you through coding problems
5. Write code in the browser IDE and submit for testing
6. View your performance metrics and final report

