<script setup lang="ts">
import { ref } from 'vue'

/**
 * ShopFeature Component
 * Simple inline feature with controls displayed directly in the Area Map
 * Demonstrates inline interaction without navigation
 */

// Profit margin state (0-100%)
const profitMargin = ref(65)

// Mock revenue calculation
const calculateRevenue = (margin: number) => {
  // Simple mock calculation - will be replaced with real game logic
  return Math.floor(100 + margin * 2)
}
</script>

<template>
  <div class="shop-feature">
    <p class="description">Trade resources and set profit margins.</p>

    <div class="control-section">
      <label for="profit-slider" class="control-label">Profit Margin:</label>
      <input
        id="profit-slider"
        v-model.number="profitMargin"
        type="range"
        min="0"
        max="100"
        step="5"
        class="profit-slider"
      />
      <div class="margin-value">Current: {{ profitMargin }}%</div>
    </div>

    <div class="revenue-display">Revenue today: {{ calculateRevenue(profitMargin) }} gold</div>
  </div>
</template>

<style scoped>
.shop-feature {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 3px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.description {
  margin: 0;
  font-size: 1em;
  color: #666;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.control-section {
  margin: 1px 0;
}

.control-label {
  display: block;
  font-size: 0.9em;
  font-weight: 600;
  color: #333;
  margin-bottom: 1px;
}

.profit-slider {
  width: 100%;
  height: 1.5px;
  margin: 1px 0;
  appearance: none;
  background: #ddd;
  border-radius: 0.5px;
  outline: none;
  cursor: pointer;
}

.profit-slider::-webkit-slider-thumb {
  appearance: none;
  width: 3px;
  height: 3px;
  background: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.profit-slider::-webkit-slider-thumb:hover {
  background: #357abd;
}

.profit-slider::-moz-range-thumb {
  width: 3px;
  height: 3px;
  background: #4a90e2;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.profit-slider::-moz-range-thumb:hover {
  background: #357abd;
}

.margin-value {
  font-size: 0.9em;
  color: #666;
  margin-top: 0.5px;
}

.revenue-display {
  margin-top: 1px;
  padding: 1.5px;
  background-color: #e8f4f8;
  border-radius: 1px;
  font-size: 1em;
  font-weight: 600;
  color: #333;
  text-align: center;
}
</style>
