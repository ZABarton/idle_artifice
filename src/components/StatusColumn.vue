<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useObjectivesStore } from '@/stores/objectives'
import { useResourcesStore } from '@/stores/resources'
import { useNavigationStore } from '@/stores/navigation'

const objectivesStore = useObjectivesStore()
const resourcesStore = useResourcesStore()
const navigationStore = useNavigationStore()

const emit = defineEmits<{
  toggleDebugPanel: []
}>()

const isCollapsed = ref(false)
const isMobile = ref(false)

// Check if screen is mobile size
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
  // Auto-collapse on mobile
  if (isMobile.value && !isCollapsed.value) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

const trackedObjective = computed(() => objectivesStore.getTrackedObjective)

// Calculate progress display for tracked objective
const objectiveProgress = computed(() => {
  const objective = trackedObjective.value
  if (!objective) return null

  // Check if it has subtasks
  if (objective.subtasks && objective.subtasks.length > 0) {
    const completed = objective.subtasks.filter((st) => st.completed).length
    const total = objective.subtasks.length
    return `Step ${completed} of ${total}`
  }

  // Check if it has currentProgress/maxProgress
  if (objective.currentProgress !== undefined && objective.maxProgress !== undefined) {
    return `${objective.currentProgress}/${objective.maxProgress}`
  }

  return null
})

const resources = computed(() => resourcesStore.allResources)
const recentLocations = computed(() => navigationStore.recentLocations)
const currentView = computed(() => navigationStore.currentView)
const selectedHex = computed(() => navigationStore.selectedHex)

