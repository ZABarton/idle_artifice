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
  return props.feature.isActive ? 2 : 1
})

const borderStyle = computed(() => {
  return props.feature.state === 'locked' ? '4,2' : '0' // Dashed for locked, solid otherwise
})

const cardOpacity = computed(() => {
  return props.feature.state === 'locked' ? 0.7 : 1.0
})

const cursorStyle = computed(() => {
  if (props.feature.state === 'locked') return 'help'
  return 'pointer'
})

// Card dimensions (from design specs)
const CARD_WIDTH = 120
const CARD_HEIGHT = 100 // Variable based on content, using 100 as base
const TITLE_BAR_HEIGHT = 16
const CARD_PADDING = 4

// Handle click event
function handleClick() {
  emit('click', props.feature)
}
</script>

<template>
  <g
    class="feature-card"
    :class="{ 'feature-card--active': feature.isActive, 'feature-card--locked': feature.state === 'locked' }"
    :data-feature-id="feature.id"
    :transform="`translate(${feature.position.x}, ${feature.position.y})`"
    :style="{ cursor: cursorStyle, opacity: cardOpacity }"
    @click="handleClick"
  >
    <!-- Card Background -->
    <rect
      x="0"
      y="0"
      :width="CARD_WIDTH"
      :height="CARD_HEIGHT"
      :fill="bodyBackground"
      :stroke="borderColor"
      :stroke-width="borderWidth"
      :stroke-dasharray="borderStyle"
      rx="2"
      ry="2"
      class="feature-card__background"
    />

    <!-- Title Bar -->
    <rect
      x="0"
      y="0"
      :width="CARD_WIDTH"
      :height="TITLE_BAR_HEIGHT"
      :fill="titleBarColor"
      rx="2"
      ry="2"
      class="feature-card__title-bar"
    />

    <!-- Icon (using text element for emoji placeholder) -->
    <text
      :x="CARD_PADDING + 6"
      :y="TITLE_BAR_HEIGHT / 2 + 1"
      font-size="10"
      text-anchor="middle"
      dominant-baseline="middle"
      class="feature-card__icon"
    >
      {{ feature.icon }}
    </text>

    <!-- Title Text -->
    <text
      :x="CARD_PADDING + 14"
      :y="TITLE_BAR_HEIGHT / 2"
      font-size="5"
      fill="#ffffff"
      font-weight="600"
      dominant-baseline="middle"
      class="feature-card__title"
    >
      {{ feature.name }}
    </text>

    <!-- Card Body Content -->
    <foreignObject
      :x="CARD_PADDING"
      :y="TITLE_BAR_HEIGHT + CARD_PADDING"
      :width="CARD_WIDTH - CARD_PADDING * 2"
      :height="CARD_HEIGHT - TITLE_BAR_HEIGHT - CARD_PADDING * 2"
      class="feature-card__body"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" class="feature-card__content">
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
        <slot v-else></slot>
      </div>
    </foreignObject>
  </g>
</template>

<style scoped>
.feature-card {
  transition:
    opacity 0.2s ease,
    filter 0.2s ease;
}

.feature-card:hover:not(.feature-card--locked) {
  opacity: 0.85;
  filter: drop-shadow(0 2px 6px rgba(74, 144, 226, 0.3));
}

.feature-card--active {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.feature-card__background {
  transition: all 0.2s ease;
}

.feature-card__title-bar {
  transition: fill 0.2s ease;
}

/* Styles for the foreignObject content */
.feature-card__content {
  width: 100%;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 3.5px;
  color: #333333;
  overflow: hidden;
  box-sizing: border-box;
}

/* Locked state styles */
.feature-card__locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2px;
}

.lock-icon {
  font-size: 7px;
  margin-bottom: 2px;
}

.requirements {
  font-size: 1em;
  color: #666666;
}

.requirements__title {
  font-weight: 600;
  margin-bottom: 1px;
}

.requirements__list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  font-size: 0.9em;
}

.requirements__list li {
  margin-bottom: 0.5px;
  padding-left: 3px;
  position: relative;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.requirements__list li::before {
  content: '•';
  position: absolute;
  left: 0;
}
</style>
