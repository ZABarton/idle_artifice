<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDialogEditorStore } from '@/stores/dialogEditor'
import { useRouter } from 'vue-router'
import DialogTreeSelector from '@/components/dialog-editor/DialogTreeSelector.vue'
import DialogEditorCanvas from '@/components/dialog-editor/DialogEditorCanvas.vue'
import DialogNodeEditor from '@/components/dialog-editor/DialogNodeEditor.vue'
import ValidationPanel from '@/components/dialog-editor/ValidationPanel.vue'

const store = useDialogEditorStore()
const router = useRouter()

const showExportModal = ref(false)
const showUnsavedChangesModal = ref(false)
const showSaveSuccessModal = ref(false)
const exportInstructions = ref('')
const saveMessage = ref('')
const isSaving = ref(false)

const treeInfo = computed(() => {
  if (!store.activeTree) return 'No tree loaded'
  const nodeCount = Object.keys(store.activeTree.nodes).length
  return `${store.activeTree.id} (${nodeCount} nodes)`
})

async function handleSave() {
  // Validate first
  if (store.hasValidationErrors) {
    alert('Cannot save: fix validation errors first')
    return
  }

  if (store.hasValidationWarnings) {
    const confirmed = confirm(
      `Save with ${store.validationWarnings.length} warnings?\n\n` +
        store.validationWarnings.map((w) => `- ${w.message}`).join('\n')
    )
    if (!confirmed) return
  }

  isSaving.value = true
  const result = await store.saveTree()
  isSaving.value = false

  if (result.success) {
    saveMessage.value = result.message
    showSaveSuccessModal.value = true
  } else {
    alert(`Save failed: ${result.message}`)
  }
}

function handleExport() {
  // Validate first
  if (store.hasValidationErrors) {
    alert('Cannot export: fix validation errors first')
    return
  }

  if (store.hasValidationWarnings) {
    const confirmed = confirm(
      `Export with ${store.validationWarnings.length} warnings?\n\n` +
        store.validationWarnings.map((w) => `- ${w.message}`).join('\n')
    )
    if (!confirmed) return
  }

  const json = store.exportTree()
  if (!json) {
    alert('No tree to export')
    return
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${store.activeTree?.id || 'tree'}.json`
  link.click()
  URL.revokeObjectURL(url)

  store.markClean()
  exportInstructions.value = `Downloaded ${store.activeTree?.id}.json\n\nTo use in the game:\n1. Save to src/content/dialog-trees/\n2. Replace existing file or add as new tree\n3. Restart dev server if needed`
  showExportModal.value = true
}

function handleBackToGame() {
  if (store.isDirty) {
    showUnsavedChangesModal.value = true
  } else {
    router.push('/')
  }
}

function confirmLeave() {
  store.resetEditor()
  router.push('/')
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (store.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div id="dialog-editor">
    <header class="editor-header">
      <h1>Dialog Tree Editor</h1>
      <div class="header-info">
        <span class="tree-info">{{ treeInfo }}</span>
        <span v-if="store.isDirty" class="dirty-indicator">*</span>
      </div>
      <div class="header-actions">
        <button @click="handleSave" :disabled="isSaving || !store.activeTree" class="btn-save">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
        <button @click="handleExport" class="btn-export">Export JSON</button>
        <button @click="handleBackToGame" class="btn-back">Back to Game</button>
      </div>
    </header>

    <div class="editor-layout">
      <aside class="sidebar-left">
        <DialogTreeSelector />
      </aside>

      <main class="canvas-area">
        <DialogEditorCanvas v-if="store.activeTree" />
        <div v-else class="empty-state">
          <p>No dialog tree loaded</p>
          <p>Select a tree from the sidebar or create a new one</p>
        </div>
      </main>

      <aside class="sidebar-right">
        <DialogNodeEditor v-if="store.selectedNode" />
        <div v-else class="empty-state">
          <p>No node selected</p>
          <p>Click a node on the canvas to edit</p>
        </div>
      </aside>
    </div>

    <ValidationPanel />

    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="modal-content" @click.stop>
        <h2>Export Successful</h2>
        <pre>{{ exportInstructions }}</pre>
        <button @click="showExportModal = false">OK</button>
      </div>
    </div>

    <div v-if="showUnsavedChangesModal" class="modal-overlay" @click="showUnsavedChangesModal = false">
      <div class="modal-content" @click.stop>
        <h2>Unsaved Changes</h2>
        <p>You have unsaved changes. Are you sure you want to leave?</p>
        <div class="modal-actions">
          <button @click="showUnsavedChangesModal = false" class="btn-cancel">Cancel</button>
          <button @click="confirmLeave" class="btn-danger">Discard Changes</button>
        </div>
      </div>
    </div>

    <div v-if="showSaveSuccessModal" class="modal-overlay" @click="showSaveSuccessModal = false">
      <div class="modal-content" @click.stop>
        <h2>Save Successful</h2>
        <p>{{ saveMessage }}</p>
        <p class="success-note">The dialog tree has been updated in your project files.</p>
        <button @click="showSaveSuccessModal = false" class="btn-primary">OK</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#dialog-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #ffffff;
  border-bottom: 2px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editor-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.header-info {
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tree-info {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.dirty-indicator {
  font-size: 1.5rem;
  color: #ff9800;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background-color: #4caf50;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-export {
  background-color: #ff9800;
  color: white;
}

.btn-export:hover {
  background-color: #f57c00;
}

.btn-back {
  background-color: #2196f3;
  color: white;
}

.btn-back:hover {
  background-color: #0b7dda;
}

.btn-cancel {
  background-color: #9e9e9e;
  color: white;
}

.btn-cancel:hover {
  background-color: #757575;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #da190b;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background-color: #0b7dda;
}

.success-note {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #2e7d32;
  font-style: italic;
}

.editor-layout {
  display: grid;
  grid-template-columns: 250px 1fr 350px;
  flex: 1;
  overflow: hidden;
}

.sidebar-left {
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 1rem;
}

.canvas-area {
  background-color: #fafafa;
  overflow: hidden;
  position: relative;
}

.sidebar-right {
  background-color: #ffffff;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.empty-state p {
  margin: 0.5rem 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
}

.modal-content pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 0.9rem;
  margin: 1rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 200px 1fr 300px;
  }
}

@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .sidebar-left,
  .sidebar-right {
    max-height: 200px;
  }
}
</style>
