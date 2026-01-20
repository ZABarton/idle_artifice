<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFoundryStore } from '@/stores/foundry'
import { useResourcesStore } from '@/stores/resources'
import { GridCellType } from '@/types/foundry'
import type { GridCell, CraftingQueueItem, Recipe } from '@/types/foundry'

/**
 * FoundryScreen Component
 * Full-screen crafting interface for the Foundry feature
 * Displays interactive 5x5 grid with Anton's position and cell types
 */

interface Props {
  fullScreen?: boolean
}

defineProps<Props>()

// Connect to stores
const foundryStore = useFoundryStore()
const resourcesStore = useResourcesStore()

// Toggle for coordinate labels
const showCoordinates = ref(true)

// Responsive window width tracking for Anton position calculation
const windowWidth = ref(window.innerWidth)
function updateWindowWidth() {
  windowWidth.value = window.innerWidth
}
onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Edit mode state
const isEditMode = ref(false)
const selectedItem = ref<'supplyBin' | 'anvil' | null>(null)
const placementFeedback = ref<{ x: number; y: number; success: boolean } | null>(null)

// Recipe selector state
const selectedRecipeId = ref<string | null>(null)
const craftQuantity = ref(1)

// Check if Anton is actively crafting (disable editing during crafting)
const isAntonCrafting = computed(() => {
  return foundryStore.anton.currentAction !== 'idle'
})

// Get materials from resource store (filtered to show relevant crafting materials)
const materials = computed(() => {
  return resourcesStore.allResources.filter(r =>
    ['wood', 'stone', 'iron', 'gold', 'mystical-essence'].includes(r.id)
  )
})

// Get recipes from foundry store
const recipes = computed(() => foundryStore.allRecipes)

// Get the selected recipe details
const selectedRecipe = computed(() => {
  if (!selectedRecipeId.value) return null
  return foundryStore.getRecipeById(selectedRecipeId.value)
})

// Check if selected recipe can be crafted (has resources and not in edit mode)
const canCraftSelected = computed(() => {
  if (!selectedRecipeId.value) return false
  if (isEditMode.value) return false
  return foundryStore.hasRequiredResources(selectedRecipeId.value)
})

// Get missing resources for selected recipe
const missingResourcesForSelected = computed(() => {
  if (!selectedRecipeId.value) return []
  return foundryStore.getMissingResources(selectedRecipeId.value)
})

// Queue helpers
const queueItems = computed(() => foundryStore.craftingQueue)
const currentQueueItem = computed(() => foundryStore.currentQueueItem)
const isQueueEmpty = computed(() => foundryStore.craftingQueue.length === 0)

// Get recipe for a queue item
function getRecipeForQueueItem(item: CraftingQueueItem): Recipe | undefined {
  return foundryStore.getRecipeById(item.recipeId)
}

// Get status display info for a queue item
function getQueueItemStatus(item: CraftingQueueItem): { label: string; class: string } {
  switch (item.status) {
    case 'in-progress':
      return { label: 'Crafting...', class: 'status-in-progress' }
    case 'completed':
      return { label: 'Done', class: 'status-completed' }
    case 'skipped':
      return { label: 'Skipped', class: 'status-skipped' }
    default:
      return { label: 'Pending', class: 'status-pending' }
  }
}

// Check if a queue item is the current one being processed
function isCurrentQueueItem(index: number): boolean {
  return index === foundryStore.currentQueueIndex &&
         foundryStore.craftingQueue[index]?.status === 'in-progress'
}

// Calculate overall progress for the current queue item
// Phases: movingToSupplyBin (15%), gathering (20%), movingToAnvil (15%), crafting (50%)
const overallProgress = computed(() => {
  const action = foundryStore.anton.currentAction
  const stepProgress = foundryStore.anton.actionProgress

  switch (action) {
    case 'movingToSupplyBin':
      return stepProgress * 0.15
    case 'gathering':
      return 0.15 + stepProgress * 0.20
    case 'movingToAnvil':
      return 0.35 + stepProgress * 0.15
    case 'crafting':
      return 0.50 + stepProgress * 0.50
    default:
      return 0
  }
})

