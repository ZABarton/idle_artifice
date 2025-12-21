<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogEditorStore } from '@/stores/dialogEditor'
import type { DialogTree } from '@/types/dialogs'

const store = useDialogEditorStore()

const selectedTreePath = ref<string>('')
const isLoading = ref(false)
const loadError = ref<string>('')

const dialogTreeFiles = import.meta.glob<{ default: DialogTree }>(
  '/src/content/dialog-trees/*.json'
)

const availableTrees = computed(() => {
  return Object.keys(dialogTreeFiles).map((path) => {
    const filename = path.split('/').pop()?.replace('.json', '') || ''
    return { id: filename, path }
  })
})

async function loadProjectTree() {
  if (!selectedTreePath.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    const loader = dialogTreeFiles[selectedTreePath.value]
    if (!loader) {
      throw new Error('Tree file not found')
    }

    const module = await loader()
    const tree = module.default

    if (store.isDirty) {
      const confirmed = confirm('You have unsaved changes. Load new tree anyway?')
      if (!confirmed) {
        isLoading.value = false
        return
      }
    }

    store.loadDialogTree(tree)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load tree'
    console.error('Error loading dialog tree:', error)
  } finally {
    isLoading.value = false
  }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isLoading.value = true
  loadError.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string
      const tree = JSON.parse(text) as DialogTree

      if (store.isDirty) {
        const confirmed = confirm('You have unsaved changes. Load new tree anyway?')
        if (!confirmed) {
          isLoading.value = false
          input.value = ''
          return
        }
      }

      store.loadDialogTree(tree)
      input.value = ''
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Invalid JSON file'
      console.error('Error parsing uploaded file:', error)
    } finally {
      isLoading.value = false
    }
  }

  reader.onerror = () => {
    loadError.value = 'Failed to read file'
    isLoading.value = false
  }

  reader.readAsText(file)
}

function createNewTree() {
  if (store.isDirty) {
    const confirmed = confirm('You have unsaved changes. Create new tree anyway?')
    if (!confirmed) return
  }

  store.createNewTree()
  selectedTreePath.value = ''
}
</script>

<template>
  <div class="tree-selector">
    <h2>Load Dialog Tree</h2>

    <div class="selector-section">
      <h3>Project Files</h3>
      <select v-model="selectedTreePath" @change="loadProjectTree" :disabled="isLoading">
        <option value="">-- Select a tree --</option>
        <option v-for="tree in availableTrees" :key="tree.path" :value="tree.path">
          {{ tree.id }}
        </option>
      </select>
    </div>

    <div class="selector-section">
      <h3>Upload File</h3>
      <input
        type="file"
        accept=".json"
        @change="handleFileUpload"
        :disabled="isLoading"
        class="file-input"
      />
    </div>

    <div class="selector-section">
      <h3>Create New</h3>
      <button @click="createNewTree" :disabled="isLoading" class="btn-new">
        New Dialog Tree
      </button>
    </div>

    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-if="loadError" class="error">{{ loadError }}</div>

    <div v-if="store.activeTree" class="current-tree">
      <h3>Current Tree</h3>
      <div class="tree-metadata">
        <div class="metadata-row">
          <label>ID:</label>
          <input
            type="text"
            :value="store.activeTree.id"
            @input="
              (e) =>
                store.updateTreeMetadata({ id: (e.target as HTMLInputElement).value })
            "
          />
        </div>
        <div class="metadata-row">
          <label>Character:</label>
          <input
            type="text"
            :value="store.activeTree.characterName"
            @input="
              (e) =>
                store.updateTreeMetadata({
                  characterName: (e.target as HTMLInputElement).value,
                })
            "
          />
        </div>
        <div class="metadata-row">
          <label>Portrait Path:</label>
          <input
            type="text"
            :value="store.activeTree.portrait.path || ''"
            @input="
              (e) =>
                store.updateTreeMetadata({
                  portrait: {
                    path: (e.target as HTMLInputElement).value || null,
                    alt: store.activeTree!.portrait.alt,
                  },
                })
            "
          />
        </div>
        <div class="metadata-row">
          <label>Portrait Alt:</label>
          <input
            type="text"
            :value="store.activeTree.portrait.alt"
            @input="
              (e) =>
                store.updateTreeMetadata({
                  portrait: {
                    path: store.activeTree!.portrait.path,
                    alt: (e.target as HTMLInputElement).value,
                  },
                })
            "
          />
        </div>
        <div class="metadata-row">
          <label>Start Node:</label>
          <span class="readonly-value">{{ store.activeTree.startNodeId }}</span>
        </div>
        <div class="metadata-row">
          <label>Total Nodes:</label>
          <span class="readonly-value">{{ Object.keys(store.activeTree.nodes).length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-selector {
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

h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
}

.selector-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

select,
input[type='text'] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 100%;
}

select:focus,
input[type='text']:focus {
  outline: none;
  border-color: #2196f3;
}

.file-input {
  padding: 0.25rem;
  font-size: 0.85rem;
}

.btn-new {
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

.btn-new:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-new:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading {
  padding: 0.5rem;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.error {
  padding: 0.5rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 0.85rem;
  word-wrap: break-word;
}

.current-tree {
  border-top: 2px solid #e0e0e0;
  padding-top: 1rem;
}

.tree-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metadata-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metadata-row label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.readonly-value {
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #333;
}
</style>
