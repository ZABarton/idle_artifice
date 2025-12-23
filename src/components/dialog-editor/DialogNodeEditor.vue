<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDialogEditorStore } from '@/stores/dialogEditor'
import { getPublicImagePath } from '@/utils/imageHelpers'

const store = useDialogEditorStore()

const localMessage = ref('')
const localPortraitPath = ref('')
const localPortraitAlt = ref('')
const usePortraitOverride = ref(false)

// Sync local state with selected node
watch(
  () => store.selectedNode,
  (node) => {
    if (node) {
      localMessage.value = node.message
      localPortraitPath.value = node.portrait?.path || ''
      localPortraitAlt.value = node.portrait?.alt || ''
      usePortraitOverride.value = !!node.portrait
    }
  },
  { immediate: true }
)

function saveMessage() {
  if (store.selectedNodeId) {
    store.updateNodeMessage(store.selectedNodeId, localMessage.value)
  }
}

function savePortrait() {
  if (!store.selectedNodeId) return

  if (usePortraitOverride.value) {
    store.updateNodePortrait(store.selectedNodeId, {
      path: localPortraitPath.value || null,
      alt: localPortraitAlt.value,
    })
  } else {
    store.updateNodePortrait(store.selectedNodeId, undefined)
  }
}

function handleSetStartNode() {
  if (store.selectedNodeId) {
    store.setStartNode(store.selectedNodeId)
  }
}

function handleDeleteNode() {
  if (!store.selectedNodeId) return

  const confirmed = confirm(`Delete node "${store.selectedNodeId}"?`)
  if (confirmed) {
    store.deleteNode(store.selectedNodeId)
  }
}

function handleAddResponse() {
  if (store.selectedNodeId) {
    store.addResponse(store.selectedNodeId)
  }
}

function handleUpdateResponse(index: number, text: string, nextNodeId: string) {
  if (store.selectedNodeId) {
    store.updateResponse(
      store.selectedNodeId,
      index,
      text,
      nextNodeId === '' ? null : nextNodeId
    )
  }
}

function handleDeleteResponse(index: number) {
  if (!store.selectedNodeId) return

  const confirmed = confirm('Delete this response?')
  if (confirmed) {
    store.deleteResponse(store.selectedNodeId, index)
  }
}

function handleMoveResponse(index: number, direction: 'up' | 'down') {
  if (store.selectedNodeId) {
    store.moveResponse(store.selectedNodeId, index, direction)
  }
}

function handleCreateNodeFromResponse(index: number) {
  const newNodeId = prompt('Enter new node ID:')
  if (newNodeId && store.selectedNodeId) {
    store.addNode(newNodeId)
    // Update the response to point to the new node
    const response = store.selectedNode?.responses[index]
    if (response) {
      store.updateResponse(store.selectedNodeId, index, response.text, newNodeId)
    }
  }
}

const availableNodeIds = computed(() => {
  if (!store.activeTree) return []
  return Object.keys(store.activeTree.nodes)
})
</script>

