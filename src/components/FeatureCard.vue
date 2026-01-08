<script setup lang="ts">
import { computed } from 'vue'
import type { Feature } from '@/types/feature'

/**
 * FeatureCard Component
 * Displays an interactive Feature card within an Area Map
 * Supports multiple visual states: unlocked/active, unlocked/inactive, locked with preview
 */

interface Props {
  /** Feature data to display */
  feature: Feature
}

interface Emits {
  /** Emitted when the card is clicked */
  (e: 'click', feature: Feature): void
  /** Emitted when the expand/collapse button is clicked */
  (e: 'toggleExpand', feature: Feature): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed styles based on feature state
const titleBarColor = computed(() => {
  if (props.feature.state === 'locked') return '#999999' // Gray for locked
  if (props.feature.isActive) return '#357abd' // Dark blue for active
  return '#4a90e2' // Medium blue for unlocked/inactive
})

const bodyBackground = computed(() => {
  if (props.feature.state === 'locked') return '#e0e0e0' // Light gray for locked
  if (props.feature.isActive) return '#f8fcff' // Light blue tint for active
  return '#ffffff' // White for unlocked/inactive
})

const borderColor = computed(() => {
  if (props.feature.state === 'locked') return '#999999' // Gray for locked
  if (props.feature.isActive) return '#357abd' // Dark blue for active
  return '#333333' // Dark gray for unlocked/inactive
})

const borderWidth = computed(() => {
  return props.feature.isActive ? '2px' : '1px'
})

const borderStyle = computed(() => {
  return props.feature.state === 'locked' ? 'dashed' : 'solid'
})

const cardOpacity = computed(() => {
  return props.feature.state === 'locked' ? 0.7 : 1.0
})

const cursorStyle = computed(() => {
  if (props.feature.state === 'locked') return 'help'
  return 'pointer'
})

// Handle click event
function handleClick() {
  emit('click', props.feature)
}

// Handle expand/collapse button click
function handleExpandToggle(event: MouseEvent) {
  event.stopPropagation() // Prevent triggering the card click
  emit('toggleExpand', props.feature)
}

// Computed property for expand/collapse button icon
const expandIcon = computed(() => {
  return props.feature.isExpanded ? '▼' : '▶'
})
</script>

<template>
  <div
    class="feature-card"
    :class="{
      'feature-card--active': feature.isActive,
      'feature-card--locked': feature.state === 'locked',
    }"
    :data-feature-id="feature.id"
    :style="{
      cursor: cursorStyle,
      opacity: cardOpacity,
      backgroundColor: bodyBackground,
      borderColor: borderColor,
      borderWidth: borderWidth,
      borderStyle: borderStyle,
    }"
    @click="handleClick"
  >
    <!-- Title Bar -->
    <div class="feature-card__title-bar" :style="{ backgroundColor: titleBarColor }">
      <span class="feature-card__icon">{{ feature.icon }}</span>
      <span class="feature-card__title">{{ feature.name }}</span>
      <button
        class="feature-card__expand-button"
        :aria-label="feature.isExpanded ? 'Collapse' : 'Expand'"
        @click="handleExpandToggle"
      >
        {{ expandIcon }}
      </button>
    </div>

    <!-- Card Body Content (conditionally rendered based on isExpanded) -->
    <div v-if="feature.isExpanded" class="feature-card__body">
      <!-- Locked state: show lock icon and requirements -->
      <div v-if="feature.state === 'locked'" class="feature-card__locked">
        <div class="lock-icon">🔒</div>
        <div class="requirements">
          <div class="requirements__title">Requires:</div>
          <ul class="requirements__list">
            <li v-for="prereq in feature.prerequisites" :key="prereq.id">
              {{ prereq.description }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Unlocked state: slot for feature-specific content -->
      <div v-else class="feature-card__content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature-card {
  width: 100%;
  border: 1px solid #333333;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  transition:
    opacity 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feature-card:hover:not(.feature-card--locked) {
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.feature-card--active {
  box-shadow: 0 6px 16px rgba(53, 122, 189, 0.4);
}

.feature-card--locked {
  cursor: help;
}

/* Title Bar */
.feature-card__title-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #4a90e2;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.feature-card__icon {
  font-size: 1.25rem;
  line-height: 1;
}

.feature-card__title {
  font-size: 1rem;
  line-height: 1;
  flex: 1;
}

.feature-card__expand-button {
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
}

.feature-card__expand-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.feature-card__expand-button:active {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Card Body */
.feature-card__body {
  padding: 1rem;
  min-height: 100px;
}

.feature-card__content {
  width: 100%;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.875rem;
  color: #333333;
}

/* Locked state styles */
.feature-card__locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  text-align: center;
  padding: 0.5rem;
}

.lock-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.requirements {
  font-size: 0.875rem;
  color: #666666;
}

.requirements__title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.requirements__list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  font-size: 0.875rem;
}

.requirements__list li {
  margin-bottom: 0.25rem;
  padding-left: 1rem;
  position: relative;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.requirements__list li::before {
  content: '•';
  position: absolute;
  left: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .feature-card__title-bar {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .feature-card__icon {
    font-size: 1rem;
  }

  .feature-card__expand-button {
    min-width: 20px;
    min-height: 20px;
    font-size: 0.875rem;
  }

  .feature-card__body {
    padding: 0.75rem;
  }
}
</style>
