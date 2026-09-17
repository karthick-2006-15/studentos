# Multi-stage Dockerfile for NEXUS API Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production Runner Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
