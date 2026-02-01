<script setup lang="ts">
import { ref } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useFoundryStore } from '@/stores/foundry'
import { useHexGrid } from '@/composables/useHexGrid'
import { useSaveManager } from '@/composables/useSaveManager'
import { useNotificationsStore } from '@/stores/notifications'

const worldMapStore = useWorldMapStore()
const foundryStore = useFoundryStore()
const hexGrid = useHexGrid()
const saveManager = useSaveManager()
const notifications = useNotificationsStore()

const fileInput = ref<HTMLInputElement | null>(null)
const importSummary = ref<string>('')
const showImportConfirm = ref(false)
const pendingSaveFile = ref<any>(null)

/**
 * Reset entire game by clearing all localStorage and reloading
 * Equivalent to clearing localStorage in DevTools
 */
function resetGame() {
  const confirmed = window.confirm(
    'This will clear ALL game progress and restart from scratch. Are you sure?'
  )

  if (confirmed) {
    // Clear all localStorage (not just game keys, to be thorough)
    localStorage.clear()

    // Reload page to reinitialize all stores
    window.location.reload()
  }
}

/**
 * Export current game state as downloadable JSON
 */
function exportSave() {
  try {
    const saveFile = saveManager.exportGameState()
    saveManager.downloadSaveFile(saveFile)
    notifications.showSuccess('Save Exported', 'Your game has been exported successfully!', 3000)
  } catch (error) {
    console.error('Export failed:', error)
    notifications.showError(
      'Export Failed',
      error instanceof Error ? error.message : 'Unknown error occurred',
      5000
    )
  }
}

/**
 * Trigger file input click for import
 */
function triggerImport() {
  fileInput.value?.click()
}

/**
 * Handle file selection for import
 */
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  try {
    // Parse file
    const data = await saveManager.parseSaveFile(file)

    // Validate
    const validation = saveManager.validateSaveFile(data)

    if (!validation.valid) {
      notifications.showError(
        'Invalid Save File',
        `Validation errors:\n${validation.errors.join('\n')}`,
        8000
      )
      return
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Save file warnings:', validation.warnings)
    }

    // Store for confirmation
    pendingSaveFile.value = data

    // Generate summary
    const saveFile = data as any
    const gameState = saveFile.gameState

    const objectivesCount = gameState.objectives?.objectives?.length || 0
    const completedObjectives =
      gameState.objectives?.objectives?.filter((o: any) => o.status === 'completed').length || 0
    const resourcesCount = gameState.resources?.resources?.length || 0
    const exploredTiles =
      gameState.worldMap?.hexTiles?.filter((t: any) => t.explorationStatus === 'explored').length ||
      0
    const totalTiles = gameState.worldMap?.hexTiles?.length || 0

    importSummary.value = `
Save File Version: ${saveFile.version}
Created: ${new Date(saveFile.timestamp).toLocaleString()}

Objectives: ${completedObjectives}/${objectivesCount} completed
Resources: ${resourcesCount} types
World Map: ${exploredTiles}/${totalTiles} tiles explored
Completed Tutorials: ${gameState.dialogs?.completedTutorials?.length || 0}

${validation.warnings.length > 0 ? '\nWarnings:\n' + validation.warnings.join('\n') : ''}
    `.trim()

    // Show confirmation dialog
    showImportConfirm.value = true
  } catch (error) {
    console.error('Import file read failed:', error)
    notifications.showError(
      'Import Failed',
      error instanceof Error ? error.message : 'Failed to read save file',
      5000
    )
  } finally {
    // Reset file input
    if (target) {
      target.value = ''
    }
  }
}

/**
 * Confirm and apply import
 */
function confirmImport() {
  if (!pendingSaveFile.value) {
    return
  }

  try {
    saveManager.importGameState(pendingSaveFile.value)
    notifications.showSuccess(
      'Import Successful',
      'Your save has been loaded. Reloading page...',
      2000
    )

    // Reload page to reinitialize all stores with new data
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  } catch (error) {
    console.error('Import failed:', error)
    notifications.showError(
      'Import Failed',
      error instanceof Error ? error.message : 'Failed to apply save file',
      5000
    )
  } finally {
    showImportConfirm.value = false
    pendingSaveFile.value = null
  }
}

