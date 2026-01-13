<script setup lang="ts">
import { ref } from 'vue'
import { useFoundryStore } from '@/stores/foundry'
import { GridCellType } from '@/types/foundry'
import type { GridCell } from '@/types/foundry'

/**
 * FoundryScreen Component
 * Full-screen crafting interface for the Foundry feature
 * Displays interactive 5x5 grid with Anton's position and cell types
 */

interface Props {
  fullScreen?: boolean
}

defineProps<Props>()

// Connect to foundry store
const foundryStore = useFoundryStore()

// Toggle for coordinate labels
const showCoordinates = ref(true)

// Mock data for placeholder display
const mockMaterials = ref([
  { id: 'wood', name: 'Wood', amount: 25, icon: '🪵' },
  { id: 'stone', name: 'Stone', amount: 12, icon: '🪨' },
  { id: 'iron', name: 'Iron Ore', amount: 8, icon: '⛏️' },
  { id: 'crystal', name: 'Crystal Shards', amount: 3, icon: '💎' },
])

const mockRecipes = ref([
  { id: 'sword', name: 'Iron Sword', unlocked: true, icon: '⚔️' },
  { id: 'shield', name: 'Wooden Shield', unlocked: true, icon: '🛡️' },
  { id: 'staff', name: 'Crystal Staff', unlocked: false, icon: '🪄' },
])

/**
 * Get icon for cell type
 */
function getCellIcon(cell: GridCell): string {
  switch (cell.type) {
    case GridCellType.SupplyBin:
      return '📦'
    case GridCellType.Anvil:
      return '🔨'
    case GridCellType.Blocked:
      return '🚫'
    default:
      return ''
  }
}

/**
 * Get CSS class for cell type
 */
function getCellClass(cell: GridCell): string {
  switch (cell.type) {
    case GridCellType.SupplyBin:
      return 'cell-supply-bin'
    case GridCellType.Anvil:
      return 'cell-anvil'
    case GridCellType.Blocked:
      return 'cell-blocked'
    default:
      return 'cell-empty'
  }
}

/**
 * Check if Anton is at this position
 */
function isAntonAt(x: number, y: number): boolean {
  return foundryStore.anton.position.x === x && foundryStore.anton.position.y === y
}
</script>

<template>
  <div class="foundry-screen">
    <!-- Header -->
    <div class="foundry-header">
      <h2>Foundry Crafting System</h2>
      <div class="header-controls">
        <label class="coordinate-toggle">
          <input type="checkbox" v-model="showCoordinates" />
          <span>Show Coordinates</span>
        </label>
      </div>
    </div>

    <div class="foundry-content">
      <!-- Left Panel: Materials & Recipes -->
      <aside class="foundry-sidebar">
        <!-- Materials Section -->
        <section class="sidebar-section">
          <h3 class="section-title">Available Materials</h3>
          <div class="materials-list">
            <div v-for="material in mockMaterials" :key="material.id" class="material-item">
              <span class="material-icon">{{ material.icon }}</span>
              <div class="material-info">
                <div class="material-name">{{ material.name }}</div>
                <div class="material-amount">{{ material.amount }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Recipes Section -->
        <section class="sidebar-section">
          <h3 class="section-title">Available Recipes</h3>
          <div class="recipes-list">
            <div
              v-for="recipe in mockRecipes"
              :key="recipe.id"
              class="recipe-item"
              :class="{ locked: !recipe.unlocked }"
            >
              <span class="recipe-icon">{{ recipe.icon }}</span>
              <span class="recipe-name">{{ recipe.name }}</span>
              <span v-if="!recipe.unlocked" class="recipe-lock">🔒</span>
            </div>
          </div>
        </section>
      </aside>

      <!-- Main Panel: Crafting Grid -->
      <main class="foundry-main">
        <div class="crafting-grid-container">
          <h3 class="section-title">Crafting Grid ({{ foundryStore.gridSize.width }}x{{ foundryStore.gridSize.height }})</h3>

          <!-- Actual Grid from Store -->
          <div class="crafting-grid">
            <div v-for="(row, rowIndex) in foundryStore.grid" :key="rowIndex" class="grid-row">
              <div
                v-for="(cell, colIndex) in row"
                :key="`${rowIndex}-${colIndex}`"
                class="grid-cell"
                :class="getCellClass(cell)"
              >
                <!-- Cell Icon (Supply Bin, Anvil, etc.) -->
                <span v-if="getCellIcon(cell)" class="cell-icon">{{ getCellIcon(cell) }}</span>

                <!-- Anton's Position -->
                <div v-if="isAntonAt(cell.x, cell.y)" class="anton-marker">
                  <span class="anton-icon">👷</span>
                  <span class="anton-label">Anton</span>
                </div>

                <!-- Coordinate Labels -->
                <span v-if="showCoordinates" class="cell-coordinates">({{ cell.x }},{{ cell.y }})</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="crafting-actions">
            <button class="action-button action-button--secondary" disabled>Clear Grid</button>
            <button class="action-button action-button--primary" disabled>Craft Item</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.foundry-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
  overflow: hidden;
}

