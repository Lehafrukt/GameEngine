import { World } from 'miniplex';
import { Entity } from '../components/entity';
import { NpcBehavior } from '../../shared/types';

const ATTACK_COOLDOWN = 1000; // ms

/**
 * CombatSystem — resolves attacks between entities with combat components.
 */
export function createCombatSystem(world: World<Entity>) {
  const combatants = world.with('combat', 'transform', 'health');
  const npcsWithCombat = world.with('npc', 'combat', 'transform', 'health');

  return function combatSystem(_deltaTime: number, now: number) {
    for (const npc of npcsWithCombat) {
      if (npc.npc.state.behavior !== NpcBehavior.ATTACK) continue;

      const { combat } = npc;
      if (now - combat.lastAttackTime < combat.attackCooldown) continue;

      const targetId = npc.npc.state.targetEntityId;
      if (!targetId) continue;

      // Find target in all combatants
      for (const target of combatants) {
        if (target.id !== targetId) continue;

        const damage = Math.max(0, combat.attackPower - (target.combat?.defense ?? 0));
        target.health.health.current = Math.max(0, target.health.health.current - damage);
        combat.lastAttackTime = now;

        if (target.health.health.current <= 0) {
          npc.npc.state.behavior = NpcBehavior.RETURN_HOME;
          npc.npc.state.targetEntityId = null;
        }
        break;
      }
    }
  };
}
