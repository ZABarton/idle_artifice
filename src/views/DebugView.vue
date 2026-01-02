<script setup lang="ts">
import { useWorldMapStore } from '@/stores/worldMap'
import { useHexGrid } from '@/composables/useHexGrid'

const worldMapStore = useWorldMapStore()
const hexGrid = useHexGrid()

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
</style>