// Get the current phase label for display
const currentPhaseLabel = computed(() => {
  const action = foundryStore.anton.currentAction
  switch (action) {
    case 'movingToSupplyBin':
      return 'Moving to supplies...'
    case 'gathering':
      return 'Gathering materials...'
    case 'movingToAnvil':
      return 'Moving to anvil...'
    case 'crafting':
      return 'Crafting...'
    default:
      return 'Idle'
  }
})

// Add selected recipe to queue
function addToQueue(): void {
  if (!selectedRecipeId.value) return
  foundryStore.addToQueue(selectedRecipeId.value, craftQuantity.value)
  craftQuantity.value = 1
}

// Remove item from queue
function removeFromQueue(index: number): void {
  foundryStore.removeFromQueue(index)
}

// Clear only completed and skipped items from queue
function clearCompletedItems(): void {
  // Remove items in reverse order to avoid index shifting issues
  for (let i = foundryStore.craftingQueue.length - 1; i >= 0; i--) {
    const item = foundryStore.craftingQueue[i]
    if (item.status === 'completed' || item.status === 'skipped') {
      foundryStore.removeFromQueue(i)
    }
  }
}

// Check if there are any completed or skipped items to clear
const hasCompletedItems = computed(() => {
  return foundryStore.craftingQueue.some(
    item => item.status === 'completed' || item.status === 'skipped'
  )
})

// Debug: add resources for testing
function debugAddWood(): void {
  resourcesStore.addResource('wood', 10)
}

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
 * Get Anton's pixel position for smooth animation
 * Responsive cell sizes: 80px (desktop), 70px (tablet), 55px (mobile)
 * Gap: 8px, Padding: 2rem (desktop) or 1rem (mobile)
 */
const antonPixelPosition = computed(() => {
  // Use windowWidth.value to make this reactive to resize
  const width = windowWidth.value

  // Match CSS media query breakpoints
  let cellSize: number
  let padding: number

  if (width <= 768) {
    cellSize = 55
    padding = 16 // 1rem
  } else if (width <= 1024) {
    cellSize = 70
    padding = 32 // 2rem
  } else {
    cellSize = 80
    padding = 32 // 2rem
  }

  const gap = 8
  const x = padding + foundryStore.anton.position.x * (cellSize + gap)
  const y = padding + foundryStore.anton.position.y * (cellSize + gap)
  return { x, y }
})

/**
 * Check if a cell is adjacent to the supply bin
 */
