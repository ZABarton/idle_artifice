/**
 * Anton DeCassieur - Foundry Master
 *
 * The academy's master craftsman who teaches players about crafting
 * equipment for explorers.
 */

import type { NPCConfig } from '@/types/npc'

export const antonConfig: NPCConfig = {
  id: 'anton',
  name: 'Anton DeCassieur',
  portrait: {
    path: 'images/portraits/smith.png',
    alt: 'Anton DeCassieur, the Foundry Master',
  },
  icon: '🔨',
  dialogProgression: [{ id: 'foundry-master-intro' }],
  fallbackProgression: [{ id: 'foundry-master-tips', priority: 0 }],
}
