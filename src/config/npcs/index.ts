/**
 * NPC Registry
 *
 * Central registry for all NPC configurations.
 * Provides lookup functions for retrieving NPC data by ID.
 */

import type { NPCConfig } from '@/types/npc'
import { antonConfig } from './anton'
import { quartermasterConfig } from './quartermaster'
import { tavernKeeperConfig } from './tavernKeeper'

/**
 * Map of all registered NPCs keyed by ID
 */
const npcRegistry: Map<string, NPCConfig> = new Map([
  [antonConfig.id, antonConfig],
  [quartermasterConfig.id, quartermasterConfig],
  [tavernKeeperConfig.id, tavernKeeperConfig],
])

/**
 * Get an NPC configuration by ID
 * @param npcId - The NPC's unique identifier
 * @returns The NPC configuration, or undefined if not found
 */
export function getNPCById(npcId: string): NPCConfig | undefined {
  return npcRegistry.get(npcId)
}

/**
 * Get all registered NPCs
 * @returns Array of all NPC configurations
 */
export function getAllNPCs(): NPCConfig[] {
  return Array.from(npcRegistry.values())
}

/**
 * Check if an NPC exists in the registry
 * @param npcId - The NPC's unique identifier
 * @returns True if the NPC exists, false otherwise
 */
export function hasNPC(npcId: string): boolean {
  return npcRegistry.has(npcId)
}

// Re-export individual configs for direct access if needed
export { antonConfig, quartermasterConfig, tavernKeeperConfig }