function isCellAdjacentToSupplyBin(x: number, y: number): boolean {
  const binPos = foundryStore.supplyBinPosition
  if (!binPos) return false
  const dx = Math.abs(x - binPos.x)
  const dy = Math.abs(y - binPos.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

/**
 * Check if a cell is adjacent to the anvil
 */
function isCellAdjacentToAnvil(x: number, y: number): boolean {
  const anvilPos = foundryStore.anvilPosition
  if (!anvilPos) return false
  const dx = Math.abs(x - anvilPos.x)
  const dy = Math.abs(y - anvilPos.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

/**
 * Check if Anton is currently at a cell adjacent to supply bin
 */
const isAntonAdjacentToSupplyBin = computed(() => foundryStore.isAdjacentToSupplyBin)

/**
 * Check if Anton is currently at a cell adjacent to anvil
 */
const isAntonAdjacentToAnvil = computed(() => foundryStore.isAdjacentToAnvil)

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
        <button
          class="restart-button"
          @click="foundryStore.restartAnton()"
          title="Reset Anton to idle and restart queue processing"
        >
          🔄 Restart Anton
        </button>
      </div>
    </div>

    <div class="foundry-content">
      <!-- Left Panel: Materials & Recipes -->
      <aside class="foundry-sidebar">
        <!-- Materials Section -->
        <section class="sidebar-section">
          <div class="section-header">
            <h3 class="section-title">Available Materials</h3>
            <button class="debug-button" @click="debugAddWood" title="Debug: Add 10 wood">
              +10 🪵
            </button>
          </div>
          <div class="materials-list">
            <div v-for="material in materials" :key="material.id" class="material-item">
              <span class="material-icon">{{ material.icon || '📦' }}</span>
              <div class="material-info">
                <div class="material-name">{{ material.name }}</div>
                <div class="material-amount">{{ material.amount }}</div>
              </div>
            </div>
            <div v-if="materials.length === 0" class="empty-state">
              No materials available
            </div>
          </div>
        </section>

        <!-- Recipes Section -->
        <section class="sidebar-section">
          <h3 class="section-title">Recipes</h3>
          <div class="recipes-list">
            <div
              v-for="recipe in recipes"
              :key="recipe.id"
              class="recipe-item"
              :class="{
                selected: selectedRecipeId === recipe.id,
                'has-resources': foundryStore.hasRequiredResources(recipe.id)
              }"
              @click="selectedRecipeId = recipe.id"
            >
              <span class="recipe-icon">{{ recipe.icon || '🔧' }}</span>
              <span class="recipe-name">{{ recipe.name }}</span>
              <span
                v-if="!foundryStore.hasRequiredResources(recipe.id)"
                class="recipe-warning"
                title="Insufficient resources"
              >⚠️</span>
            </div>
            <div v-if="recipes.length === 0" class="empty-state">
              No recipes available
            </div>
          </div>
        </section>

        <!-- Selected Recipe Details -->
        <section v-if="selectedRecipe" class="sidebar-section recipe-details">
          <h3 class="section-title">{{ selectedRecipe.name }}</h3>
          <p v-if="selectedRecipe.description" class="recipe-description">
            {{ selectedRecipe.description }}
          </p>

          <!-- Inputs -->
          <div class="recipe-io">
            <h4>Requires:</h4>
            <div
              v-for="input in selectedRecipe.inputs"
              :key="input.resourceId"
              class="io-item"
              :class="{ missing: !resourcesStore.hasResource(input.resourceId, input.amount) }"
            >
              <span>{{ input.amount }}x {{ input.resourceId }}</span>
              <span class="io-available">
                (have: {{ resourcesStore.getResourceAmount(input.resourceId) }})
              </span>
            </div>
          </div>

          <!-- Outputs -->
          <div class="recipe-io">
            <h4>Produces:</h4>
            <div v-for="output in selectedRecipe.outputs" :key="output.resourceId" class="io-item">
              <span>{{ output.amount }}x {{ output.resourceId }}</span>
            </div>
          </div>

          <!-- Craft Time -->
          <div class="recipe-time">
            Craft time: {{ selectedRecipe.craftTime }}s
          </div>

          <!-- Add to Queue Controls -->
          <div class="add-to-queue-controls">
            <div class="quantity-selector">
              <label>Qty:</label>
              <input
                type="number"
                v-model.number="craftQuantity"
                min="1"
                max="99"
                class="quantity-input"
              />
            </div>
            <button
              class="add-queue-button"
              :disabled="!canCraftSelected"
              @click="addToQueue"
            >
              Add to Queue
            </button>
          </div>
          <div v-if="missingResourcesForSelected.length > 0" class="missing-resources">
            <span class="missing-label">Missing:</span>
            <span v-for="(m, i) in missingResourcesForSelected" :key="m.resourceId">
              {{ m.required - m.available }} {{ m.resourceId }}{{ i < missingResourcesForSelected.length - 1 ? ', ' : '' }}
            </span>
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
                    'cell-editable': isEditMode && (cell.type === GridCellType.SupplyBin || cell.type === GridCellType.Anvil),
                    'cell-adjacent-supply': isAntonAdjacentToSupplyBin && isCellAdjacentToSupplyBin(cell.x, cell.y) && isAntonAt(cell.x, cell.y),
                    'cell-adjacent-anvil': isAntonAdjacentToAnvil && isCellAdjacentToAnvil(cell.x, cell.y) && isAntonAt(cell.x, cell.y),
                    'cell-highlight-supply': isAntonAdjacentToSupplyBin && cell.type === GridCellType.SupplyBin,
                    'cell-highlight-anvil': isAntonAdjacentToAnvil && cell.type === GridCellType.Anvil,
                  },
                  getCellFeedbackClass(cell)
                ]"
                @click="handleCellClick(cell)"
              >
                <!-- Cell Icon (Supply Bin, Anvil, etc.) -->
                <span v-if="getCellIcon(cell)" class="cell-icon">{{ getCellIcon(cell) }}</span>

                <!-- Coordinate Labels -->
                <span v-if="showCoordinates" class="cell-coordinates">({{ cell.x }},{{ cell.y }})</span>

                <!-- Placement Preview -->
                <div v-if="isValidPlacementTarget(cell) && selectedItem" class="placement-preview">
                  <span class="preview-icon">{{ selectedItem === 'supplyBin' ? '📦' : '🔨' }}</span>
                </div>
              </div>
            </div>

            <!-- Anton Overlay - Positioned absolutely for smooth animation -->
            <div
              class="anton-overlay"
              :style="{
                transform: `translate(${antonPixelPosition.x}px, ${antonPixelPosition.y}px)`
              }"
            >
              <span class="anton-icon">👷</span>
              <span class="anton-label">Anton</span>
            </div>
          </div>

          <!-- Anton Status -->
          <div class="anton-status">
            <div class="anton-status-label">
              <span class="anton-icon-small">👷</span>
              <span>Anton: {{ currentPhaseLabel }}</span>
            </div>
            <div v-if="foundryStore.anton.currentAction !== 'idle'" class="anton-progress-bar">
              <div
                class="anton-progress-fill"
                :style="{ width: `${overallProgress * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Panel: Crafting Queue -->
      <aside class="queue-sidebar">
        <div class="queue-header">
          <h3 class="section-title">Crafting Queue</h3>
          <button
            v-if="hasCompletedItems"
            class="clear-queue-button"
            @click="clearCompletedItems"
            title="Clear completed and skipped items"
          >
            Clear Done
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="isQueueEmpty" class="queue-empty">
          <div class="empty-icon">📋</div>
          <p>Queue is empty</p>
          <p class="empty-hint">Select a recipe and click "Add to Queue" to start crafting</p>
        </div>

        <!-- Queue Items List -->
        <div v-else class="queue-list">
          <div
            v-for="(item, index) in queueItems"
            :key="item.id"
            class="queue-item"
            :class="[
              getQueueItemStatus(item).class,
              { 'is-current': isCurrentQueueItem(index) }
            ]"
          >
            <div class="queue-item-main">
              <span class="queue-item-icon">{{ getRecipeForQueueItem(item)?.icon || '🔧' }}</span>
              <div class="queue-item-info">
                <div class="queue-item-name">{{ getRecipeForQueueItem(item)?.name || item.recipeId }}</div>
                <div class="queue-item-status">
                  <span v-if="!isCurrentQueueItem(index)" :class="getQueueItemStatus(item).class">
                    {{ getQueueItemStatus(item).label }}
                  </span>
                  <span v-else class="status-phase">
                    {{ currentPhaseLabel }}
                  </span>
                  <!-- Overall progress bar for current item -->
                  <div v-if="isCurrentQueueItem(index)" class="queue-progress-bar">
                    <div
                      class="queue-progress-fill"
                      :style="{ width: `${overallProgress * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <button
                v-if="item.status === 'pending'"
                class="remove-item-button"
                @click="removeFromQueue(index)"
                title="Remove from queue"
              >
                ✕
              </button>
            </div>
            <!-- Skip reason for skipped items -->
            <div v-if="item.status === 'skipped' && item.skipReason" class="queue-item-skip-reason">
              ⚠️ {{ item.skipReason }}
            </div>
          </div>
        </div>
      </aside>
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

