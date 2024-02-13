# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.10.0
FROM node:${NODE_VERSION}-slim as base

WORKDIR /app
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Generate Prisma Client
COPY prisma .
RUN npx prisma generate

# Copy application code
COPY . .
RUN npm run build
# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Install ca-certificates to support TLS, which is needed to connect to planetscale
RUN apt-get update && apt-get install ca-certificates -y && rm -rf /var/lib/apt/lists/*

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE ${PORT}
ENTRYPOINT [ "npm", "run", "start" ]
