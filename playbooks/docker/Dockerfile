FROM node:lts-slim

LABEL org.opencontainers.image.source=https://github.com/__GHCR_NAMESPACE__/__PROJECT_NAME__

WORKDIR /opt/front-end

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "start:dev"]
