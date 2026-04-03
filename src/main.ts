import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Server as ColyseusServer } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';
import express from 'express';

import { AppModule } from './api/app.module';
import { GameRoom } from './game/rooms/game.room';

async function bootstrap() {
  const API_PORT = parseInt(process.env.API_PORT ?? '3000', 10);
  const GAME_PORT = parseInt(process.env.GAME_PORT ?? '2567', 10);

  // --- 1. Start NestJS API server ---
  const nestApp = await NestFactory.create(AppModule);
  nestApp.enableCors();
  await nestApp.listen(API_PORT);
  console.log(`[API] NestJS listening on http://localhost:${API_PORT}`);

  // --- 2. Start Colyseus game server ---
  const gameApp = express();
  const gameHttpServer = createServer(gameApp);

  const gameServer = new ColyseusServer({
    transport: new WebSocketTransport({ server: gameHttpServer }),
  });

  // Register room types
  gameServer.define('game_room', GameRoom);

  gameHttpServer.listen(GAME_PORT, () => {
    console.log(`[Game] Colyseus listening on ws://localhost:${GAME_PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Server] Shutting down...');
    await gameServer.gracefullyShutdown();
    await nestApp.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
