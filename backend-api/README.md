# Aetheron Backend API

## Overview
This backend powers real-time data + analytics for the Aetheron trading terminal.

## Features
- Market data proxy (Dexscreener)
- OHLC data engine (synthetic)
- Price ingestion endpoint
- Health monitoring

## Run locally
```
cd backend-api
npm install
npm run dev
```

## Endpoints
- GET /api/health
- GET /api/market/:token
- GET /api/ohlc
- POST /api/ingest

## Next upgrades
- WebSocket streaming
- Persistent DB (Postgres / Redis)
- Multi-chain indexing
