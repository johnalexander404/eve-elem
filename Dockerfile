# Use a Node.js base image
FROM node:18-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Use a smaller base image for the final image
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose the port that Next.js runs on
EXPOSE 3000

# Set the environment variable for production
ENV NODE_ENV production

# Start the Next.js app
CMD ["npm", "start"]
