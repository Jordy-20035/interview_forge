# Docker Setup Information

## Why No Docker Compose?

**You don't need Docker Compose for this project!**

This application uses **Dockerode** (Node.js Docker API client) to dynamically create and manage Docker containers at runtime. This means:

- ✅ No `docker-compose.yml` file needed
- ✅ Containers are created on-demand when code needs to execute
- ✅ Containers are automatically cleaned up after execution
- ✅ Each code execution runs in a fresh, isolated container

## How It Works

1. When you submit code, the system:
   - Creates a temporary directory for your code
   - Spins up a Docker container with the appropriate language runtime (Python, Node.js, etc.)
   - Mounts your code into the container
   - Executes the code in an isolated environment
   - Captures output and returns results
   - Automatically removes the container

2. **Why this is better than Docker Compose:**
   - Dynamic: No need to pre-define containers
   - Isolated: Each execution is completely separate
   - Secure: Network disabled, resource limits enforced
   - Clean: No leftover containers cluttering your system

## What Docker Desktop Does

Docker Desktop provides the Docker daemon that our application connects to via the Docker API. When you see `docker ps` showing no containers, that's normal - containers are created and destroyed as needed.

## Troubleshooting

### "Docker is not available" error

1. Make sure Docker Desktop is running
2. Check Docker is accessible:
   ```bash
   docker ps
   ```
   Should not show an error

3. On Windows, ensure Docker Desktop is fully started (not just installed)

### Containers not being created

- Check Docker has enough resources allocated in Docker Desktop settings
- Verify Docker Desktop is not in a "Paused" state
- Try restarting Docker Desktop

### Permission issues (Linux)

If on Linux, you might need to add your user to the docker group:
```bash
sudo usermod -aG docker $USER
```
Then log out and log back in.

## Testing Docker Connection

The app includes a health check endpoint. Visit:
```
http://localhost:3000/api/health
```

This will tell you if both Docker and Ollama are properly connected.