/**
 * Cancel import
 */
function cancelImport() {
  showImportConfirm.value = false
  pendingSaveFile.value = null
  importSummary.value = ''
}
</script>

<template>
  <div id="debug">
    <h1>Idle Artifice - Setup Verification</h1>

    <div class="verification-section">
      <h2>Pinia Store Status</h2>
      <p>Total hexagons: {{ worldMapStore.hexTiles.length }}</p>
      <p>Explored tiles: {{ worldMapStore.exploredTiles.length }}</p>
      <p>Unexplored tiles: {{ worldMapStore.unexploredTiles.length }}</p>
      <p>
        Academy location: ({{ worldMapStore.academyTile?.q }}, {{ worldMapStore.academyTile?.r }})
      </p>
    </div>

    <div class="verification-section">
      <h2>Foundry Status</h2>
      <div class="foundry-info">
        <div class="foundry-grid-info">
          <h3>Grid Configuration</h3>
          <p>Grid size: {{ foundryStore.gridSize.width }}x{{ foundryStore.gridSize.height }}</p>
          <p>
            Supply bin position: ({{ foundryStore.supplyBinPosition?.x }},
            {{ foundryStore.supplyBinPosition?.y }})
          </p>
          <p>
            Anvil position: ({{ foundryStore.anvilPosition?.x }},
            {{ foundryStore.anvilPosition?.y }})
          </p>
        </div>

        <div class="foundry-anton-info">
          <h3>Anton Status</h3>
          <p>
            Position: ({{ foundryStore.anton.position.x }}, {{ foundryStore.anton.position.y }})
          </p>
          <p>Current action: {{ foundryStore.anton.currentAction }}</p>
          <p>Action progress: {{ (foundryStore.anton.actionProgress * 100).toFixed(1) }}%</p>
          <p>Current recipe: {{ foundryStore.anton.currentRecipeId || 'None' }}</p>
        </div>

        <div class="foundry-queue-info">
          <h3>Crafting Queue ({{ foundryStore.craftingQueue.length }} items)</h3>
          <p v-if="foundryStore.craftingQueue.length === 0" class="empty-message">Queue is empty</p>
          <table v-else class="queue-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Recipe ID</th>
                <th>Status</th>
                <th>Skip Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in foundryStore.craftingQueue"
                :key="item.id"
                :class="{
                  'queue-current': index === foundryStore.currentQueueIndex,
                  'queue-skipped': item.status === 'skipped',
                  'queue-in-progress': item.status === 'in-progress',
                  'queue-completed': item.status === 'completed',
                }"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ item.recipeId }}</td>
                <td>
                  <span class="status-badge" :class="`status-${item.status}`">
                    {{ item.status }}
                  </span>
                </td>
                <td>{{ item.skipReason || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="foundryStore.craftingQueue.length > 0" class="queue-index-info">
            Current queue index: {{ foundryStore.currentQueueIndex }}
          </p>
        </div>
      </div>

      <div class="foundry-actions">
        <button @click="foundryStore.addToQueue('survival-kit')">Add Test Item to Queue</button>
        <button @click="foundryStore.clearQueue()">Clear Queue</button>
        <button @click="foundryStore.resetFoundry()">Reset Foundry</button>
      </div>
    </div>

    <div class="verification-section">
      <h2>Hex Grid Data</h2>
      <table>
        <thead>
          <tr>
            <th>Q</th>
            <th>R</th>
            <th>Status</th>
            <th>Type</th>
            <th>Pixel X</th>
            <th>Pixel Y</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tile in worldMapStore.hexTiles" :key="`${tile.q},${tile.r}`">
            <td>{{ tile.q }}</td>
            <td>{{ tile.r }}</td>
            <td>{{ tile.explorationStatus }}</td>
            <td>{{ tile.type || '-' }}</td>
            <td>{{ hexGrid.hexToPixel(tile.q, tile.r).x.toFixed(1) }}</td>
            <td>{{ hexGrid.hexToPixel(tile.q, tile.r).y.toFixed(1) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="verification-section">
      <h2>Save Management</h2>
      <div class="save-actions">
        <button class="export-button" @click="exportSave()">📥 Export Save File</button>
        <button class="import-button" @click="triggerImport()">📤 Import Save File</button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>
      <p class="save-info">
        Export your game to a JSON file for backup or transfer. Import to restore a previous save.
      </p>
    </div>

    <div class="verification-section">
      <h2>Test Actions</h2>
      <button
        @click="
          worldMapStore.exploreTile(
            worldMapStore.unexploredTiles[0]?.q,
            worldMapStore.unexploredTiles[0]?.r
          )
        "
      >
        Explore First Tile
      </button>
      <button @click="worldMapStore.resetMap()">Reset Map</button>
      <button class="reset-game-button" @click="resetGame()">
        🗑️ Reset Entire Game (Clear localStorage)
      </button>
    </div>

    <div class="verification-section">
      <h2>Development Tools</h2>
      <router-link to="/dev/dialog-editor">
        <button>Dialog Tree Editor</button>
      </router-link>
    </div>

    <!-- Import Confirmation Dialog -->
    <div v-if="showImportConfirm" class="modal-overlay" @click="cancelImport">
      <div class="modal-content" @click.stop>
        <h2>Import Save File?</h2>
        <pre class="import-summary">{{ importSummary }}</pre>
        <p class="warning-text">
          ⚠️ This will OVERWRITE all your current progress. This action cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="confirm-button" @click="confirmImport()">Confirm Import</button>
          <button class="cancel-button" @click="cancelImport()">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#debug {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

.verification-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  padding: 0.5rem;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

button {
  margin: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.reset-game-button {
  background-color: #dc3545;
  color: white;
  border: 2px solid #c82333;
  font-weight: bold;
}

.reset-game-button:hover {
  background-color: #c82333;
  border-color: #bd2130;
}

.reset-game-button:active {
  background-color: #bd2130;
}

.save-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.export-button {
  background-color: #28a745;
  color: white;
  border: 2px solid #218838;
  font-weight: bold;
}

.export-button:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

.import-button {
  background-color: #007bff;
  color: white;
  border: 2px solid #0056b3;
  font-weight: bold;
}

.import-button:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.save-info {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
  color: #333;
}

.import-summary {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.warning-text {
  color: #dc3545;
  font-weight: bold;
  margin: 1rem 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.confirm-button {
  background-color: #007bff;
  color: white;
  border: 2px solid #0056b3;
  font-weight: bold;
}

.confirm-button:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  border: 2px solid #545b62;
}

.cancel-button:hover {
  background-color: #545b62;
  border-color: #4e555b;
}

/* Foundry debug styles */
.foundry-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.foundry-info > div {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.foundry-info h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.25rem;
}

.foundry-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.foundry-queue-info {
  grid-column: 1 / -1;
}

.queue-table {
  width: 100%;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.queue-table th {
  background-color: #007bff;
  color: white;
}

.queue-table tbody tr {
  transition: background-color 0.2s;
}

.queue-table tbody tr:hover {
  background-color: #f0f0f0;
}

.queue-current {
  background-color: #fff3cd !important;
  border-left: 4px solid #ffc107;
}

.queue-current:hover {
  background-color: #ffe69c !important;
}

.queue-in-progress {
  background-color: #cfe2ff;
}

.queue-skipped {
  background-color: #f8d7da;
}

.queue-completed {
  background-color: #d1e7dd;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-pending {
  background-color: #e7e7e7;
  color: #666;
}

.status-in-progress {
  background-color: #0d6efd;
  color: white;
}

.status-skipped {
  background-color: #dc3545;
  color: white;
}

.status-completed {
  background-color: #198754;
  color: white;
}

.empty-message {
  color: #999;
  font-style: italic;
}

.queue-index-info {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  font-weight: bold;
}

.foundry-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.foundry-actions button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.foundry-actions button:hover {
  background-color: #0056b3;
}
</style>
