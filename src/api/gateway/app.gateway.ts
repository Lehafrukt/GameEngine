import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * NestJS WebSocket Gateway — used for non-game-state communication:
 * - Chat, notifications, matchmaking, lobby
 *
 * Game state sync is handled by Colyseus rooms directly.
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/gateway',
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat')
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; username: string },
  ) {
    // Broadcast to all connected clients
    this.server.emit('chat', {
      username: payload.username,
      message: payload.message,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('lobby:list_rooms')
  handleListRooms(@ConnectedSocket() client: Socket) {
    // In a real app, query Colyseus matchmaker for available rooms
    client.emit('lobby:rooms', { rooms: [] });
  }

  /** Broadcast a server-wide notification */
  broadcastNotification(message: string) {
    this.server.emit('notification', { message, timestamp: Date.now() });
  }
}
