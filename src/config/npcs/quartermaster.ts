/**
 * Quartermaster Theodore Creach NPC Configuration
 *
 * Manages the camp's supplies and teaches players about resource management.
 */

import type { NPCConfig } from '@/types/npc'

export const quartermasterConfig: NPCConfig = {
  id: 'quartermaster',
  name: 'Theodore Creach',
  portrait: {
    path: 'images/portraits/quartermaster.png',
    alt: 'Theodore Creach',
  },
  icon: '📦',
  dialogProgression: [{ id: 'quartermaster-intro' }],
  fallbackProgression: [{ id: 'quartermaster-tips', priority: 0 }],
}
