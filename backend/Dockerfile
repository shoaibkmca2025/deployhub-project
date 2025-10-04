# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY agent/package*.json ./agent/
COPY package*.json ./

# Install dependencies
RUN cd server && npm ci --only=production
RUN cd agent && npm ci --only=production
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY agent/ ./agent/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S deployhub -u 1001

# Change ownership
RUN chown -R deployhub:nodejs /app
USER deployhub

# Expose ports
EXPOSE 4000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "dev"]