/* Header */
.foundry-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.foundry-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.coordinate-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
}

.coordinate-toggle input[type='checkbox'] {
  cursor: pointer;
}

/* Main Content Layout */
.foundry-content {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow: hidden;
  min-height: 0;
}

/* Sidebar */
.foundry-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Materials List */
.materials-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.material-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.material-icon {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.material-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.material-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.material-amount {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* Recipes List */
.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.recipe-item:not(.locked):hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.recipe-item.locked {
  opacity: 0.6;
  background-color: #f8fafc;
}

.recipe-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.recipe-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.recipe-lock {
  font-size: 1rem;
  opacity: 0.5;
}

/* Main Crafting Area */
.foundry-main {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.crafting-grid-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Actual Grid */
.crafting-grid {
  background-color: white;
  border: 3px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  align-self: center;
}

.grid-row {
  display: flex;
  gap: 8px;
}

.grid-cell {
  position: relative;
  width: 80px;
  height: 80px;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Cell Type Styles */
.cell-empty {
  background-color: #ffffff;
}

.cell-supply-bin {
  background-color: #dbeafe;
  border-color: #3b82f6;
}

.cell-anvil {
  background-color: #fef3c7;
  border-color: #f59e0b;
}

.cell-blocked {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  opacity: 0.6;
}

/* Cell Icons */
.cell-icon {
  font-size: 2.5rem;
  line-height: 1;
  position: absolute;
  z-index: 1;
}

/* Anton Marker */
.anton-marker {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
}

.anton-icon {
  font-size: 2rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.anton-label {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Coordinate Labels */
.cell-coordinates {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 0.65rem;
  color: #94a3b8;
  font-family: monospace;
  font-weight: 500;
  z-index: 0;
  pointer-events: none;
}

/* Hover States */
.grid-cell:hover {
  border-color: #7c3aed;
  box-shadow: 0 4px 8px rgba(124, 58, 237, 0.2);
  transform: translateY(-2px);
}

/* Action Buttons */
.crafting-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.action-button {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button--secondary {
  background-color: #e2e8f0;
  color: #475569;
}

.action-button--secondary:not(:disabled):hover {
  background-color: #cbd5e1;
}

.action-button--primary {
  background-color: #4a90e2;
  color: white;
}

.action-button--primary:not(:disabled):hover {
  background-color: #357abd;
  box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);
}

/* Scrollbar Styling */
.foundry-sidebar::-webkit-scrollbar,
.foundry-main::-webkit-scrollbar {
  width: 8px;
}

.foundry-sidebar::-webkit-scrollbar-track,
.foundry-main::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.foundry-sidebar::-webkit-scrollbar-thumb,
.foundry-main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.foundry-sidebar::-webkit-scrollbar-thumb:hover,
.foundry-main::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .foundry-content {
    grid-template-columns: 250px 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .foundry-header {
    padding: 1.25rem 1.5rem;
  }

  .foundry-header h2 {
    font-size: 1.5rem;
  }

  .grid-cell {
    width: 70px;
    height: 70px;
  }

  .cell-icon {
    font-size: 2rem;
  }

  .anton-icon {
    font-size: 1.75rem;
  }
}

@media (max-width: 768px) {
  .foundry-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .foundry-sidebar {
    order: 2;
    max-height: 300px;
  }

  .foundry-main {
    order: 1;
  }

  .foundry-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .crafting-grid {
    padding: 1rem;
  }

  .grid-cell {
    width: 55px;
    height: 55px;
  }

  .cell-icon {
    font-size: 1.5rem;
  }

  .anton-icon {
    font-size: 1.5rem;
  }

  .anton-label {
    font-size: 0.6rem;
  }

  .cell-coordinates {
    font-size: 0.55rem;
  }

  .crafting-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
