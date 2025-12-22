<script setup lang="ts">
import { onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'
import { useDialogsStore } from '@/stores/dialogs'

/**
 * QuartermasterFeature Component
 * Simple inline feature displayed directly in the Area Map
 * For now, shows description and dialog trigger button - controls will be added in future milestones
 */

const dialogsStore = useDialogsStore()

const handleTalkToQuartermaster = () => {
  // Trigger Quartermaster dialog on first click
  if (!dialogsStore.hasCompletedDialogTree('quartermaster-intro')) {
    dialogsStore.showDialogTree('quartermaster-intro')
  }
}

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('quartermaster')
})
</script>

<template>
  <div class="quartermaster-feature">
    <p class="description">Manage your camp's supplies.</p>

    <button class="talk-button" @click="handleTalkToQuartermaster">
      Talk to Quartermaster
    </button>
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

.talk-button {
  margin-top: auto;
  padding: 2px 3px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 1px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.talk-button:hover {
  background-color: #357abd;
}

.talk-button:active {
  background-color: #2b5a8a;
}
</style>
