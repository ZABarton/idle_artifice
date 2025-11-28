<script setup lang="ts">
import { useWorldMapStore } from '@/stores/worldMap'
import { useHexGrid } from '@/composables/useHexGrid'

const worldMapStore = useWorldMapStore()
const hexGrid = useHexGrid()
</script>

<template>
  <div class="pinia-debug">
    <h2>Pinia Debug</h2>

    <div class="debug-section">
      <h3>Store Status</h3>
      <p>Total hexagons: {{ worldMapStore.hexTiles.length }}</p>
      <p>Explored tiles: {{ worldMapStore.exploredTiles.length }}</p>
      <p>Unexplored tiles: {{ worldMapStore.unexploredTiles.length }}</p>
      <p>
        Academy location: ({{ worldMapStore.academyTile?.q }}, {{ worldMapStore.academyTile?.r }})
      </p>
    </div>

    <div class="debug-section">
      <h3>Hex Grid Data</h3>
      <div class="table-wrapper">
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
    </div>

    <div class="debug-section">
      <h3>Test Actions</h3>
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
    </div>
  </div>
</template>

<style scoped>
.pinia-debug {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  background-color: #fff;
  border-left: 2px solid #ccc;
}

h2 {
  margin-top: 0;
  font-size: 1.5rem;
  color: #333;
}

h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #555;
}

.debug-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
}

.debug-section p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

th,
td {
  padding: 0.4rem;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: #f0f0f0;
  font-weight: bold;
  position: sticky;
  top: 0;
}

button {
  margin: 0.25rem 0.5rem 0.25rem 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
}

button:hover {
  background-color: #45a049;
}

button:active {
  background-color: #3d8b40;
}
</style>
