<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

/**
 * TavernFeature Component
 * Complex feature with navigation to dedicated Tavern screen
 * Expanded view shows explorer roster, availability, and recent expeditions
 */

interface Emits {
  /** Emitted when user wants to open the Tavern screen */
  (e: 'navigate'): void
}

const emit = defineEmits<Emits>()

// Mock explorer data - will come from game store in future
const mockExplorers = ref([
  {
    id: 'explorer1',
    name: 'Aria Stormwind',
    status: 'available',
    level: 5,
    icon: '🗡️',
    specialty: 'Combat',
  },
  {
    id: 'explorer2',
    name: 'Marcus Ironforge',
    status: 'on-expedition',
    level: 4,
    icon: '🛡️',
    specialty: 'Defense',
  },
  {
    id: 'explorer3',
    name: 'Luna Whisperwind',
    status: 'available',
    level: 3,
    icon: '🏹',
    specialty: 'Archery',
  },
  {
    id: 'explorer4',
    name: 'Theron Brightflame',
    status: 'resting',
    level: 6,
    icon: '🔥',
    specialty: 'Magic',
  },
])

// Mock stats - will come from game data
const mockStats = ref({
  totalExplorers: 4,
  available: 2,
  onExpedition: 1,
  resting: 1,
})

// Mock recent expeditions - will come from player data
const mockRecentExpeditions = ref([
  { explorer: 'Aria Stormwind', location: 'Dark Forest', outcome: 'Success' },
  { explorer: 'Theron Brightflame', location: 'Crystal Caves', outcome: 'Success' },
])

const handleOpenTavern = () => {
  // Intro dialog is handled by area map trigger system (see academy.ts)
  // Just emit navigation event
  emit('navigate')
}

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('tavern')
})
</script>

<template>
  <div class="tavern-feature">
    <!-- Feature Description -->
    <div class="feature-header">
      <p class="description">Manage your camp's explorers and organize expeditions.</p>
    </div>

    <!-- Explorer Stats -->
    <div class="section">
      <h4 class="section-title">Explorer Status</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ mockStats.totalExplorers }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card available">
          <div class="stat-value">{{ mockStats.available }}</div>
          <div class="stat-label">Available</div>
        </div>
        <div class="stat-card expedition">
          <div class="stat-value">{{ mockStats.onExpedition }}</div>
          <div class="stat-label">On Expedition</div>
        </div>
        <div class="stat-card resting">
          <div class="stat-value">{{ mockStats.resting }}</div>
          <div class="stat-label">Resting</div>
        </div>
      </div>
    </div>

    <!-- Explorer Roster -->
    <div class="section">
      <h4 class="section-title">Explorer Roster</h4>
      <div class="explorers-list">
        <div
          v-for="explorer in mockExplorers"
          :key="explorer.id"
          class="explorer-item"
          :class="`status-${explorer.status}`"
        >
          <span class="explorer-icon">{{ explorer.icon }}</span>
          <div class="explorer-details">
            <div class="explorer-name">{{ explorer.name }}</div>
            <div class="explorer-info">
              <span class="explorer-level">Lvl {{ explorer.level }}</span>
              <span class="explorer-specialty">{{ explorer.specialty }}</span>
            </div>
          </div>
          <div class="explorer-status">
            <span
              v-if="explorer.status === 'available'"
              class="status-badge available"
              title="Available for expedition"
              >●</span
            >
            <span
              v-else-if="explorer.status === 'on-expedition'"
              class="status-badge expedition"
              title="On expedition"
              >●</span
            >
            <span v-else-if="explorer.status === 'resting'" class="status-badge resting" title="Resting"
              >●</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Expeditions -->
    <div v-if="mockRecentExpeditions.length > 0" class="section">
      <h4 class="section-title">Recent Expeditions</h4>
      <div class="expeditions-list">
        <div v-for="(expedition, index) in mockRecentExpeditions" :key="index" class="expedition-item">
          <span class="expedition-icon">✓</span>
          <div class="expedition-details">
            <div class="expedition-explorer">{{ expedition.explorer }}</div>
            <div class="expedition-location">{{ expedition.location }}</div>
          </div>
          <div class="expedition-outcome" :class="expedition.outcome.toLowerCase()">
            {{ expedition.outcome }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <button class="open-button" @click="handleOpenTavern">Enter Tavern</button>
  </div>
</template>

<style scoped>
.tavern-feature {
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

.stat-card.available {
  border-color: #86efac;
  background-color: #f0fdf4;
}

.stat-card.expedition {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.stat-card.resting {
  border-color: #fcd34d;
  background-color: #fefce8;
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

/* Explorers List */
.explorers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.explorer-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.explorer-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.explorer-item.status-available {
  border-left: 3px solid #22c55e;
}

.explorer-item.status-on-expedition {
  border-left: 3px solid #3b82f6;
}

.explorer-item.status-resting {
  border-left: 3px solid #eab308;
}

.explorer-icon {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.explorer-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.explorer-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.explorer-info {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.explorer-level {
  font-weight: 600;
}

.explorer-specialty {
  font-style: italic;
}

.explorer-status {
  flex-shrink: 0;
}

.status-badge {
  font-size: 1.25rem;
  line-height: 1;
}

.status-badge.available {
  color: #22c55e;
}

.status-badge.expedition {
  color: #3b82f6;
}

.status-badge.resting {
  color: #eab308;
}

/* Expeditions List */
.expeditions-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.expedition-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: #f8fafc;
  border-radius: 6px;
  font-size: 0.8rem;
}

.expedition-icon {
  color: #10b981;
  font-size: 1rem;
  flex-shrink: 0;
}

.expedition-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.expedition-explorer {
  font-weight: 600;
  color: #334155;
  font-size: 0.875rem;
}

.expedition-location {
  color: #64748b;
  font-size: 0.75rem;
}

.expedition-outcome {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.expedition-outcome.success {
  background-color: #dcfce7;
  color: #166534;
}

.expedition-outcome.failure {
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
  .tavern-feature {
    gap: 0.75rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .explorer-item {
    padding: 0.5rem;
  }

  .explorer-icon {
    font-size: 1.5rem;
  }

  .open-button {
    padding: 0.625rem 0.875rem;
  }
}
</style>
