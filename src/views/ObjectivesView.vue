<script setup lang="ts">
import { computed } from 'vue'
import { useObjectivesStore } from '@/stores/objectives'
import { useNavigationStore } from '@/stores/navigation'
import { formatRelativeTime } from '@/utils/time'
import type { Objective } from '@/types/objectives'

/**
 * ObjectivesView Component
 * Full-screen view for browsing and managing objectives
 * Shows all discovered objectives grouped by status and category
 */

const emit = defineEmits<{
  back: []
}>()

const objectivesStore = useObjectivesStore()
const navigationStore = useNavigationStore()

// Get all visible objectives categorized
const activeMainObjectives = computed(() => {
  return objectivesStore.visibleObjectives
    .filter((obj) => obj.status === 'active' && obj.category === 'main')
    .sort((a, b) => a.order - b.order)
})

const activeSecondaryObjectives = computed(() => {
  return objectivesStore.visibleObjectives
    .filter((obj) => obj.status === 'active' && obj.category === 'secondary')
    .sort((a, b) => a.order - b.order)
})

const completedMainObjectives = computed(() => {
  return objectivesStore.visibleObjectives
    .filter((obj) => obj.status === 'completed' && obj.category === 'main')
    .sort((a, b) => a.order - b.order)
})

const completedSecondaryObjectives = computed(() => {
  return objectivesStore.visibleObjectives
    .filter((obj) => obj.status === 'completed' && obj.category === 'secondary')
    .sort((a, b) => a.order - b.order)
})

const trackedObjectiveId = computed(() => objectivesStore.trackedObjectiveId)

// Get progress display for an objective
function getProgressDisplay(objective: Objective): string | null {
  // Check if it has subtasks
  if (objective.subtasks && objective.subtasks.length > 0) {
    const completed = objective.subtasks.filter((st) => st.completed).length
    const total = objective.subtasks.length
    return `${completed}/${total} steps`
  }

  // Check if it has currentProgress/maxProgress
  if (objective.currentProgress !== undefined && objective.maxProgress !== undefined) {
    return `${objective.currentProgress}/${objective.maxProgress}`
  }

  return null
}

// Get progress percentage for progress bar
function getProgressPercentage(objective: Objective): number {
  // Check if it has subtasks
  if (objective.subtasks && objective.subtasks.length > 0) {
    const completed = objective.subtasks.filter((st) => st.completed).length
    const total = objective.subtasks.length
    return (completed / total) * 100
  }

  // Check if it has currentProgress/maxProgress
  if (
    objective.currentProgress !== undefined &&
    objective.maxProgress !== undefined &&
    objective.maxProgress > 0
  ) {
    return (objective.currentProgress / objective.maxProgress) * 100
  }

  return 0
}

// Get border color based on category
function getBorderColor(objective: Objective): string {
  return objective.category === 'main' ? '#FFD700' : '#2196F3'
}

// Handle objective card click
function handleObjectiveClick(objective: Objective) {
  if (objective.status === 'active') {
    objectivesStore.setTrackedObjective(objective.id)
  }
}

// Handle back button click
function handleBackClick() {
  navigationStore.navigateToPreviousView()
  emit('back')
}

// Format completion timestamp
function formatCompletedAt(date: Date | undefined): string {
  if (!date) return ''
  return formatRelativeTime(date)
}

// Check if objective is currently tracked
function isTracked(objective: Objective): boolean {
  return trackedObjectiveId.value === objective.id
}
</script>

