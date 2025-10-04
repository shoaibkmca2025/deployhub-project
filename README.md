# DeployHub - Self-Hosted CI/CD Platform

DeployHub is a modern, self-hosted CI/CD platform that allows you to deploy applications on your own hardware. Transform your laptops, Raspberry Pi, and servers into a powerful deployment infrastructure.

## 🚀 Features

- **Self-Hosted**: Deploy on your own hardware, maintain full control
- **Multi-Platform**: Support for Windows, macOS, and Linux agents
- **Real-Time Monitoring**: Live deployment logs and hardware metrics
- **Modern UI**: Beautiful, responsive dashboard with real-time updates
- **Easy Setup**: Simple installation and configuration
- **Docker Support**: Containerized deployment for easy management

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd deployhub-project
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm run install-all
```

### 3. Start Development Environment
```bash
# Start with Docker Compose
npm run dev

# Or start services individually
npm run dev:frontend  # Frontend on port 3000
npm run dev:backend   # Backend on port 4000
```

### 4. Access the Dashboard
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

## 🏗️ Project Structure

```
deployhub-project/
├── backend/                 # Backend services
│   ├── server/             # Main API server
│   └── agent/              # Agent service
├── frontend/               # Frontend application
│   ├── web/               # React/Vite frontend
│   ├── *.html             # Static HTML pages
│   └── main.js            # Main JavaScript
├── docs/                  # Documentation
├── docker-compose.yml     # Production setup
└── docker-compose.dev.yml # Development setup
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `frontend/web/`:
```env
VITE_SERVER_ORIGIN=http://localhost:4000
VITE_APP_NAME=DeployHub
VITE_APP_VERSION=1.0.0
```

### Backend Configuration

The backend automatically detects the environment and configures CORS accordingly.

## 📱 Usage

### 1. Connect Hardware
1. Go to the Hardware page
2. Download the appropriate agent for your platform
3. Install and run the agent on your device
4. Your device will appear in the dashboard

### 2. Deploy Applications
1. Go to the Deployments page
2. Click "New Deployment"
3. Enter your GitHub repository URL
4. Configure build and start commands
5. Select target device
6. Deploy!

### 3. Monitor Deployments
- View real-time logs
- Monitor resource usage
- Restart/stop deployments
- Track deployment history

## 🐳 Docker Deployment

### Production
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

## 🔌 API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login

### Deployments
- `GET /api/deployments` - List deployments
- `POST /api/deploy` - Create deployment
- `POST /api/deployments/:id/action` - Control deployment (start/stop/restart)
- `DELETE /api/deployments/:id` - Delete deployment

### Agents
- `GET /api/agents` - List connected agents
- `GET /api/status` - System status

### Deployment Links
- `POST /api/generate-link` - Generate deployment link
- `GET /api/deploy/:linkId` - Get deployment configuration

## 🛡️ Security

- JWT-based authentication
- CORS protection
- Input validation
- Environment variable security

## 📊 Monitoring

- Real-time hardware metrics
- Deployment logs
- System health checks
- Performance analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Open an issue on GitHub
- Review the API documentation

## 🔄 Updates

The project is actively maintained with regular updates and improvements.

---

**DeployHub** - Empowering developers to deploy anywhere, on their own terms.