import {
  defineHex,
  Grid,
  spiral,
  distance,
  neighborOf,
  Direction,
  Orientation,
} from 'honeycomb-grid'
import type { HexTile } from '@/types/hex'

/**
 * Hex grid configuration
 * - Flat-top orientation (pointy top would be Orientation.POINTY)
 * - Size represents the distance from center to edge
 */
const HexClass = defineHex({
  dimensions: 30, // radius in pixels
  orientation: Orientation.FLAT, // flat edge on top
})

/**
 * Composable for hexagonal grid operations
 */
export function useHexGrid() {
  /**
   * Creates a grid with the specified hexagons
   */
  const createGrid = (hexes: { q: number; r: number }[]) => {
    return new Grid(HexClass, hexes)
  }

  /**
   * Generates the initial 7-hexagon layout (1 center + 6 surrounding)
   * Returns an array of HexTile objects
   */
  const generateInitialMap = (): HexTile[] => {
    // Create center hex at origin (0, 0)
    const centerHex: HexTile = {
      q: 0,
      r: 0,
      explorationStatus: 'explored',
      type: 'academy',
    }

    // Create 6 surrounding hexes using honeycomb-grid's spiral traverser
    // spiral(center, radius) generates hexes in a spiral pattern
    const grid = new Grid(HexClass, spiral({ radius: 1 }))
    const surroundingHexes: HexTile[] = Array.from(grid)
      .filter((hex) => !(hex.q === 0 && hex.r === 0)) // exclude center
      .map((hex) => ({
        q: hex.q,
        r: hex.r,
        explorationStatus: 'unexplored' as const,
      }))

    return [centerHex, ...surroundingHexes]
  }

  /**
   * Gets neighboring hexagons for a given hex coordinate
   * Returns array of 6 neighbor coordinates for flat-top hexes
   */
  const getNeighbors = (q: number, r: number) => {
    const hex = new HexClass({ q, r })
    // For flat-top hexes, use N, NE, SE, S, SW, NW directions
    const directions = [
      Direction.N,
      Direction.NE,
      Direction.SE,
      Direction.S,
      Direction.SW,
      Direction.NW,
    ]
    return directions.map((dir) => neighborOf(hex, dir))
  }

  /**
   * Calculates distance between two hexagons
   */
  const getDistance = (q1: number, r1: number, q2: number, r2: number) => {
    const hexSettings = HexClass.prototype
    return distance(hexSettings, { q: q1, r: r1 }, { q: q2, r: r2 })
  }

  /**
   * Converts hex coordinates to pixel coordinates
   */
  const hexToPixel = (q: number, r: number) => {
    const hex = new HexClass({ q, r })
    return { x: hex.x, y: hex.y }
  }

  return {
    HexClass,
    createGrid,
    generateInitialMap,
    getNeighbors,
    getDistance,
    hexToPixel,
  }
}