// Current location display
const currentLocationDisplay = computed(() => {
  if (currentView.value === 'area-map' && selectedHex.value) {
    const recent = recentLocations.value[0]
    return recent?.type || 'Unknown'
  }
  return null
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function handleObjectiveClick() {
  navigationStore.navigateToObjectivesView()
}

function handleWorldMapClick() {
  navigationStore.navigateToWorldMap()
}

function handleCurrentLocationClick() {
  if (selectedHex.value) {
    navigationStore.navigateToAreaMap(
      selectedHex.value.q,
      selectedHex.value.r,
      recentLocations.value[0]?.type || null
    )
  }
}

function handleRecentLocationClick(location: { q: number; r: number; type: string | null }) {
  navigationStore.navigateToAreaMap(location.q, location.r, location.type)
}

function handleDebugToggle() {
  emit('toggleDebugPanel')
}
</script>

<template>
  <!-- Mobile overlay backdrop -->
  <div
    v-if="isMobile && !isCollapsed"
    class="mobile-overlay"
    @click="toggleCollapse"
  ></div>

  <div class="status-column" :class="{ collapsed: isCollapsed, mobile: isMobile }">
    <!-- Collapsed view: icon-only -->
    <div v-if="isCollapsed" class="collapsed-view">
      <button class="expand-button" @click="toggleCollapse" title="Expand Status Column">
        ▶
      </button>
      <div class="collapsed-icons">
        <div class="icon" title="Current Objective">🎯</div>
        <div class="icon" title="Resources">📦</div>
        <div class="icon" title="Navigation">🗺️</div>
        <div class="icon" title="Settings">⚙️</div>
      </div>
    </div>

    <!-- Expanded view: full content -->
    <div v-else class="expanded-view">
      <div class="header">
        <h2>Status</h2>
        <button class="collapse-button" @click="toggleCollapse" title="Collapse">◀</button>
      </div>

      <!-- Current Objective Section -->
      <section class="objective-section">
        <h3>Current Objective</h3>
        <div v-if="trackedObjective" class="objective-card" @click="handleObjectiveClick">
          <div class="objective-title">{{ trackedObjective.title }}</div>
          <div class="objective-description">{{ trackedObjective.description }}</div>
          <div v-if="objectiveProgress" class="objective-progress">
            {{ objectiveProgress }}
          </div>
        </div>
        <div v-else class="no-objective" @click="handleObjectiveClick">
          <div class="no-objective-title">No Objectives Tracked</div>
          <div class="no-objective-hint">Click to view all objectives</div>
        </div>
      </section>

      <!-- Resources Section -->
      <section class="resources-section">
        <h3>Resources</h3>
        <div class="resources-list">
          <div v-for="resource in resources" :key="resource.id" class="resource-item">
            <span class="resource-icon">{{ resource.icon }}</span>
            <span class="resource-name">{{ resource.name }}:</span>
            <span class="resource-amount">{{ resource.amount }}</span>
          </div>
        </div>
      </section>

      <!-- Quick Navigation Section -->
      <section class="navigation-section">
        <h3>Quick Navigation</h3>
        <div class="nav-links">
          <button @click="handleWorldMapClick" class="nav-button">🗺️ World Map</button>
          <button
            v-if="currentLocationDisplay"
            @click="handleCurrentLocationClick"
            class="nav-button"
          >
            📍 {{ currentLocationDisplay }}
          </button>
          <div v-if="recentLocations.length > 1" class="recent-locations">
            <div class="recent-header">Recent:</div>
            <button
              v-for="location in recentLocations.slice(1)"
              :key="`${location.q},${location.r}`"
              @click="handleRecentLocationClick(location)"
              class="nav-button recent"
            >
              {{ location.type || 'Unknown' }}
            </button>
          </div>
        </div>
      </section>

      <!-- System Links Section -->
      <section class="system-section">
        <h3>System</h3>
        <div class="system-links">
          <button class="system-button" disabled title="Coming soon">⚙️ Settings</button>
          <button class="system-button" disabled title="Coming soon">💾 Save Game</button>
          <button class="system-button" @click="handleDebugToggle">🐛 Debug Panel</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Mobile overlay backdrop */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.status-column {
  background-color: #f5f5f5;
  border-right: 2px solid #ccc;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100vh;
}

.status-column.collapsed {
  width: 50px;
}

/* Desktop: 250px */
.status-column:not(.collapsed) {
  width: 250px;
}

/* Mobile drawer pattern */
.status-column.mobile {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.status-column.mobile.collapsed {
  transform: translateX(0);
}

.status-column.mobile:not(.collapsed) {
  transform: translateX(0);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Collapsed View */
.collapsed-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  height: 100%;
}

.expand-button {
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 1rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-button:hover {
  background: #45a049;
}

.expand-button:active {
  transform: scale(0.95);
}

.collapsed-icons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.collapsed-icons .icon {
  font-size: 1.5rem;
  cursor: default;
  opacity: 0.7;
}

/* Expanded View */
.expanded-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ddd;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.collapse-button {
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-button:hover {
  background: #45a049;
}

.collapse-button:active {
  transform: scale(0.95);
}

section {
  margin-bottom: 1.5rem;
}

section h3 {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: #555;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.5px;
}

/* Current Objective Section */
.objective-section {
  flex-shrink: 0;
}

.objective-card {
  background: #fff;
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.objective-card:hover {
  background: #f0f8f0;
  border-color: #45a049;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.objective-title {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.objective-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.objective-progress {
  font-size: 0.85rem;
  color: #4caf50;
  font-weight: bold;
  margin-top: 0.5rem;
}

.no-objective {
  background: #f9f9f9;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.no-objective:hover {
  background: #f0f8f0;
  border-color: #4caf50;
}

.no-objective-title {
  font-size: 0.95rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.no-objective-hint {
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
}

/* Resources Section */
.resources-section {
  flex-shrink: 0;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.resource-icon {
  font-size: 1.2rem;
}

.resource-name {
  flex: 1;
  color: #555;
}

.resource-amount {
  font-weight: bold;
  color: #333;
}

/* Navigation Section */
.navigation-section {
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-button {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.6rem;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.nav-button:hover {
  background: #e8f5e9;
  border-color: #4caf50;
}

.recent-locations {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.recent-header {
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.25rem;
  padding-left: 0.5rem;
}

.nav-button.recent {
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
  margin-left: 0.5rem;
}

/* System Section */
.system-section {
  margin-top: auto;
  flex-shrink: 0;
}

.system-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.system-button {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.6rem;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.system-button:not(:disabled):hover {
  background: #e3f2fd;
  border-color: #2196f3;
}

.system-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Breakpoints */

/* Tablet: 200px at 1024px breakpoint */
@media (max-width: 1024px) {
  .status-column:not(.collapsed):not(.mobile) {
    width: 200px;
  }
}

/* Mobile: Drawer pattern at 768px breakpoint */
@media (max-width: 768px) {
  /* Buttons are already touch-friendly (44px min) */

  /* Ensure nav and system buttons are touch-friendly */
  .nav-button,
  .system-button {
    min-height: 44px;
    padding: 0.75rem;
  }

  /* Slightly larger tap targets for objective cards */
  .objective-card,
  .no-objective {
    min-height: 80px;
    padding: 1.25rem;
  }
}
</style>