<template>
  <div class="objectives-view-container">
    <!-- Header Bar -->
    <header class="objectives-view-header">
      <h1 class="objectives-view-header__title">Objectives</h1>
      <button
        class="objectives-view-header__close"
        aria-label="Close and return to previous view"
        @click="handleBackClick"
      >
        ✕
      </button>
    </header>

    <!-- Main Content - Scrollable -->
    <div class="objectives-view-content">
      <!-- Active Objectives Section -->
      <section v-if="activeMainObjectives.length > 0 || activeSecondaryObjectives.length > 0">
        <h2 class="section-title">Active Objectives</h2>

        <!-- Active Main Objectives -->
        <div v-if="activeMainObjectives.length > 0" class="objectives-subsection">
          <h3 class="subsection-title">Main Objectives</h3>
          <div class="objectives-list">
            <div
              v-for="objective in activeMainObjectives"
              :key="objective.id"
              class="objective-card"
              :class="{ tracked: isTracked(objective) }"
              :style="{ borderColor: getBorderColor(objective) }"
              @click="handleObjectiveClick(objective)"
            >
              <div class="objective-header">
                <h4 class="objective-title">{{ objective.title }}</h4>
                <span v-if="isTracked(objective)" class="tracked-badge">Tracked</span>
              </div>
              <p class="objective-description">{{ objective.description }}</p>

              <!-- Progress Display -->
              <div v-if="getProgressDisplay(objective)" class="objective-progress">
                <div class="progress-text">{{ getProgressDisplay(objective) }}</div>
                <div class="progress-bar">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${getProgressPercentage(objective)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Subtasks List -->
              <div v-if="objective.subtasks && objective.subtasks.length > 0" class="subtasks-list">
                <div
                  v-for="subtask in objective.subtasks"
                  :key="subtask.id"
                  class="subtask-item"
                  :class="{ completed: subtask.completed }"
                >
                  <span class="subtask-checkbox">{{ subtask.completed ? '✓' : '○' }}</span>
                  <span class="subtask-description">{{ subtask.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Secondary Objectives -->
        <div v-if="activeSecondaryObjectives.length > 0" class="objectives-subsection">
          <h3 class="subsection-title">Secondary Objectives</h3>
          <div class="objectives-list">
            <div
              v-for="objective in activeSecondaryObjectives"
              :key="objective.id"
              class="objective-card"
              :class="{ tracked: isTracked(objective) }"
              :style="{ borderColor: getBorderColor(objective) }"
              @click="handleObjectiveClick(objective)"
            >
              <div class="objective-header">
                <h4 class="objective-title">{{ objective.title }}</h4>
                <span v-if="isTracked(objective)" class="tracked-badge">Tracked</span>
              </div>
              <p class="objective-description">{{ objective.description }}</p>

              <!-- Progress Display -->
              <div v-if="getProgressDisplay(objective)" class="objective-progress">
                <div class="progress-text">{{ getProgressDisplay(objective) }}</div>
                <div class="progress-bar">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${getProgressPercentage(objective)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Subtasks List -->
              <div v-if="objective.subtasks && objective.subtasks.length > 0" class="subtasks-list">
                <div
                  v-for="subtask in objective.subtasks"
                  :key="subtask.id"
                  class="subtask-item"
                  :class="{ completed: subtask.completed }"
                >
                  <span class="subtask-checkbox">{{ subtask.completed ? '✓' : '○' }}</span>
                  <span class="subtask-description">{{ subtask.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Completed Objectives Section -->
      <section
        v-if="completedMainObjectives.length > 0 || completedSecondaryObjectives.length > 0"
        class="completed-section"
      >
        <h2 class="section-title">Completed Objectives</h2>

        <!-- Completed Main Objectives -->
        <div v-if="completedMainObjectives.length > 0" class="objectives-subsection">
          <h3 class="subsection-title">Main Objectives</h3>
          <div class="objectives-list">
            <div
              v-for="objective in completedMainObjectives"
              :key="objective.id"
              class="objective-card completed"
              :style="{ borderColor: getBorderColor(objective) }"
            >
              <div class="objective-header">
                <h4 class="objective-title">{{ objective.title }}</h4>
                <span class="completed-badge">✓ Completed</span>
              </div>
              <p class="objective-description">{{ objective.description }}</p>
              <div class="completed-timestamp">
                Completed {{ formatCompletedAt(objective.completedAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Secondary Objectives -->
        <div v-if="completedSecondaryObjectives.length > 0" class="objectives-subsection">
          <h3 class="subsection-title">Secondary Objectives</h3>
          <div class="objectives-list">
            <div
              v-for="objective in completedSecondaryObjectives"
              :key="objective.id"
              class="objective-card completed"
              :style="{ borderColor: getBorderColor(objective) }"
            >
              <div class="objective-header">
                <h4 class="objective-title">{{ objective.title }}</h4>
                <span class="completed-badge">✓ Completed</span>
              </div>
              <p class="objective-description">{{ objective.description }}</p>
              <div class="completed-timestamp">
                Completed {{ formatCompletedAt(objective.completedAt) }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Container */
.objectives-view-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
}

/* Header Bar */
.objectives-view-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: #2c3e50;
  padding: 0 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  flex-shrink: 0;
}

.objectives-view-header__title {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.objectives-view-header__close {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 1.75rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.objectives-view-header__close:hover {
  background-color: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.objectives-view-header__close:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

/* Main Content Area */
.objectives-view-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Section Styling */
section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #4caf50;
}

.completed-section .section-title {
  border-bottom-color: #888;
}

.objectives-subsection {
  margin-bottom: 2rem;
}

.subsection-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #555;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Objectives List */
.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Objective Card */
.objective-card {
  background: white;
  border: 3px solid;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.objective-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.objective-card.tracked {
  background: #e8f5e9;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.objective-card.completed {
  opacity: 0.75;
  cursor: default;
  background: #f9f9f9;
}

.objective-card.completed:hover {
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.objective-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.objective-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  flex: 1;
}

.tracked-badge {
  background: #4caf50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 1rem;
}

.completed-badge {
  background: #888;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 1rem;
}

.objective-description {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Progress Display */
.objective-progress {
  margin-top: 1rem;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4caf50;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #4caf50;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Subtasks List */
.subtasks-list {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.subtask-item.completed {
  color: #888;
  text-decoration: line-through;
}

.subtask-checkbox {
  font-size: 1.1rem;
  color: #4caf50;
}

.subtask-item.completed .subtask-checkbox {
  color: #888;
}

.subtask-description {
  flex: 1;
}

/* Completed Timestamp */
.completed-timestamp {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .objectives-view-content {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .subsection-title {
    font-size: 1.1rem;
  }

  .objective-card {
    padding: 1rem;
  }

  .objective-title {
    font-size: 1.1rem;
  }
}
</style>
