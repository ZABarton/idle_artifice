<script setup lang="ts">
import { computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

const currentModal = computed(() => {
  const modal = dialogsStore.currentModal
  return modal?.type === 'tutorial' ? modal.modal : null
})

function handleClose() {
  dialogsStore.closeCurrentModal()
}

function handleBackdropClick() {
  // Close on backdrop click
  handleClose()
}

function handleModalClick(event: MouseEvent) {
  // Prevent backdrop click when clicking inside modal
  event.stopPropagation()
}
</script>

<template>
  <Transition name="tutorial-modal">
    <div v-if="currentModal" class="tutorial-modal-backdrop" @click="handleBackdropClick">
      <div class="tutorial-modal" @click="handleModalClick">
        <div class="tutorial-header">
          <h2 class="tutorial-title">{{ currentModal.title }}</h2>
        </div>
        <div class="tutorial-content">
          {{ currentModal.content }}
        </div>
        <div class="tutorial-footer">
          <button class="tutorial-button" @click="handleClose">Got it!</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Backdrop overlay */
.tutorial-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 20px;
}

/* Modal panel */
.tutorial-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  width: 500px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  z-index: 10001;
}

/* Header */
.tutorial-header {
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 12px;
}

.tutorial-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

/* Content */
.tutorial-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
  overflow-y: auto;
  max-height: 60vh;
}

/* Footer */
.tutorial-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.tutorial-button {
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

.tutorial-button:hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.tutorial-button:active {
  transform: translateY(0);
}

/* Transition animations */
.tutorial-modal-enter-active {
  animation: fade-in 0.3s ease-out;
}

.tutorial-modal-leave-active {
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
  .tutorial-modal-backdrop {
    padding: 10px;
    align-items: center;
    justify-content: center;
  }

  .tutorial-modal {
    max-width: 100%;
  }
}
</style>
