<script setup lang="ts">
import { computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { getPublicImagePath } from '@/utils/imageHelpers'

const dialogsStore = useDialogsStore()

const currentModal = computed(() => {
  const modal = dialogsStore.currentModal
  return modal?.type === 'dialog' ? modal.modal : null
})

function handleClose() {
  dialogsStore.closeCurrentModal()
}

function handleModalClick(event: MouseEvent) {
  // Prevent backdrop click when clicking inside modal
  event.stopPropagation()
}
</script>

<template>
  <Transition name="dialog-modal">
    <div v-if="currentModal" class="dialog-modal-backdrop">
      <div class="dialog-modal" @click="handleModalClick">
        <!-- Left column: Character portrait -->
        <div class="dialog-portrait">
          <img
            v-if="currentModal.portrait.path"
            :src="getPublicImagePath(currentModal.portrait.path)"
            :alt="currentModal.portrait.alt"
            class="portrait-image"
          />
          <div v-else class="portrait-placeholder">
            <span class="portrait-icon">👤</span>
          </div>
        </div>

        <!-- Right column: Dialog content -->
        <div class="dialog-content-area">
          <div class="dialog-header">
            <h2 class="character-name">{{ currentModal.characterName }}</h2>
          </div>
          <div class="dialog-message">
            {{ currentModal.message }}
          </div>
          <div class="dialog-footer">
            <button class="dialog-button" @click="handleClose">Continue</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Backdrop overlay */
.dialog-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
}

/* Modal panel - two-column layout */
.dialog-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  width: 700px;
  max-width: 90%;
  display: flex;
  flex-direction: row;
  gap: 0;
  z-index: 10001;
  overflow: hidden;
}

/* Left column: Portrait (~30% width) */
.dialog-portrait {
  width: 30%;
  min-width: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.portrait-image {
  width: 100%;
  height: auto;
  border-radius: 4px;
  object-fit: cover;
}

.portrait-placeholder {
  width: 100%;
  aspect-ratio: 3/4;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portrait-icon {
  font-size: 4rem;
  opacity: 0.7;
}

/* Right column: Content (~70% width) */
.dialog-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
}

/* Header */
.dialog-header {
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 12px;
}

.character-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

/* Message content */
.dialog-message {
  flex: 1;
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
  overflow-y: auto;
  max-height: 50vh;
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.dialog-button {
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-button:hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.dialog-button:active {
  transform: translateY(0);
}

/* Transition animations */
.dialog-modal-enter-active {
  animation: fade-in 0.3s ease-out;
}

.dialog-modal-leave-active {
  animation: fade-out 0.2s ease-in;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dialog-modal-backdrop {
    padding: 10px;
    align-items: center;
  }

  .dialog-modal {
    flex-direction: column;
    max-width: 100%;
  }

  .dialog-portrait {
    width: 100%;
    min-width: unset;
    padding: 16px;
  }

  .portrait-placeholder {
    max-width: 200px;
    margin: 0 auto;
  }
}
</style>
