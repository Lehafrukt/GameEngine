/** Shared type definitions for frontend & backend */

// --- Entity Types ---

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface NpcState {
  behavior: NpcBehavior;
  targetEntityId: string | null;
  homePosition: Position;
  wanderRadius: number;
}

export enum NpcBehavior {
  IDLE = 'idle',
  WANDER = 'wander',
  CHASE = 'chase',
  FLEE = 'flee',
  ATTACK = 'attack',
  RETURN_HOME = 'return_home',
  INTERACT = 'interact',
}

// --- Player ---

export interface PlayerData {
  id: string;
  username: string;
  position: Position;
  health: Health;
  level: number;
  experience: number;
}

// --- NPC ---

export interface NpcData {
  id: string;
  name: string;
  type: NpcType;
  position: Position;
  health: Health;
  state: NpcState;
}

export enum NpcType {
  VILLAGER = 'villager',
  MERCHANT = 'merchant',
  GUARD = 'guard',
  MONSTER = 'monster',
}

// --- Room / Location ---

export interface RoomConfig {
  roomId: string;
  name: string;
  maxPlayers: number;
  tickRate: number;
  bounds: { width: number; height: number };
}

// --- Messages (client ↔ server) ---

export enum MessageType {
  PLAYER_MOVE = 'player_move',
  PLAYER_ACTION = 'player_action',
  CHAT_MESSAGE = 'chat_message',
  NPC_INTERACT = 'npc_interact',
}

export interface PlayerMoveMessage {
  type: MessageType.PLAYER_MOVE;
  direction: Position;
}

export interface PlayerActionMessage {
  type: MessageType.PLAYER_ACTION;
  action: string;
  targetId?: string;
}

export interface ChatMessage {
  type: MessageType.CHAT_MESSAGE;
  text: string;
}

export type GameMessage = PlayerMoveMessage | PlayerActionMessage | ChatMessage;

// --- Auth ---

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  userId: string;
  username: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}
