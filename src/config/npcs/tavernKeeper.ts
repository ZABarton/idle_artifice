/**
 * Camille Adai - Tavern Keeper
 *
 * Runs the academy tavern and helps manage explorers.
 */

import type { NPCConfig } from '@/types/npc'

export const tavernKeeperConfig: NPCConfig = {
  id: 'tavern-keeper',
  name: 'Camille Adai',
  portrait: {
    path: 'images/portraits/ranger.png',
    alt: 'Camille Adai, the Tavern Keeper',
  },
  icon: '🍺',
  dialogProgression: [{ id: 'tavern-keeper-intro' }],
  fallbackProgression: [{ id: 'tavern-keeper-tips', priority: 0 }],
}
