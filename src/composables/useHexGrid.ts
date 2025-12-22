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
   * Returns 10 hexes total:
   * - Academy at (0, 0) - explored, clickable
   * - Harbor at (-1, 0) - explored, clickable
   * - 5 ocean hexes surrounding Harbor - explored, NOT clickable
   * - 3 unexplored land hexes to the NE, SE, and S of Academy
   */
  const generateInitialMap = (): HexTile[] => {
    return [
      // Academy - origin point
      {
        q: 0,
        r: 0,
        explorationStatus: 'explored',
        type: 'academy',
        clickable: true,
      },
      // Harbor - NW of Academy
      {
        q: -1,
        r: 0,
        explorationStatus: 'explored',
        type: 'harbor',
        clickable: true,
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
      // Unexplored land hexes - NE, SE, S of Academy
      // Academy's NE neighbor
      {
        q: 1,
        r: -1,
        explorationStatus: 'unexplored',
      },
      // Academy's SE neighbor
      {
        q: 1,
        r: 0,
        explorationStatus: 'unexplored',
      },
      // Academy's S neighbor
      {
        q: 0,
        r: 1,
        explorationStatus: 'unexplored',
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
