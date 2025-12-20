<script setup lang="ts">
import { onMounted } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useTutorials } from '@/composables/useTutorials'
import { useDialogs } from '@/composables/useDialogs'

// Trigger immediate tutorials and initial dialog on app initialization
const dialogsStore = useDialogsStore()
const { triggerImmediateTutorials } = useTutorials()
const { triggerDialog } = useDialogs()

onMounted(async () => {
  // Wait for tutorials to load before triggering
  await dialogsStore.initialize()

  // Trigger welcome tutorial first
  triggerImmediateTutorials()

  // Then trigger headmaster welcome dialog (will show after tutorial is dismissed)
  await triggerDialog('headmaster-welcome')
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
