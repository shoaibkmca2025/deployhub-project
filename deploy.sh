#!/bin/bash
# DeployHub Deployment Script

set -e

echo "🚀 DeployHub Deployment Script"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment"
    echo "  prod        Start production environment"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        Show logs"
    echo "  clean       Clean up containers and volumes"
    echo "  build       Build all images"
    echo "  status      Show service status"
    echo ""
}

# Function to start development
start_dev() {
    echo "🔧 Starting development environment..."
    docker-compose -f docker-compose.dev.yml up --build -d
    echo "✅ Development environment started!"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:4000"
}

# Function to start production
start_prod() {
    echo "🏭 Starting production environment..."
    docker-compose up --build -d
    echo "✅ Production environment started!"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:4000"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    echo "✅ All services stopped!"
}

# Function to show logs
show_logs() {
    echo "📋 Showing logs..."
    docker-compose logs -f
}

# Function to clean up
clean_up() {
    echo "🧹 Cleaning up containers and volumes..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo "✅ Cleanup completed!"
}

# Function to build images
build_images() {
    echo "🔨 Building all images..."
    docker-compose build
    echo "✅ All images built!"
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    echo "=================="
    docker-compose ps
}

# Main script logic
case "${1:-}" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_prod
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_up
        ;;
    build)
        build_images
        ;;
    status)
        show_status
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
