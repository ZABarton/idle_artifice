import {
  defineHex,
  Grid,
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
   * Generates the initial hexagon layout for the first gameplay loop
   * Returns 7 hexes total:
   * - Harbor at (-1, 0) - explored, clickable
   * - Academy at (0, 0) - unexplored (visible because adjacent to Harbor)
   * - 5 ocean hexes surrounding Harbor - explored, NOT clickable
   *
   * The 3 land hexes around Academy (NE, SE, S) are added when Academy becomes explored
   */
  const generateInitialMap = (): HexTile[] => {
    return [
      // Harbor - starting point, NW of Academy
      {
        q: -1,
        r: 0,
        explorationStatus: 'explored',
        type: 'harbor',
        clickable: true,
      },
      // Academy - origin point, initially unexplored (visible as neighbor of Harbor)
      {
        q: 0,
        r: 0,
        explorationStatus: 'unexplored',
        type: 'academy',
        clickable: false,
      },
      // Ocean hexes - all neighbors of Harbor except Academy
      // Harbor's N neighbor
      {
        q: -1,
        r: -1,
        explorationStatus: 'explored',
        type: 'ocean',
        clickable: false,
      },
      // Harbor's NE neighbor
      {
        q: 0,
        r: -1,
        explorationStatus: 'explored',
        type: 'ocean',
        clickable: false,
      },
      // Harbor's S neighbor
      {
        q: -1,
        r: 1,
        explorationStatus: 'explored',
        type: 'ocean',
        clickable: false,
      },
      // Harbor's SW neighbor
      {
        q: -2,
        r: 1,
        explorationStatus: 'explored',
        type: 'ocean',
        clickable: false,
      },
      // Harbor's NW neighbor
      {
        q: -2,
        r: 0,
        explorationStatus: 'explored',
        type: 'ocean',
        clickable: false,
      },
    ]
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
