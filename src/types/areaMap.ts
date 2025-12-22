import type { Feature } from './feature'

/**
 * Area Map type definitions
 */

/**
 * Area type identifier - determines the theme and background of an area
 */
export type AreaType = 'academy' | 'forest' | 'mountain' | 'harbor'

/**
 * ViewBox dimensions for the Area Map SVG canvas
 * Consistent with World Map coordinate system
 */
export interface ViewBoxDimensions {
  /** Width in viewBox units */
  width: number
  /** Height in viewBox units */
  height: number
}

/**
 * Area Map data model - represents a single hex area from the World Map
 * Contains spatial layout information and features for that area
 */
export interface AreaMap {
  /** Type of area (determines visual theme) */
  areaType: AreaType
  /** Hex coordinates from the World Map (q, r in axial coordinates) */
  coordinates: { q: number; r: number }
  /** Background color for this area (hex color code) */
  background: string
  /** Optional background image or pattern URL */
  backgroundImage?: string
  /** ViewBox dimensions for the SVG canvas (default: 300×300) */
  viewBox?: ViewBoxDimensions
  /** Features positioned within this area */
  features: Feature[]
}
