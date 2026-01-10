<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

/**
 * WharfFeature Component
 * Navigation feature for the Harbor's wharf area
 * Expanded view shows ship status, cargo, and recent voyages
 */

interface Emits {
  /** Emitted when user wants to open the Wharf screen */
  (e: 'navigate'): void
}

const emit = defineEmits<Emits>()

// Mock ship data - will come from game store in future
const mockShips = ref([
  {
    id: 'ship1',
    name: 'Sea Sprite',
    status: 'docked',
    cargo: 45,
    maxCargo: 100,
    icon: '⛵',
    condition: 95,
  },
  {
    id: 'ship2',
    name: 'Storm Chaser',
    status: 'at-sea',
    cargo: 0,
    maxCargo: 150,
    icon: '🚢',
    condition: 82,
    returnTime: '2 hours',
  },
  {
    id: 'ship3',
    name: 'Wind Dancer',
    status: 'maintenance',
    cargo: 78,
    maxCargo: 120,
    icon: '⛵',
    condition: 45,
  },
])

// Mock dock stats - will come from game data
const mockStats = ref({
  totalShips: 3,
  docked: 1,
  atSea: 1,
  maintenance: 1,
})

// Mock recent voyages - will come from player data
const mockRecentVoyages = ref([
  { ship: 'Sea Sprite', destination: 'Coral Reef', cargo: '32 items', outcome: 'Success' },
  { ship: 'Storm Chaser', destination: 'Mystic Isles', cargo: '48 items', outcome: 'Success' },
])

const handleOpenWharf = () => {
  emit('navigate')
}

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('wharf')
})
</script>

<template>
  <div class="wharf-feature">
    <!-- Feature Description -->
    <div class="feature-header">
      <p class="description">Manage ship departures, arrivals, and cargo operations.</p>
    </div>

    <!-- Dock Stats -->
    <div class="section">
      <h4 class="section-title">Dock Status</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ mockStats.totalShips }}</div>
          <div class="stat-label">Total Ships</div>
        </div>
        <div class="stat-card docked">
          <div class="stat-value">{{ mockStats.docked }}</div>
          <div class="stat-label">Docked</div>
        </div>
        <div class="stat-card at-sea">
          <div class="stat-value">{{ mockStats.atSea }}</div>
          <div class="stat-label">At Sea</div>
        </div>
        <div class="stat-card maintenance">
          <div class="stat-value">{{ mockStats.maintenance }}</div>
          <div class="stat-label">Maintenance</div>
        </div>
      </div>
    </div>

    <!-- Ships List -->
    <div class="section">
      <h4 class="section-title">Fleet Status</h4>
      <div class="ships-list">
        <div
          v-for="ship in mockShips"
          :key="ship.id"
          class="ship-item"
          :class="`status-${ship.status}`"
        >
          <span class="ship-icon">{{ ship.icon }}</span>
          <div class="ship-details">
            <div class="ship-name">{{ ship.name }}</div>
            <div class="ship-info">
              <div class="ship-cargo">
                <span class="info-label">Cargo:</span>
                <span class="info-value">{{ ship.cargo }}/{{ ship.maxCargo }}</span>
              </div>
              <div class="ship-condition">
                <span class="info-label">Condition:</span>
                <span class="info-value" :class="{ warning: ship.condition < 50 }"
                  >{{ ship.condition }}%</span
                >
              </div>
            </div>
            <div v-if="ship.returnTime" class="ship-return">Returns in {{ ship.returnTime }}</div>
          </div>
          <div class="ship-status">
            <span
              v-if="ship.status === 'docked'"
              class="status-badge docked"
              title="Docked and ready"
              >●</span
            >
            <span v-else-if="ship.status === 'at-sea'" class="status-badge at-sea" title="At sea"
              >●</span
            >
            <span
              v-else-if="ship.status === 'maintenance'"
              class="status-badge maintenance"
              title="Under maintenance"
              >●</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Voyages -->
    <div v-if="mockRecentVoyages.length > 0" class="section">
      <h4 class="section-title">Recent Voyages</h4>
      <div class="voyages-list">
        <div v-for="(voyage, index) in mockRecentVoyages" :key="index" class="voyage-item">
          <span class="voyage-icon">⚓</span>
          <div class="voyage-details">
            <div class="voyage-ship">{{ voyage.ship }}</div>
            <div class="voyage-destination">{{ voyage.destination }}</div>
            <div class="voyage-cargo">{{ voyage.cargo }}</div>
          </div>
          <div class="voyage-outcome" :class="voyage.outcome.toLowerCase()">
            {{ voyage.outcome }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <button class="open-button" @click="handleOpenWharf">Open Wharf</button>
  </div>
</template>

<style scoped>
.wharf-feature {
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: center;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-card.docked {
  border-color: #86efac;
  background-color: #f0fdf4;
}

.stat-card.at-sea {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.stat-card.maintenance {
  border-color: #fca5a5;
  background-color: #fef2f2;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Ships List */
.ships-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ship-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.ship-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ship-item.status-docked {
  border-left: 3px solid #22c55e;
}

.ship-item.status-at-sea {
  border-left: 3px solid #3b82f6;
}

.ship-item.status-maintenance {
  border-left: 3px solid #ef4444;
}

.ship-icon {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.ship-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.ship-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.ship-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.ship-cargo,
.ship-condition {
  display: flex;
  gap: 0.25rem;
}

.info-label {
  color: #64748b;
}

.info-value {
  font-weight: 600;
  color: #334155;
}

.info-value.warning {
  color: #dc2626;
}

.ship-return {
  font-size: 0.75rem;
  color: #3b82f6;
  font-style: italic;
}

.ship-status {
  flex-shrink: 0;
}

.status-badge {
  font-size: 1.25rem;
  line-height: 1;
}

.status-badge.docked {
  color: #22c55e;
}

.status-badge.at-sea {
  color: #3b82f6;
}

.status-badge.maintenance {
  color: #ef4444;
}

/* Voyages List */
.voyages-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.voyage-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: #f8fafc;
  border-radius: 6px;
  font-size: 0.8rem;
}

.voyage-icon {
  color: #0284c7;
  font-size: 1rem;
  flex-shrink: 0;
}

.voyage-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.voyage-ship {
  font-weight: 600;
  color: #334155;
  font-size: 0.875rem;
}

.voyage-destination,
.voyage-cargo {
  color: #64748b;
  font-size: 0.75rem;
}

.voyage-outcome {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.voyage-outcome.success {
  background-color: #dcfce7;
  color: #166534;
}

.voyage-outcome.failure {
  background-color: #fee2e2;
  color: #991b1b;
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
  .wharf-feature {
    gap: 0.75rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .ship-item {
    padding: 0.5rem;
  }

  .ship-icon {
    font-size: 1.5rem;
  }

  .open-button {
    padding: 0.625rem 0.875rem;
  }
}
</style>
