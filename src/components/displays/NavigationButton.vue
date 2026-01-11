<script setup lang="ts">
import { useNavigationStore } from '@/stores/navigation'

/**
 * NavigationButton Display Component
 * Used in minimized feature displays to provide navigation to feature screens
 */

interface Props {
  /** Button text to display */
  label: string
  /** Feature ID to navigate to */
  featureId: string
  /** Optional icon to show before label */
  icon?: string
  /** Button style variant */
  variant?: 'primary' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
})

const navigationStore = useNavigationStore()

const handleClick = (event: MouseEvent) => {
  // Stop propagation to prevent triggering feature card click
  event.stopPropagation()
  navigationStore.navigateToFeatureScreen(props.featureId)
}
</script>

<template>
  <button class="navigation-button" :class="`navigation-button--${variant}`" @click="handleClick">
    <span v-if="icon" class="navigation-button__icon">{{ icon }}</span>
    <span class="navigation-button__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.navigation-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.navigation-button--primary {
  background-color: #4a90e2;
  color: white;
}

.navigation-button--primary:hover {
  background-color: #357abd;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);
}

.navigation-button--primary:active {
  background-color: #2b5a8a;
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3);
}

.navigation-button--secondary {
  background-color: #e2e8f0;
  color: #475569;
}

.navigation-button--secondary:hover {
  background-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navigation-button--secondary:active {
  background-color: #b0bac5;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.navigation-button__icon {
  font-size: 1.1rem;
  line-height: 1;
}

.navigation-button__label {
  line-height: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .navigation-button {
    padding: 0.625rem 0.875rem;
    font-size: 0.8rem;
  }
}
</style>
