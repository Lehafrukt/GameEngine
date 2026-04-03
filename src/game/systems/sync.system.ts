import { World } from 'miniplex';
import { Entity } from '../components/entity';
import { GameRoomState } from '../components/schemas';

/**
 * SyncSystem — projects the miniplex ECS world state
 * onto the Colyseus GameRoomState schemas for network sync.
 */
export function createSyncSystem(world: World<Entity>, state: GameRoomState) {
  const playersQuery = world.with('player', 'transform', 'health');
  const npcsQuery = world.with('npc', 'transform', 'health');

  return function syncSystem() {
    // Sync players
    for (const entity of playersQuery) {
      const schema = state.players.get(entity.player.sessionId);
      if (!schema) continue;

      schema.position.x = entity.transform.position.x;
      schema.position.y = entity.transform.position.y;
      schema.position.z = entity.transform.position.z;
      schema.velocity.x = entity.transform.velocity.x;
      schema.velocity.y = entity.transform.velocity.y;
      schema.velocity.z = entity.transform.velocity.z;
      schema.health.current = entity.health.health.current;
      schema.health.max = entity.health.health.max;
      schema.level = entity.player.level;
      schema.experience = entity.player.experience;
    }

    // Sync NPCs
    for (const entity of npcsQuery) {
      const schema = state.npcs.get(entity.npc.npcId);
      if (!schema) continue;

      schema.position.x = entity.transform.position.x;
      schema.position.y = entity.transform.position.y;
      schema.position.z = entity.transform.position.z;
      schema.velocity.x = entity.transform.velocity.x;
      schema.velocity.y = entity.transform.velocity.y;
      schema.velocity.z = entity.transform.velocity.z;
      schema.health.current = entity.health.health.current;
      schema.health.max = entity.health.health.max;
      schema.behavior = entity.npc.state.behavior;
    }
  };
}
