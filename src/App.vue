<script setup lang="ts">
import { onMounted } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useTutorials } from '@/composables/useTutorials'

// Trigger immediate tutorials and initial dialog on app initialization
const dialogsStore = useDialogsStore()
const { triggerImmediateTutorials } = useTutorials()

onMounted(async () => {
  // Wait for tutorials to load before triggering
  await dialogsStore.initialize()

  // Trigger welcome tutorial first
  triggerImmediateTutorials()
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
