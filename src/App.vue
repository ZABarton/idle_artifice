<script setup lang="ts">
import { useWorldMapStore } from './stores/worldMap'
import { useHexGrid } from './composables/useHexGrid'

const worldMapStore = useWorldMapStore()
const hexGrid = useHexGrid()
</script>

<template>
  <div id="app">
    <h1>Idle Artifice - Setup Verification</h1>

    <div class="verification-section">
      <h2>Pinia Store Status</h2>
      <p>Total hexagons: {{ worldMapStore.hexTiles.length }}</p>
      <p>Explored tiles: {{ worldMapStore.exploredTiles.length }}</p>
      <p>Unexplored tiles: {{ worldMapStore.unexploredTiles.length }}</p>
      <p>Academy location: ({{ worldMapStore.academyTile?.q }}, {{ worldMapStore.academyTile?.r }})</p>
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
      <button @click="worldMapStore.exploreTile(worldMapStore.unexploredTiles[0]?.q, worldMapStore.unexploredTiles[0]?.r)">
        Explore First Tile
      </button>
      <button @click="worldMapStore.resetMap()">
        Reset Map
      </button>
    </div>
  </div>
</template>

<style scoped>
#app {
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

th, td {
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
</style>
