<script setup lang="ts">
import { ref, computed } from 'vue'
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

// Edit mode state
const isEditMode = ref(false)
const selectedItem = ref<'supplyBin' | 'anvil' | null>(null)
const placementFeedback = ref<{ x: number; y: number; success: boolean } | null>(null)

// Check if Anton is actively crafting (disable editing during crafting)
const isAntonCrafting = computed(() => {
  return foundryStore.anton.currentAction !== 'idle'
})

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

/**
 * Toggle edit mode
 */
function toggleEditMode(): void {
  isEditMode.value = !isEditMode.value
  // Clear selection when exiting edit mode
  if (!isEditMode.value) {
    selectedItem.value = null
    placementFeedback.value = null
  }
}

/**
 * Handle grid cell click in edit mode
 */
function handleCellClick(cell: GridCell): void {
  if (!isEditMode.value) return

  // If an item is selected, try to place it
  if (selectedItem.value) {
    placeCellItem(cell.x, cell.y)
  } else {
    // Otherwise, try to select an item
    selectCellItem(cell)
  }
}

/**
 * Select an item (supply bin or anvil) for moving
 */
function selectCellItem(cell: GridCell): void {
  if (cell.type === GridCellType.SupplyBin) {
    // Toggle selection - deselect if already selected
    selectedItem.value = selectedItem.value === 'supplyBin' ? null : 'supplyBin'
  } else if (cell.type === GridCellType.Anvil) {
    // Toggle selection - deselect if already selected
    selectedItem.value = selectedItem.value === 'anvil' ? null : 'anvil'
  }
}

/**
 * Place selected item at target position
 */
function placeCellItem(x: number, y: number): void {
  if (!selectedItem.value) return

  // Cannot place on Anton's position
  if (isAntonAt(x, y)) {
    showPlacementFeedback(x, y, false)
    return
  }

  let success = false
  if (selectedItem.value === 'supplyBin') {
    success = foundryStore.moveSupplyBin(x, y)
  } else if (selectedItem.value === 'anvil') {
    success = foundryStore.moveAnvil(x, y)
  }

  showPlacementFeedback(x, y, success)

  // Clear selection on successful placement
  if (success) {
    selectedItem.value = null
  }
}

/**
 * Show visual feedback for placement attempt
 */
function showPlacementFeedback(x: number, y: number, success: boolean): void {
  placementFeedback.value = { x, y, success }
  // Clear feedback after animation
  setTimeout(() => {
    placementFeedback.value = null
  }, 600)
}

/**
 * Check if this cell is the selected item
 */
function isCellSelected(cell: GridCell): boolean {
  if (!selectedItem.value) return false
  if (selectedItem.value === 'supplyBin' && cell.type === GridCellType.SupplyBin) return true
  if (selectedItem.value === 'anvil' && cell.type === GridCellType.Anvil) return true
  return false
}

/**
 * Check if this cell is a valid placement target
 */
function isValidPlacementTarget(cell: GridCell): boolean {
  if (!isEditMode.value || !selectedItem.value) return false

  // Cannot place on Anton
  if (isAntonAt(cell.x, cell.y)) return false

  // Cannot place on blocked cells
  if (cell.type === GridCellType.Blocked) return false

  // Cannot place supply bin on anvil or vice versa
  if (selectedItem.value === 'supplyBin' && cell.type === GridCellType.Anvil) return false
  if (selectedItem.value === 'anvil' && cell.type === GridCellType.SupplyBin) return false

  return true
}

/**
 * Check if this cell has placement feedback
 */
function getCellFeedbackClass(cell: GridCell): string | null {
  if (!placementFeedback.value) return null
  if (placementFeedback.value.x === cell.x && placementFeedback.value.y === cell.y) {
    return placementFeedback.value.success ? 'placement-success' : 'placement-failure'
  }
  return null
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
        <button
          class="edit-mode-button"
          :class="{ active: isEditMode }"
          :disabled="isAntonCrafting"
          @click="toggleEditMode"
          :title="isAntonCrafting ? 'Cannot edit while Anton is crafting' : ''"
        >
          {{ isEditMode ? '💾 Save Layout' : '✏️ Edit Layout' }}
        </button>
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
          <div class="crafting-grid" :class="{ 'edit-mode': isEditMode }">
            <div v-for="(row, rowIndex) in foundryStore.grid" :key="rowIndex" class="grid-row">
              <div
                v-for="(cell, colIndex) in row"
                :key="`${rowIndex}-${colIndex}`"
                class="grid-cell"
                :class="[
                  getCellClass(cell),
                  {
                    'cell-selected': isCellSelected(cell),
                    'cell-placement-target': isValidPlacementTarget(cell),
                    'cell-editable': isEditMode.value && (cell.type === GridCellType.SupplyBin || cell.type === GridCellType.Anvil),
                  },
                  getCellFeedbackClass(cell)
                ]"
                @click="handleCellClick(cell)"
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

                <!-- Placement Preview -->
                <div v-if="isValidPlacementTarget(cell) && selectedItem" class="placement-preview">
                  <span class="preview-icon">{{ selectedItem === 'supplyBin' ? '📦' : '🔨' }}</span>
                </div>
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

.edit-mode-button {
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.edit-mode-button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.edit-mode-button.active {
  background-color: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border-color: white;
}

.edit-mode-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Edit Mode States */
.crafting-grid.edit-mode .grid-cell {
  cursor: default;
}

.crafting-grid.edit-mode .cell-editable {
  cursor: pointer;
}

.crafting-grid.edit-mode .cell-editable:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

/* Selected Cell - Pulsing Border Animation */
.cell-selected {
  border-width: 3px;
  animation: pulse-border 1.5s ease-in-out infinite;
  cursor: pointer !important;
}

@keyframes pulse-border {
  0%, 100% {
    border-color: #3b82f6;
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    border-color: #2563eb;
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

/* Placement Target - Valid cells for placement */
.cell-placement-target {
  cursor: pointer !important;
  position: relative;
}

.cell-placement-target:hover {
  border-color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

/* Placement Preview */
.placement-preview {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(16, 185, 129, 0.1);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 5;
}

.cell-placement-target:hover .placement-preview {
  opacity: 1;
}

.preview-icon {
  font-size: 2rem;
  opacity: 0.6;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Placement Feedback Animations */
.placement-success {
  animation: flash-success 0.6s ease-out;
}

.placement-failure {
  animation: flash-failure 0.6s ease-out;
}

@keyframes flash-success {
  0% {
    background-color: rgba(16, 185, 129, 0.8);
    border-color: #10b981;
    transform: scale(1.05);
  }
  100% {
    background-color: inherit;
    border-color: inherit;
    transform: scale(1);
  }
}

@keyframes flash-failure {
  0%, 50%, 100% {
    background-color: rgba(239, 68, 68, 0.3);
    border-color: #ef4444;
  }
  25%, 75% {
    background-color: rgba(239, 68, 68, 0.6);
    border-color: #dc2626;
    transform: translateX(-4px);
  }
  50% {
    transform: translateX(4px);
  }
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
