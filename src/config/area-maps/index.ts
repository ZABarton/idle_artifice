/**
 * Area Map Configuration Registry
 *
 * Central registry for all area map configurations.
 * Provides lookup functions to get configs by area type or coordinates.
 */

import type { AreaMapConfig } from '@/types/areaMapConfig'
import type { AreaType } from '@/types/areaMap'
import { academyConfig } from './academy'
import { harborConfig } from './harbor'
// Import other area configs as they are created:
// import { forestConfig } from './forest'

/**
 * Registry mapping area types to their configurations
 */
const areaConfigRegistry: Record<AreaType, AreaMapConfig | null> = {
  academy: academyConfig,
  harbor: harborConfig,
  forest: null, // To be implemented
  mountain: null, // To be implemented
}

/**
 * Get area configuration by area type
 *
 * @param areaType - The area type to get config for
 * @returns The area configuration, or null if not found
 */
export function getAreaConfig(areaType: AreaType): AreaMapConfig | null {
  const config = areaConfigRegistry[areaType]

  if (!config) {
    console.warn(`Area config not found for area type: ${areaType}`)
    return null
  }

  return config
}

/**
 * Get area configuration by hex coordinates
 *
 * Looks up the tile type from worldMapStore and returns the corresponding config.
 * This is a convenience function for when you have coordinates but not the area type.
 *
 * Note: This function requires worldMapStore to be initialized.
 * It should be called from within a Vue component or composable context.
 *
 * @param q - The q coordinate (axial)
 * @param r - The r coordinate (axial)
 * @returns The area configuration, or null if tile not found or config not available
 */
export function getAreaConfigByCoords(
  q: number,
  r: number,
  worldMapStore: any
): AreaMapConfig | null {
  // Get the tile data to determine area type
  const tile = worldMapStore.getTileAt(q, r)

  if (!tile) {
    console.warn(`No tile found at coordinates (${q}, ${r})`)
    return null
  }

  // Get config for this area type
  return getAreaConfig(tile.type as AreaType)
}

/**
 * Check if a config exists for a given area type
 *
 * @param areaType - The area type to check
 * @returns True if config exists, false otherwise
 */
export function hasAreaConfig(areaType: AreaType): boolean {
  return areaConfigRegistry[areaType] !== null
}

/**
 * Get all registered area types
 *
 * @returns Array of area types that have configurations
 */
export function getRegisteredAreaTypes(): AreaType[] {
  return Object.entries(areaConfigRegistry)
    .filter(([_, config]) => config !== null)
    .map(([type]) => type as AreaType)
}

/**
 * Get the active layout config based on window width
 *
 * @param config - The area map config
 * @param windowWidth - Current window width in pixels
 * @returns The layout config to use, or null if no matching layout found
 */
export function getActiveLayout(config: AreaMapConfig, windowWidth: number) {
  // Find the layout that matches the current window width
  for (const [layoutName, layoutConfig] of Object.entries(config.layouts)) {
    const { minWidth, maxWidth } = layoutConfig

    // Check if window width is within this layout's range
    const meetsMin = minWidth === undefined || windowWidth >= minWidth
    const meetsMax = maxWidth === undefined || windowWidth <= maxWidth

    if (meetsMin && meetsMax) {
      return { name: layoutName, config: layoutConfig }
    }
  }

  // Fallback: return the first layout if no match found
  const fallbackName = Object.keys(config.layouts)[0]
  console.warn(
    `No layout found for window width ${windowWidth}px, using fallback: ${fallbackName}`
  )
  return {
    name: fallbackName,
    config: config.layouts[fallbackName],
  }
}
