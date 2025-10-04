# DeployHub - Self-Hosted CI/CD Platform

A modern, self-hosted CI/CD platform that transforms your personal devices into a powerful deployment infrastructure.

## 🏗️ Project Structure

```
deployhub-project/
├── frontend/                 # Frontend application
│   ├── web/                 # React application
│   ├── *.html               # Static HTML pages
│   ├── main.js              # Main JavaScript file
│   ├── Dockerfile           # Production Docker image
│   ├── Dockerfile.dev       # Development Docker image
│   ├── nginx.conf           # Nginx configuration
│   └── package.json         # Frontend dependencies
├── backend/                 # Backend services
│   ├── server/              # Express API server
│   ├── agent/               # Deployment agent
│   ├── Dockerfile           # Production Docker image
│   ├── Dockerfile.dev       # Development Docker image
│   └── package.json         # Backend dependencies
├── docker-compose.yml       # Production deployment
├── docker-compose.dev.yml   # Development deployment
├── deploy.sh               # Linux/Mac deployment script
├── deploy.bat              # Windows deployment script
└── package.json            # Root project configuration
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Production Deployment

```bash
# Using deployment script (recommended)
./deploy.sh prod

# Or using npm scripts
npm run deploy

# Or using Docker Compose directly
docker-compose up -d --build
```

### Development Environment

```bash
# Using deployment script
./deploy.sh dev

# Or using npm scripts
npm run dev

# Or using Docker Compose directly
docker-compose -f docker-compose.dev.yml up --build
```

## 📋 Available Commands

### Root Level Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development environment with Docker |
| `npm run dev:frontend` | Start frontend in development mode |
| `npm run dev:backend` | Start backend in development mode |
| `npm run build` | Build all Docker images |
| `npm run start` | Start production environment |
| `npm run stop` | Stop all services |
| `npm run restart` | Restart all services |
| `npm run logs` | Show logs from all services |
| `npm run logs:frontend` | Show frontend logs only |
| `npm run logs:backend` | Show backend logs only |
| `npm run clean` | Clean up containers and volumes |
| `npm run deploy` | Deploy production environment |

### Deployment Script Commands

```bash
# Linux/Mac
./deploy.sh [command]

# Windows
deploy.bat [command]

# Available commands:
# dev, prod, stop, restart, logs, clean, build, status
```

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Agent**: http://localhost:3001

## 🐳 Docker Services

### Frontend Service
- **Port**: 3000
- **Technology**: Nginx + React
- **Build**: Multi-stage build with Node.js and Nginx

### Backend Service
- **Ports**: 4000 (API), 3001 (Agent)
- **Technology**: Node.js + Express + Socket.IO
- **Components**: API server + Deployment agent

## 🔧 Development

### Local Development (without Docker)

```bash
# Install all dependencies
npm run install-all

# Start frontend
npm run dev:frontend

# Start backend (in another terminal)
npm run dev:backend
```

### Docker Development

```bash
# Start development environment
npm run dev

# View logs
npm run logs

# Stop services
npm run stop
```

## 📦 Building for Production

```bash
# Build all images
npm run build

# Deploy to production
npm run deploy
```

## 🧹 Cleanup

```bash
# Clean containers and volumes
npm run clean

# Clean everything (including images)
npm run clean:all
```

## 🔍 Monitoring and Logs

```bash
# View all logs
npm run logs

# View specific service logs
npm run logs:frontend
npm run logs:backend

# Check service status
./deploy.sh status
```

## 🛠️ Configuration

### Environment Variables

Create `.env` files in respective directories:

**Frontend (.env)**
```
NODE_ENV=production
REACT_APP_API_URL=http://localhost:4000
```

**Backend (.env)**
```
NODE_ENV=production
PORT=4000
AGENT_PORT=3001
```

### Docker Configuration

- **Production**: Uses optimized multi-stage builds
- **Development**: Uses volume mounts for hot reloading
- **Networking**: Services communicate via Docker network

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 4000, and 3001 are available
2. **Docker not running**: Start Docker Desktop
3. **Permission issues**: Run with appropriate permissions

### Debug Commands

```bash
# Check Docker status
docker ps

# Check service logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild specific service
docker-compose up --build [service-name]
```

## 📚 Additional Resources

- [Architecture Documentation](docs/Architecture.md)
- [Deployment Guide](docs/DeploymentGuide.md)
- [Agent Setup](docs/AgentSetup.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.