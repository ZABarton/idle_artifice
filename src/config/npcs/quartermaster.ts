/**
 * Quartermaster Jones
 *
 * Manages the camp's supplies and teaches players about resource management.
 */

import type { NPCConfig } from '@/types/npc'

export const quartermasterConfig: NPCConfig = {
  id: 'quartermaster',
  name: 'Quartermaster Jones',
  portrait: {
    path: 'images/portraits/quartermaster.png',
    alt: 'Quartermaster Jones',
  },
  icon: '📦',
  dialogProgression: [{ id: 'quartermaster-intro' }],
  fallbackProgression: [{ id: 'quartermaster-tips', priority: 0 }],
}
