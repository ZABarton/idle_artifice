<script setup lang="ts">
/**
 * RequirementList Component
 * Displays unlock/completion requirements with status indicators.
 * Shows checkmarks for completed requirements and crosses or locks for incomplete ones.
 * Purely presentational - parent components handle state management.
 */

export interface Requirement {
  /** Unique identifier for this requirement */
  id: string
  /** Description of the requirement */
  description: string
  /** Whether this requirement is met/completed */
  completed: boolean
  /** Optional progress indicator (e.g., "2/5 items collected") */
  progress?: string
}

interface Props {
  /** Array of requirements to display */
  requirements: Requirement[]
  /** Optional title for the requirements section */
  title?: string
  /** Show progress indicators when available */
  showProgress?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Requirements:',
  showProgress: true,
})
</script>

<template>
  <div class="requirement-list">
    <div v-if="title" class="requirements-title">{{ title }}</div>
    <ul class="requirements-items">
      <li
        v-for="req in requirements"
        :key="req.id"
        class="requirement-item"
        :class="{ completed: req.completed }"
      >
        <span class="requirement-icon">
          {{ req.completed ? '✓' : '✗' }}
        </span>
        <span class="requirement-description">{{ req.description }}</span>
        <span v-if="showProgress && req.progress" class="requirement-progress">{{
          req.progress
        }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.requirement-list {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 6px;
  color: #666;
  width: 100%;
}

.requirements-title {
  font-weight: 600;
  margin-bottom: 1px;
  color: #333;
  font-size: 0.95em;
}

.requirements-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  gap: 1.5px;
  padding: 1px 0;
  font-size: 0.875em;
  line-height: 1.3;
}

.requirement-icon {
  flex-shrink: 0;
  font-weight: bold;
  line-height: 1;
  margin-top: 0.2px;
}

.requirement-item:not(.completed) .requirement-icon {
  color: #f44336;
}

.requirement-item.completed .requirement-icon {
  color: #4caf50;
}

.requirement-description {
  flex: 1;
  color: #666;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.requirement-item.completed .requirement-description {
  color: #999;
  text-decoration: line-through;
}

.requirement-progress {
  flex-shrink: 0;
  font-size: 0.85em;
  color: #4a90e2;
  font-weight: 600;
  margin-left: 1px;
}

/* Responsive sizing */
@media (min-width: 769px) {
  .requirement-list {
    font-size: 0.875rem;
  }

  .requirements-title {
    margin-bottom: 0.5rem;
  }

  .requirements-items {
    gap: 0.375rem;
  }

  .requirement-item {
    gap: 0.5rem;
    padding: 0.25rem 0;
  }

  .requirement-icon {
    margin-top: 0.1rem;
  }

  .requirement-progress {
    margin-left: 0.5rem;
  }
}
</style>
