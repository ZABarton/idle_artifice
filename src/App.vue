<script setup lang="ts">
import { onMounted } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'

// Trigger opening story sequence on app initialization
const dialogsStore = useDialogsStore()

onMounted(async () => {
  // Wait for tutorials to load before triggering
  await dialogsStore.initialize()

  // Trigger opening story sequence (displays in order: story 1 -> 2 -> 3 -> welcome)
  // Only shown on first game start (showOnce: true in each tutorial JSON)
  dialogsStore.showTutorial('opening-story-1')
  dialogsStore.showTutorial('opening-story-2')
  dialogsStore.showTutorial('opening-story-3')
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
