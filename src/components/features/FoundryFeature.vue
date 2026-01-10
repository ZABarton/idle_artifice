<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

/**
 * FoundryFeature Component
 * Complex feature with navigation to dedicated Foundry screen
 * Expanded view shows crafting preview, available materials, and recent activity
 */

interface Emits {
  /** Emitted when user wants to open the Foundry screen */
  (e: 'navigate'): void
}

const emit = defineEmits<Emits>()

// Mock resource data - will come from resource store in future
const mockResources = ref([
  { id: 'wood', name: 'Wood', amount: 25, icon: '🪵' },
  { id: 'stone', name: 'Stone', amount: 12, icon: '🪨' },
  { id: 'iron', name: 'Iron Ore', amount: 8, icon: '⛏️' },
  { id: 'crystal', name: 'Crystal Shards', amount: 3, icon: '💎' },
])

// Mock crafting recipes - will come from game data
const mockRecipes = ref([
  { id: 'sword', name: 'Iron Sword', unlocked: true, icon: '⚔️' },
  { id: 'shield', name: 'Wooden Shield', unlocked: true, icon: '🛡️' },
  { id: 'staff', name: 'Crystal Staff', unlocked: false, icon: '🪄' },
])

// Mock recent crafts - will come from player data
const mockRecentCrafts = ref([
  { item: 'Iron Sword', time: '2 hours ago' },
  { item: 'Wooden Shield', time: '5 hours ago' },
])

const handleOpenFoundry = () => {
  // Intro dialog is handled by area map trigger system (see academy.ts)
  // Just emit navigation event
  emit('navigate')
}

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('foundry')
})
</script>

<template>
  <div class="foundry-feature">
    <!-- Feature Description -->
    <div class="feature-header">
      <p class="description">Craft magical items by solving grid-based puzzles.</p>
    </div>

    <!-- Materials Section -->
    <div class="section">
      <h4 class="section-title">Available Materials</h4>
      <div class="materials-grid">
        <div v-for="resource in mockResources" :key="resource.id" class="material-item">
          <span class="material-icon">{{ resource.icon }}</span>
          <div class="material-details">
            <div class="material-name">{{ resource.name }}</div>
            <div class="material-amount">{{ resource.amount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Recipes Section -->
    <div class="section">
      <h4 class="section-title">Available Recipes</h4>
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
    </div>

    <!-- Recent Activity Section -->
    <div v-if="mockRecentCrafts.length > 0" class="section">
      <h4 class="section-title">Recent Crafts</h4>
      <div class="recent-crafts">
        <div v-for="(craft, index) in mockRecentCrafts" :key="index" class="craft-item">
          <span class="craft-icon">✓</span>
          <span class="craft-name">{{ craft.item }}</span>
          <span class="craft-time">{{ craft.time }}</span>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <button class="open-button" @click="handleOpenFoundry">Enter Foundry</button>
  </div>
</template>

<style scoped>
.foundry-feature {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  box-sizing: border-box;
  width: 100%;
}

/* Header */
.feature-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.description {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
}

/* Sections */
.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Materials Grid */
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.material-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.material-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.material-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.material-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #334155;
}

.material-amount {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

/* Recipes List */
.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.recipe-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.recipe-item:not(.locked):hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.recipe-item.locked {
  opacity: 0.6;
  background-color: #f8fafc;
}

.recipe-icon {
  font-size: 1.25rem;
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
  font-size: 0.875rem;
  opacity: 0.5;
}

/* Recent Crafts */
.recent-crafts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.craft-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
}

.craft-icon {
  color: #10b981;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.craft-name {
  flex: 1;
  color: #334155;
  font-weight: 500;
}

.craft-time {
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
}

/* Action Button */
.open-button {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.open-button:hover {
  background-color: #357abd;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);
}

.open-button:active {
  background-color: #2b5a8a;
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .foundry-feature {
    gap: 0.75rem;
  }

  .materials-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.375rem;
  }

  .material-item {
    padding: 0.375rem;
  }

  .material-icon {
    font-size: 1.25rem;
  }

  .recipe-item {
    padding: 0.375rem 0.5rem;
  }

  .open-button {
    padding: 0.625rem 0.875rem;
  }
}
</style>
