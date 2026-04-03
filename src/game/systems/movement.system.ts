import { World } from 'miniplex';
import { Entity } from '../components/entity';

/**
 * MovementSystem — updates entity positions based on velocity each tick.
 */
export function createMovementSystem(world: World<Entity>) {
  const movable = world.with('transform');

  return function movementSystem(deltaTime: number) {
    for (const entity of movable) {
      const { position, velocity } = entity.transform;
      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
      position.z += velocity.z * deltaTime;
    }
  };
}
