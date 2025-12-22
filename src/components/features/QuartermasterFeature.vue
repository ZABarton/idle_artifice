<script setup lang="ts">
import { onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

/**
 * QuartermasterFeature Component
 * Simple inline feature displayed directly in the Area Map
 * For now, shows description without controls - will be expanded in future milestones
 */

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('quartermaster')
})
</script>

<template>
  <div class="quartermaster-feature">
    <p class="description">Manage your camp's supplies.</p>
  </div>
</template>

<style scoped>
.quartermaster-feature {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 6px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.description {
  margin: 0;
  font-size: 1em;
  color: #666;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
