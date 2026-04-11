# Aetheron Node Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc-dev

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000 8080 8545

ENV NODE_NAME=aetheron-node
ENV NETWORK=testnet
ENV PORT=3000
ENV METRICS_PORT=8080
ENV RPC_PORT=8545

CMD ["node", "server.js"]