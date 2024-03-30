# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.10.0
FROM node:${NODE_VERSION}-slim as base

WORKDIR /app
ENV NODE_ENV=production
# Avoid running nodejs process as PID 1 (use tini)
# You may also need development tools to build native npm addons:
# apt-get install gcc g++ make
RUN apt-get update \
    && apt-get -qq install -y --no-install-recommends \
    tini openssl \
    && rm -rf /var/lib/apt/lists/*

# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY package-lock.json package.json ./
RUN npm install --include=dev

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

# Copy built application
COPY --from=build /app /app

# create geb user and group, then create app dir
RUN groupadd --gid 1000 geb \
    && useradd --uid 1000 --gid geb --shell /bin/bash --create-home geb \
    && chown -R geb:geb /app

USER geb

# Start the server by default, this can be overwritten at runtime
EXPOSE ${PORT}
ENTRYPOINT [ "node", "./server-build/index.js" ]
