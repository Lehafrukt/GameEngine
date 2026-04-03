import { Position, Velocity, Health, NpcState, NpcBehavior } from '../../shared/types';

/**
 * ECS Component definitions for miniplex World.
 * These represent the internal game state (server-authoritative).
 * Colyseus schemas sync a projection of this state to clients.
 */

export interface TransformComponent {
  position: Position;
  velocity: Velocity;
}

export interface HealthComponent {
  health: Health;
}

export interface NpcComponent {
  npcId: string;
  name: string;
  npcType: string;
  state: NpcState;
}

export interface PlayerComponent {
  playerId: string;
  username: string;
  sessionId: string;
  level: number;
  experience: number;
}

export interface CombatComponent {
  attackPower: number;
  defense: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
}

export interface ColliderComponent {
  radius: number;
}

/** Union entity type — entities have subsets of these components */
export interface Entity {
  // identity
  id: string;

  // optional components
  transform?: TransformComponent;
  health?: HealthComponent;
  npc?: NpcComponent;
  player?: PlayerComponent;
  combat?: CombatComponent;
  collider?: ColliderComponent;
}
