import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

/**
 * Colyseus Schema definitions for synchronized game state.
 * These schemas are automatically delta-serialized to clients.
 */

export class PositionSchema extends Schema {
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('float32') z: number = 0;
}

export class VelocitySchema extends Schema {
  @type('float32') x: number = 0;
  @type('float32') y: number = 0;
  @type('float32') z: number = 0;
}

export class HealthSchema extends Schema {
  @type('int32') current: number = 100;
  @type('int32') max: number = 100;
}

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') username: string = '';
  @type(PositionSchema) position = new PositionSchema();
  @type(VelocitySchema) velocity = new VelocitySchema();
  @type(HealthSchema) health = new HealthSchema();
  @type('int32') level: number = 1;
  @type('int32') experience: number = 0;
  @type('boolean') isOnline: boolean = true;
}

export class NpcSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('string') npcType: string = 'villager';
  @type(PositionSchema) position = new PositionSchema();
  @type(VelocitySchema) velocity = new VelocitySchema();
  @type(HealthSchema) health = new HealthSchema();
  @type('string') behavior: string = 'idle';
  @type('string') targetEntityId: string = '';
}

export class GameRoomState extends Schema {
  @type('string') roomId: string = '';
  @type('string') name: string = '';
  @type('int64') tick: number = 0;
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: NpcSchema }) npcs = new MapSchema<NpcSchema>();
}
