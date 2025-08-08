# Stage: Install dependencies and run both apps
FROM node:18-alpine
WORKDIR /app

# Copy and install server dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

# Copy and install client dependencies
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install

# Copy rest of the code
WORKDIR /app
COPY . .

# Install concurrently globally
RUN npm install -g concurrently

EXPOSE 3000 3001

CMD ["concurrently", "npm start --prefix server", "npm start --prefix client"]
