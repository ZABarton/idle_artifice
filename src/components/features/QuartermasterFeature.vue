<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

/**
 * QuartermasterFeature Component
 * Simple inline feature displayed directly in the Area Map
 * Shows inventory management, supply tracking, and quartermaster interaction
 */

// Mock inventory data
const inventory = ref([
  { id: 'rations', name: 'Rations', amount: 45, max: 100, icon: '🍖' },
  { id: 'water', name: 'Water', amount: 78, max: 100, icon: '💧' },
  { id: 'bandages', name: 'Bandages', amount: 12, max: 50, icon: '🩹' },
  { id: 'rope', name: 'Rope', amount: 8, max: 20, icon: '🪢' },
  { id: 'torches', name: 'Torches', amount: 23, max: 50, icon: '🔦' },
])

// Mock supply statistics
const supplyStats = ref({
  totalWeight: 166,
  maxWeight: 320,
  storageUsed: 52,
})

const handleTalkToQuartermaster = () => {
  // Intro dialog is handled by area map trigger system (see academy.ts)
  // Future: This will open quartermaster management UI
}

const handleRequestSupplies = () => {
  // Mock action - future implementation
  console.log('Requesting supplies...')
}

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('quartermaster')
})
</script>

<template>
  <div class="quartermaster-feature">
    <div class="feature-header">
      <h3 class="feature-title">Supply Management</h3>
      <p class="feature-description">Manage your expedition's inventory and supplies</p>
    </div>

    <div class="stats-panel">
      <div class="stat-card">
        <div class="stat-label">Storage Used</div>
        <div class="stat-value">{{ supplyStats.storageUsed }}%</div>
        <div class="stat-bar">
          <div class="stat-bar-fill" :style="{ width: `${supplyStats.storageUsed}%` }"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Weight</div>
        <div class="stat-value">{{ supplyStats.totalWeight }}/{{ supplyStats.maxWeight }} kg</div>
        <div class="stat-bar">
          <div
            class="stat-bar-fill"
            :style="{ width: `${(supplyStats.totalWeight / supplyStats.maxWeight) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="inventory-section">
      <h4 class="section-title">Current Inventory</h4>
      <div class="inventory-grid">
        <div v-for="item in inventory" :key="item.id" class="inventory-item">
          <span class="item-icon">{{ item.icon }}</span>
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-amount">{{ item.amount }}/{{ item.max }}</div>
            <div class="item-bar">
              <div
                class="item-bar-fill"
                :style="{ width: `${(item.amount / item.max) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="action-button primary" @click="handleRequestSupplies">
        Request Supplies
      </button>
      <button class="action-button secondary" @click="handleTalkToQuartermaster">
        Talk to Quartermaster
      </button>
    </div>
  </div>
</template>

<style scoped>
.quartermaster-feature {
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

.feature-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feature-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.feature-description {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

/* Stats panel */
.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.stat-card {
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.stat-bar {
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.3s ease;
}

/* Inventory section */
.inventory-section {
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

.inventory-grid {
  display: grid;
  gap: 0.5rem;
}

.inventory-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.inventory-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-icon {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.item-amount {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.item-bar {
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.item-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.3s ease;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 120px;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.primary {
  background-color: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.action-button.primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.action-button.secondary {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.action-button.secondary:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
}

.action-button.secondary:active {
  background-color: #cbd5e1;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-panel {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
