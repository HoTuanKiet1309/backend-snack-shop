FROM node:18-alpine as build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Use production dependencies only
RUN npm ci --only=production

# Copy application code
COPY server.js ./
COPY services ./services
COPY routes ./routes
COPY utils ./utils
COPY controllers ./controllers
COPY middleware ./middleware
COPY config ./config
COPY models ./models
COPY swagger.js ./

# Use a much smaller image for runtime
FROM node:18-alpine

# Add dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy only dependencies and app files
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app .

# Set environment and user for security
ENV NODE_ENV=production
USER node

EXPOSE 5000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 