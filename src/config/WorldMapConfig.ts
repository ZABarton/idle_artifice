import type { HexTile } from '@/types/hex'

/**
 * World Map Configuration
 *
 * Defines the complete world layout with predetermined hex types.
 * Coordinates are in axial format (q, r).
 *
 * This config includes:
 * - Initial visible hexes (Harbor + surrounding ocean)
 * - Academy (initially unexplored)
 * - Land hexes revealed when Academy is explored
 * - Additional hexes revealed as player explores further
 */

export const WORLD_MAP_CONFIG: Record<string, Partial<HexTile>> = {
  // Starting area - Harbor and surrounding ocean
  '-1,0': { type: 'harbor', clickable: true },
  '-1,-1': { type: 'ocean', clickable: false },
  '0,-1': { type: 'ocean', clickable: false },
  '-1,1': { type: 'ocean', clickable: false },
  '-2,1': { type: 'ocean', clickable: false },
  '-2,0': { type: 'ocean', clickable: false },

  // Academy - player's base
  '0,0': { type: 'academy', clickable: true },

  // Land hexes surrounding Academy (revealed when Academy is explored)
  '1,-1': { type: 'forest', clickable: true },
  '1,0': { type: 'plains', clickable: true },
  '0,1': { type: 'mountain', clickable: true },

  // Additional hexes revealed as exploration continues
  // (Add more hexes here as you design the world map)
}

/**
 * Get hex configuration for given coordinates
 * Returns undefined if hex is not in the predefined map
 */
export function getHexConfig(q: number, r: number): Partial<HexTile> | undefined {
  return WORLD_MAP_CONFIG[`${q},${r}`]
}

/**
 * Check if a hex exists in the predefined world map
 */
export function hexExistsInConfig(q: number, r: number): boolean {
  return `${q},${r}` in WORLD_MAP_CONFIG
}
