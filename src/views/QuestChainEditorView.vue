<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestChainEditorStore } from '@/stores/questChainEditor'
import QuestChainSelector from '@/components/quest-chain-editor/QuestChainSelector.vue'
import QuestChainCanvas from '@/components/quest-chain-editor/QuestChainCanvas.vue'
import QuestChainNodeViewer from '@/components/quest-chain-editor/QuestChainNodeViewer.vue'
import QuestChainValidationPanel from '@/components/quest-chain-editor/QuestChainValidationPanel.vue'
import QuestChainFilterBar from '@/components/quest-chain-editor/QuestChainFilterBar.vue'

const store = useQuestChainEditorStore()
const router = useRouter()

function handleBackToGame() {
  store.resetEditor()
  router.push('/')
}

function handleRefresh() {
  store.loadGraph()
}

onMounted(() => {
  store.loadGraph()
})

onBeforeUnmount(() => {
  store.resetEditor()
})
</script>

<template>
  <div id="quest-chain-editor">
    <header class="editor-header">
      <h1>Quest Chain Editor</h1>
      <div class="header-info">
        <span v-if="store.isLoading" class="loading-indicator">Loading...</span>
        <span v-else-if="store.graph" class="graph-info">
          {{ store.nodeCounts.total }} nodes, {{ store.graph.edges.length }} connections
        </span>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" @click="handleRefresh" :disabled="store.isLoading">
          Refresh
        </button>
        <button class="btn-back" @click="handleBackToGame">Back to Game</button>
      </div>
    </header>

    <QuestChainFilterBar />

    <div class="editor-layout">
      <aside class="sidebar-left">
        <QuestChainSelector />
      </aside>

      <main class="canvas-area">
        <QuestChainCanvas />
      </main>

      <aside class="sidebar-right">
        <QuestChainNodeViewer />
      </aside>
    </div>

    <QuestChainValidationPanel />
  </div>
</template>

<style scoped>
#quest-chain-editor {
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
}

.loading-indicator {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.graph-info {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
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

.btn-refresh {
  background-color: #4caf50;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-refresh:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-back {
  background-color: #2196f3;
  color: white;
}

.btn-back:hover {
  background-color: #0b7dda;
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