.restart-button {
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 200, 100, 0.5);
  border-radius: 6px;
  background-color: rgba(255, 200, 100, 0.2);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.restart-button:hover {
  background-color: rgba(255, 200, 100, 0.4);
  border-color: rgba(255, 200, 100, 0.8);
}

/* Main Content Layout */
.foundry-content {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 280px;
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
  position: relative;
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
  box-sizing: border-box;
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

/* Anton Overlay - Positioned absolutely for smooth movement animation */
.anton-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  z-index: 20;
  pointer-events: none;
  transition: transform 1s ease-in-out;
  box-sizing: border-box;
}

/* Anton Icon - Centered in the cell */
.anton-overlay .anton-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Anton Label - Positioned at bottom center */
.anton-overlay .anton-label {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Adjacent Cell Highlighting */
.cell-highlight-supply {
  box-shadow: 0 0 12px 4px rgba(59, 130, 246, 0.5) !important;
  border-color: #3b82f6 !important;
  animation: glow-supply 1.5s ease-in-out infinite;
}

.cell-highlight-anvil {
  box-shadow: 0 0 12px 4px rgba(245, 158, 11, 0.5) !important;
  border-color: #f59e0b !important;
  animation: glow-anvil 1.5s ease-in-out infinite;
}

@keyframes glow-supply {
  0%, 100% {
    box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 16px 6px rgba(59, 130, 246, 0.6);
  }
}

@keyframes glow-anvil {
  0%, 100% {
    box-shadow: 0 0 8px 2px rgba(245, 158, 11, 0.4);
  }
  50% {
    box-shadow: 0 0 16px 6px rgba(245, 158, 11, 0.6);
  }
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

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-button {
  padding: 0.25rem 0.5rem;
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.debug-button:hover {
  background-color: #fde68a;
  border-color: #f59e0b;
}

/* Recipe Selection Styles */
.recipe-item {
  cursor: pointer;
}

.recipe-item.selected {
  border-color: #667eea;
  background-color: #eef2ff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.recipe-item.has-resources {
  border-left: 3px solid #10b981;
}

.recipe-warning {
  font-size: 1rem;
  margin-left: auto;
}

/* Recipe Details Section */
.recipe-details {
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.recipe-description {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
}

.recipe-io {
  margin-bottom: 0.75rem;
}

.recipe-io h4 {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.25rem 0;
}

.io-item {
  font-size: 0.85rem;
  color: #334155;
  padding: 0.25rem 0;
  display: flex;
  justify-content: space-between;
}

.io-item.missing {
  color: #dc2626;
}

.io-available {
  color: #64748b;
  font-size: 0.8rem;
}

.recipe-time {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.add-to-queue-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.quantity-selector label {
  font-size: 0.85rem;
  color: #475569;
}

.quantity-input {
  width: 50px;
  padding: 0.375rem 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

.add-queue-button {
  flex: 1;
  padding: 0.5rem 1rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-queue-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.add-queue-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.missing-resources {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #dc2626;
}

.missing-label {
  font-weight: 600;
}

/* Anton Status */
.anton-status {
  margin-top: 1rem;
  padding: 1rem;
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
}

.anton-status-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.5rem;
}

.anton-icon-small {
  font-size: 1.25rem;
}

.anton-progress-bar {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.anton-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.1s linear;
}

/* Queue Sidebar */
.queue-sidebar {
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.queue-header .section-title {
  margin: 0;
}

.clear-queue-button {
  padding: 0.375rem 0.75rem;
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-queue-button:hover {
  background-color: #fee2e2;
  border-color: #f87171;
}

/* Queue Empty State */
.queue-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  padding: 2rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.queue-empty p {
  margin: 0;
  font-size: 0.9rem;
}

.empty-hint {
  font-size: 0.8rem !important;
  color: #94a3b8;
  margin-top: 0.5rem !important;
}

/* Queue List */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.queue-item {
  padding: 0.75rem;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.queue-item.is-current {
  border-color: #667eea;
  background-color: #eef2ff;
}

.queue-item-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.queue-item-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.queue-item-info {
  flex: 1;
  min-width: 0;
}

.queue-item-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item-status {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.status-pending {
  color: #64748b;
}

.status-in-progress {
  color: #667eea;
  font-weight: 600;
}

.status-completed {
  color: #10b981;
}

.status-skipped {
  color: #f59e0b;
}

.status-phase {
  color: #667eea;
  font-weight: 500;
  font-size: 0.7rem;
}

.queue-progress-bar {
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.queue-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.1s linear;
}

.remove-item-button {
  padding: 0.25rem 0.5rem;
  background-color: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-item-button:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.queue-item-skip-reason {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #e2e8f0;
  font-size: 0.75rem;
  color: #f59e0b;
}

/* Empty State */
.empty-state {
  padding: 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .foundry-content {
    grid-template-columns: 280px 1fr 240px;
  }
}

@media (max-width: 1024px) {
  .foundry-content {
    grid-template-columns: 250px 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .queue-sidebar {
    display: none;
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

  .anton-overlay {
    width: 70px;
    height: 70px;
  }

  .anton-overlay .anton-icon {
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

  .queue-sidebar {
    display: none;
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

  .anton-overlay {
    width: 55px;
    height: 55px;
  }

  .anton-overlay .anton-icon {
    font-size: 1.5rem;
  }

  .anton-overlay .anton-label {
    font-size: 0.55rem;
    bottom: 1px;
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
