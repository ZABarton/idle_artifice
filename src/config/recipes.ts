/**
 * Recipe definitions for the Foundry crafting system
 */

import type { Recipe } from '@/types/foundry'

/**
 * All available recipes in the game
 */
export const recipes: Recipe[] = [
  {
    id: 'survival-kit',
    name: 'Survival Kit',
    description: 'A basic kit containing essential supplies for exploration',
    icon: '🎒',
    inputs: [
      {
        resourceId: 'wood',
        amount: 10,
      },
    ],
    outputs: [
      {
        resourceId: 'survival-kit',
        amount: 1,
      },
    ],
    craftTime: 10, // seconds at anvil
  },
]

/**
 * Get recipe by ID
 * @param id - Recipe identifier
 * @returns Recipe or undefined if not found
 */
export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id)
}

/**
 * Get all recipes
 * @returns Array of all recipes
 */
export function getAllRecipes(): Recipe[] {
  return [...recipes]
}
