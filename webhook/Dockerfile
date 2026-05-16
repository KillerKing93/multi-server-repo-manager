FROM node:18-alpine

# Install git and docker client so we can run git pull and docker-compose
RUN apk add --no-cache git docker-cli docker-cli-compose

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 9000
CMD ["node", "index.js"]
