# Stage 1: Build the application
FROM node:18-alpine as builder

# Set working directory
WORKDIR /webapps

# Copy package.json and yarn.lock to the container
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the container
COPY . .

# Build the application
RUN yarn build

# Stage 2: Run the application
FROM node:18-alpine as runner

# Set working directory
WORKDIR /webapps

# Copy the built application from the builder stage
COPY --from=builder /webapps ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["yarn", "start"]
