FROM node:18-alpine

WORKDIR /app

# Install dependencies first (only package files copied to leverage cache)
COPY package*.json ./
RUN npm install --silent

# Copy app sources
COPY . /app

# Ensure the dev server binds to all interfaces
ENV HOST=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

CMD ["npm", "start"]
