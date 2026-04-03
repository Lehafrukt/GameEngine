import { Room, Client } from 'colyseus';
import { World } from 'miniplex';
import { GameRoomState, PlayerSchema, NpcSchema, PositionSchema, VelocitySchema, HealthSchema } from '../components/schemas';
import { Entity } from '../components/entity';
import { GameLoop } from '../systems/game-loop';
import { NpcBehavior, NpcType, MessageType } from '../../shared/types';

interface GameRoomOptions {
  name?: string;
  maxPlayers?: number;
  tickRate?: number;
}

export class GameRoom extends Room<GameRoomState> {
  private world!: World<Entity>;
  private gameLoop!: GameLoop;
  private tickRate: number = 20;

  onCreate(options: GameRoomOptions) {
    this.setState(new GameRoomState());
    this.state.roomId = this.roomId;
    this.state.name = options.name ?? 'Default Location';
    this.tickRate = options.tickRate ?? 20;
    this.maxClients = options.maxPlayers ?? 50;

    // Initialize ECS world
    this.world = new World<Entity>();
    this.gameLoop = new GameLoop(this.world, this.state);

    // Spawn some default NPCs
    this.spawnNpc('guard_01', 'Town Guard', NpcType.GUARD, { x: 5, y: 0, z: 5 });
    this.spawnNpc('merchant_01', 'Merchant', NpcType.MERCHANT, { x: -3, y: 0, z: 2 });
    this.spawnNpc('monster_01', 'Goblin', NpcType.MONSTER, { x: 20, y: 0, z: 20 });
    this.spawnNpc('monster_02', 'Wolf', NpcType.MONSTER, { x: -15, y: 0, z: 18 });

    // Register message handlers
    this.onMessage(MessageType.PLAYER_MOVE, (client, message) => {
      this.handlePlayerMove(client, message);
    });

    this.onMessage(MessageType.PLAYER_ACTION, (client, message) => {
      this.handlePlayerAction(client, message);
    });

    // Start game loop
    this.setSimulationInterval((dt) => {
      this.gameLoop.update(dt / 1000); // convert ms → seconds
    }, 1000 / this.tickRate);

    console.log(`[GameRoom] "${this.state.name}" created (tick rate: ${this.tickRate}Hz)`);
  }

  onJoin(client: Client, options: { userId?: string; username?: string }) {
    const username = options.username ?? `Player_${client.sessionId.slice(0, 4)}`;
    console.log(`[GameRoom] ${username} joined (${client.sessionId})`);

    // Add to Colyseus state
    const playerSchema = new PlayerSchema();
    playerSchema.id = options.userId ?? client.sessionId;
    playerSchema.username = username;
    playerSchema.position = new PositionSchema();
    playerSchema.velocity = new VelocitySchema();
    playerSchema.health = new HealthSchema();
    playerSchema.health.current = 100;
    playerSchema.health.max = 100;
    this.state.players.set(client.sessionId, playerSchema);

    // Add to ECS world
    this.world.add({
      id: playerSchema.id,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      },
      health: { health: { current: 100, max: 100 } },
      player: {
        playerId: playerSchema.id,
        username,
        sessionId: client.sessionId,
        level: 1,
        experience: 0,
      },
      combat: {
        attackPower: 10,
        defense: 5,
        attackRange: 2,
        attackCooldown: 800,
        lastAttackTime: 0,
      },
      collider: { radius: 0.5 },
    });
  }

  onLeave(client: Client) {
    console.log(`[GameRoom] ${client.sessionId} left`);
    this.state.players.delete(client.sessionId);

    // Remove from ECS
    for (const entity of this.world) {
      if (entity.player?.sessionId === client.sessionId) {
        this.world.remove(entity);
        break;
      }
    }
  }

  onDispose() {
    console.log(`[GameRoom] "${this.state.name}" disposed`);
  }

  // --- Message handlers ---

  private handlePlayerMove(client: Client, message: { direction: { x: number; y: number; z: number } }) {
    for (const entity of this.world) {
      if (entity.player?.sessionId !== client.sessionId) continue;
      if (!entity.transform) break;

      // Server-authoritative: set velocity from client input
      const speed = 5.0;
      const { x, z } = message.direction;
      const len = Math.sqrt(x * x + z * z) || 1;
      entity.transform.velocity.x = (x / len) * speed;
      entity.transform.velocity.z = (z / len) * speed;
      break;
    }
  }

  private handlePlayerAction(client: Client, message: { action: string; targetId?: string }) {
    // Extensible action handler
    console.log(`[GameRoom] Action from ${client.sessionId}: ${message.action}`);
  }

  // --- NPC spawning ---

  private spawnNpc(npcId: string, name: string, type: NpcType, pos: { x: number; y: number; z: number }) {
    // Add to Colyseus state
    const npcSchema = new NpcSchema();
    npcSchema.id = npcId;
    npcSchema.name = name;
    npcSchema.npcType = type;
    npcSchema.position.x = pos.x;
    npcSchema.position.y = pos.y;
    npcSchema.position.z = pos.z;
    npcSchema.health.current = type === NpcType.MONSTER ? 50 : 100;
    npcSchema.health.max = type === NpcType.MONSTER ? 50 : 100;
    this.state.npcs.set(npcId, npcSchema);

    // Add to ECS world
    this.world.add({
      id: npcId,
      transform: {
        position: { ...pos },
        velocity: { x: 0, y: 0, z: 0 },
      },
      health: {
        health: {
          current: npcSchema.health.current,
          max: npcSchema.health.max,
        },
      },
      npc: {
        npcId,
        name,
        npcType: type,
        state: {
          behavior: NpcBehavior.IDLE,
          targetEntityId: null,
          homePosition: { ...pos },
          wanderRadius: type === NpcType.MONSTER ? 15 : 8,
        },
      },
      combat: type === NpcType.MONSTER
        ? { attackPower: 8, defense: 2, attackRange: 2, attackCooldown: 1200, lastAttackTime: 0 }
        : undefined,
      collider: { radius: 0.5 },
    });
  }
}
