<script setup lang="ts">
import { ref } from 'vue'

/**
 * FoundryScreen Component
 * Full-screen crafting interface for the Foundry feature
 * Currently displays placeholder UI for future grid-based crafting puzzle system
 */

interface Props {
  fullScreen?: boolean
}

defineProps<Props>()

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
</script>

<template>
  <div class="foundry-screen">
    <!-- Placeholder Notice -->
    <div class="placeholder-notice">
      <h2>Foundry Crafting System</h2>
      <p>This is a placeholder for the future grid-based crafting puzzle interface.</p>
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
          <h3 class="section-title">Crafting Grid</h3>
          <div class="crafting-grid-placeholder">
            <div class="grid-placeholder-content">
              <div class="grid-icon">🔨</div>
              <p class="grid-message">Grid-based crafting puzzle will be implemented here</p>
              <div class="grid-preview">
                <!-- Placeholder grid visualization -->
                <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                </div>
                <div class="grid-row">
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                  <div class="grid-cell"></div>
                </div>
              </div>
              <p class="grid-hint">Drag materials onto grid • Arrange to match patterns • Craft items</p>
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

/* Placeholder Notice */
.placeholder-notice {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.placeholder-notice h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.placeholder-notice p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.95;
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

.crafting-grid-placeholder {
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
  max-width: 500px;
}

.grid-icon {
  font-size: 4rem;
  line-height: 1;
  opacity: 0.5;
}

.grid-message {
  margin: 0;
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 500;
}

.grid-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.grid-row {
  display: flex;
  gap: 8px;
}

.grid-cell {
  width: 50px;
  height: 50px;
  background-color: white;
  border: 2px dashed #cbd5e1;
  border-radius: 6px;
  transition: all 0.2s;
}

.grid-cell:hover {
  border-color: #94a3b8;
  background-color: #f1f5f9;
}

.grid-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
  font-style: italic;
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

  .placeholder-notice {
    padding: 1.5rem;
  }

  .placeholder-notice h2 {
    font-size: 1.5rem;
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

  .grid-cell {
    width: 40px;
    height: 40px;
  }

  .crafting-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
