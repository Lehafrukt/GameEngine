import { World } from 'miniplex';
import { Entity } from '../components/entity';
import { GameRoomState } from '../components/schemas';
import { createMovementSystem } from './movement.system';
import { createNpcAiSystem } from './npc-ai.system';
import { createCombatSystem } from './combat.system';
import { createSyncSystem } from './sync.system';

/**
 * GameLoop — orchestrates all ECS systems in correct order.
 * Called by Colyseus Room on every tick.
 */
export class GameLoop {
  private movementSystem: ReturnType<typeof createMovementSystem>;
  private npcAiSystem: ReturnType<typeof createNpcAiSystem>;
  private combatSystem: ReturnType<typeof createCombatSystem>;
  private syncSystem: ReturnType<typeof createSyncSystem>;

  constructor(
    public world: World<Entity>,
    private state: GameRoomState,
  ) {
    this.movementSystem = createMovementSystem(world);
    this.npcAiSystem = createNpcAiSystem(world);
    this.combatSystem = createCombatSystem(world);
    this.syncSystem = createSyncSystem(world, state);
  }

  /**
   * Called every simulation tick.
   * @param deltaTime seconds since last tick
   */
  update(deltaTime: number): void {
    const now = Date.now();

    // 1. AI decides intent
    this.npcAiSystem(deltaTime, now);

    // 2. Resolve combat
    this.combatSystem(deltaTime, now);

    // 3. Apply movement
    this.movementSystem(deltaTime);

    // 4. Sync ECS → Colyseus schemas
    this.syncSystem();

    // 5. Increment tick counter
    this.state.tick++;
  }
}