<template>
  <div v-if="store.selectedNode" class="node-editor">
    <h2>Edit Node</h2>

    <div class="editor-section">
      <label class="section-label">Node ID (read-only)</label>
      <input type="text" :value="store.selectedNode.id" disabled class="readonly-input" />
    </div>

    <div class="editor-section">
      <label class="section-label">
        Message
        <span class="char-count">({{ localMessage.length }} chars)</span>
      </label>
      <textarea
        v-model="localMessage"
        @blur="saveMessage"
        rows="6"
        placeholder="Enter node message..."
        class="message-input"
      />
    </div>

    <div class="editor-section">
      <label class="section-label">
        <input type="checkbox" v-model="usePortraitOverride" @change="savePortrait" />
        Override Portrait
      </label>

      <div v-if="usePortraitOverride" class="portrait-fields">
        <label class="field-label">Path</label>
        <input
          v-model="localPortraitPath"
          @blur="savePortrait"
          type="text"
          placeholder="images/portraits/character.png (or /images/portraits/character.png)"
        />

        <label class="field-label">Alt Text</label>
        <input v-model="localPortraitAlt" @blur="savePortrait" type="text" placeholder="Portrait description" />

        <!-- Image Preview -->
        <div v-if="localPortraitPath" class="portrait-preview">
          <label class="field-label">Preview</label>
          <div class="preview-container">
            <img
              :src="getPublicImagePath(localPortraitPath)"
              :alt="localPortraitAlt || 'Portrait preview'"
              @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
              class="preview-image"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="editor-section">
      <label class="section-label">
        Responses ({{ store.selectedNode.responses.length }})
      </label>

      <div class="responses-list">
        <div
          v-for="(response, index) in store.selectedNode.responses"
          :key="index"
          class="response-item"
        >
          <div class="response-header">
            <span>Response {{ index + 1 }}</span>
            <div class="reorder-buttons">
              <button
                @click="handleMoveResponse(index, 'up')"
                :disabled="index === 0"
                class="btn-reorder"
                title="Move up"
              >
                ▲
              </button>
              <button
                @click="handleMoveResponse(index, 'down')"
                :disabled="index === store.selectedNode.responses.length - 1"
                class="btn-reorder"
                title="Move down"
              >
                ▼
              </button>
            </div>
          </div>

          <label class="field-label">Text</label>
          <input
            :value="response.text"
            @change="
              (e) =>
                handleUpdateResponse(
                  index,
                  (e.target as HTMLInputElement).value,
                  response.nextNodeId || ''
                )
            "
            type="text"
            placeholder="Response text..."
            class="response-text"
          />

          <label class="field-label">Next Node</label>
          <div class="next-node-controls">
            <select
              :value="response.nextNodeId || ''"
              @change="
                (e) =>
                  handleUpdateResponse(
                    index,
                    response.text,
                    (e.target as HTMLSelectElement).value
                  )
              "
              class="next-node-select"
            >
              <option value="">(End conversation)</option>
              <option v-for="nodeId in availableNodeIds" :key="nodeId" :value="nodeId">
                {{ nodeId }}
              </option>
            </select>
            <button @click="handleCreateNodeFromResponse(index)" class="btn-create-node">
              +
            </button>
          </div>

          <button @click="handleDeleteResponse(index)" class="btn-delete-response">
            Delete Response
          </button>
        </div>
      </div>

      <button @click="handleAddResponse" class="btn-add-response">Add Response</button>
    </div>

    <div class="editor-actions">
      <button @click="handleSetStartNode" class="btn-set-start">Set as Start Node</button>
      <button @click="handleDeleteNode" class="btn-delete-node">Delete Node</button>
    </div>
  </div>
</template>

<style scoped>
.node-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
  margin-top: 0.5rem;
}

.char-count {
  font-size: 0.75rem;
  color: #999;
  font-weight: normal;
}

input[type='text'],
textarea,
select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

input[type='text']:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #2196f3;
}

.readonly-input {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.message-input {
  resize: vertical;
  min-height: 100px;
}

.portrait-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1.5rem;
}

.portrait-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.preview-container {
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  background-color: #f9f9f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.response-item {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.response-header {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reorder-buttons {
  display: flex;
  gap: 0.25rem;
}

.btn-reorder {
  padding: 0.25rem 0.5rem;
  background-color: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 3px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-reorder:hover:not(:disabled) {
  background-color: #2196f3;
  color: white;
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.response-text {
  width: 100%;
}

.next-node-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.next-node-select {
  flex: 1;
}

.btn-create-node {
  padding: 0.5rem 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-create-node:hover {
  background-color: #45a049;
}

.btn-delete-response {
  padding: 0.4rem 0.75rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.btn-delete-response:hover {
  background-color: #da190b;
}

.btn-add-response {
  padding: 0.5rem 1rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add-response:hover {
  background-color: #0b7dda;
}

.editor-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e0e0e0;
}

.btn-set-start {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-set-start:hover {
  background-color: #45a049;
}

.btn-delete-node {
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-delete-node:hover {
  background-color: #da190b;
}
</style>
