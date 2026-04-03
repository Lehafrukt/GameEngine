import { World } from 'miniplex';
import { Entity } from '../components/entity';
import { NpcBehavior } from '../../shared/types';

const WANDER_CHANGE_INTERVAL = 3000; // ms
const CHASE_SPEED = 3.0;
const WANDER_SPEED = 1.0;
const DETECTION_RANGE = 10.0;
const ATTACK_RANGE = 2.0;
const HOME_RETURN_THRESHOLD = 1.0;

/**
 * NPC AI System — finite state machine driving NPC behavior.
 */
export function createNpcAiSystem(world: World<Entity>) {
  const npcs = world.with('npc', 'transform');
  const players = world.with('player', 'transform');
  const wanderTimers = new Map<string, number>();

  return function npcAiSystem(deltaTime: number, now: number) {
    for (const npc of npcs) {
      const { state } = npc.npc;
      const pos = npc.transform.position;
      const vel = npc.transform.velocity;

      switch (state.behavior) {
        case NpcBehavior.IDLE: {
          vel.x = 0;
          vel.y = 0;
          vel.z = 0;

          // Check for nearby players (monsters only)
          if (npc.npc.npcType === 'monster') {
            const nearest = findNearestPlayer(pos, players);
            if (nearest && nearest.distance < DETECTION_RANGE) {
              state.behavior = NpcBehavior.CHASE;
              state.targetEntityId = nearest.entity.id;
              break;
            }
          }

          // Randomly transition to wander
          if (Math.random() < 0.01) {
            state.behavior = NpcBehavior.WANDER;
          }
          break;
        }

        case NpcBehavior.WANDER: {
          const timer = wanderTimers.get(npc.id) ?? 0;
          if (now - timer > WANDER_CHANGE_INTERVAL) {
            wanderTimers.set(npc.id, now);
            const angle = Math.random() * Math.PI * 2;
            vel.x = Math.cos(angle) * WANDER_SPEED;
            vel.z = Math.sin(angle) * WANDER_SPEED;
          }

          // Don't wander too far from home
          const distHome = distance2D(pos, state.homePosition);
          if (distHome > state.wanderRadius) {
            state.behavior = NpcBehavior.RETURN_HOME;
            break;
          }

          // Check for players (monsters)
          if (npc.npc.npcType === 'monster') {
            const nearest = findNearestPlayer(pos, players);
            if (nearest && nearest.distance < DETECTION_RANGE) {
              state.behavior = NpcBehavior.CHASE;
              state.targetEntityId = nearest.entity.id;
            }
          }

          // Randomly stop
          if (Math.random() < 0.005) {
            state.behavior = NpcBehavior.IDLE;
            vel.x = 0;
            vel.z = 0;
          }
          break;
        }

        case NpcBehavior.CHASE: {
          const target = findEntityById(state.targetEntityId, players);
          if (!target || !target.transform) {
            state.behavior = NpcBehavior.RETURN_HOME;
            state.targetEntityId = null;
            break;
          }

          const dist = distance2D(pos, target.transform.position);
          if (dist < ATTACK_RANGE) {
            state.behavior = NpcBehavior.ATTACK;
            vel.x = 0;
            vel.z = 0;
            break;
          }

          if (dist > DETECTION_RANGE * 1.5) {
            state.behavior = NpcBehavior.RETURN_HOME;
            state.targetEntityId = null;
            break;
          }

          const dx = target.transform.position.x - pos.x;
          const dz = target.transform.position.z - pos.z;
          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          vel.x = (dx / len) * CHASE_SPEED;
          vel.z = (dz / len) * CHASE_SPEED;
          break;
        }

        case NpcBehavior.ATTACK: {
          vel.x = 0;
          vel.z = 0;

          const target = findEntityById(state.targetEntityId, players);
          if (!target || !target.transform) {
            state.behavior = NpcBehavior.RETURN_HOME;
            state.targetEntityId = null;
            break;
          }

          const dist = distance2D(pos, target.transform.position);
          if (dist > ATTACK_RANGE * 1.2) {
            state.behavior = NpcBehavior.CHASE;
            break;
          }

          // Damage is applied via CombatSystem
          break;
        }

        case NpcBehavior.RETURN_HOME: {
          const distHome = distance2D(pos, state.homePosition);
          if (distHome < HOME_RETURN_THRESHOLD) {
            state.behavior = NpcBehavior.IDLE;
            vel.x = 0;
            vel.z = 0;
            break;
          }

          const dx = state.homePosition.x - pos.x;
          const dz = state.homePosition.z - pos.z;
          const len = Math.sqrt(dx * dx + dz * dz) || 1;
          vel.x = (dx / len) * WANDER_SPEED;
          vel.z = (dz / len) * WANDER_SPEED;
          break;
        }

        case NpcBehavior.FLEE: {
          // TODO: flee from threat
          state.behavior = NpcBehavior.RETURN_HOME;
          break;
        }
      }
    }
  };
}

// --- helpers ---

interface NearestResult {
  entity: Entity;
  distance: number;
}

function findNearestPlayer(
  pos: { x: number; z: number },
  players: Iterable<Entity>,
): NearestResult | null {
  let nearest: NearestResult | null = null;
  for (const p of players) {
    if (!p.transform) continue;
    const d = distance2D(pos, p.transform.position);
    if (!nearest || d < nearest.distance) {
      nearest = { entity: p, distance: d };
    }
  }
  return nearest;
}

function findEntityById(id: string | null, entities: Iterable<Entity>): Entity | undefined {
  if (!id) return undefined;
  for (const e of entities) {
    if (e.id === id) return e;
  }
  return undefined;
}

function distance2D(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}
