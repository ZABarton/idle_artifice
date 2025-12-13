<script setup lang="ts">
import { onMounted } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useTutorials } from '@/composables/useTutorials'

// Trigger immediate tutorials on app initialization
const dialogsStore = useDialogsStore()
const { triggerImmediateTutorials } = useTutorials()

onMounted(async () => {
  // Wait for tutorials to load before triggering
  await dialogsStore.initialize()
  triggerImmediateTutorials()
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
