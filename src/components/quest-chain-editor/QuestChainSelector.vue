<script setup lang="ts">
import { computed } from 'vue'
import { useQuestChainEditorStore } from '@/stores/questChainEditor'

const store = useQuestChainEditorStore()

// Group nodes by type for display
const groupedNodes = computed(() => {
  const groups: Record<string, typeof store.filteredNodes.value> = {
    objectives: [],
    dialogTrees: [],
    tutorials: [],
    dialogTriggers: [],
    areaTriggers: [],
    gameEvents: [],
    features: [],
  }

  for (const node of store.filteredNodes) {
    switch (node.type) {
      case 'objective':
        groups.objectives.push(node)
        break
      case 'dialog-tree':
        groups.dialogTrees.push(node)
        break
      case 'tutorial':
        groups.tutorials.push(node)
        break
      case 'dialog-trigger':
        groups.dialogTriggers.push(node)
        break
      case 'area-trigger':
        groups.areaTriggers.push(node)
        break
      case 'game-event':
        groups.gameEvents.push(node)
        break
      case 'feature':
        groups.features.push(node)
        break
    }
  }

  return groups
})

function selectNode(nodeId: string) {
  store.selectNode(nodeId)
}

function getNodeIcon(type: string): string {
  switch (type) {
    case 'objective':
      return '🎯'
    case 'dialog-tree':
      return '💬'
    case 'tutorial':
      return '📚'
    case 'dialog-trigger':
      return '⚡'
    case 'area-trigger':
      return '📍'
    case 'game-event':
      return '🎮'
    case 'feature':
      return '🏛️'
    default:
      return '📄'
  }
}
</script>

<template>
  <div class="selector-panel">
    <div class="selector-header">
      <h3>Quest Chain Nodes</h3>
      <span class="node-count">{{ store.filteredNodes.length }} nodes</span>
    </div>

    <div class="search-box">
      <input
        type="text"
        placeholder="Search nodes..."
        :value="store.filters.searchQuery"
        @input="store.setSearchQuery(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="node-groups">
      <!-- Objectives -->
      <div v-if="groupedNodes.objectives.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">🎯</span>
          <span class="group-title">Objectives</span>
          <span class="group-count">{{ groupedNodes.objectives.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.objectives"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Dialog Trees -->
      <div v-if="groupedNodes.dialogTrees.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">💬</span>
          <span class="group-title">Dialog Trees</span>
          <span class="group-count">{{ groupedNodes.dialogTrees.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.dialogTrees"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Tutorials -->
      <div v-if="groupedNodes.tutorials.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">📚</span>
          <span class="group-title">Tutorials</span>
          <span class="group-count">{{ groupedNodes.tutorials.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.tutorials"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Dialog Triggers -->
      <div v-if="groupedNodes.dialogTriggers.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">⚡</span>
          <span class="group-title">Dialog Triggers</span>
          <span class="group-count">{{ groupedNodes.dialogTriggers.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.dialogTriggers"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Area Triggers -->
      <div v-if="groupedNodes.areaTriggers.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">📍</span>
          <span class="group-title">Area Triggers</span>
          <span class="group-count">{{ groupedNodes.areaTriggers.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.areaTriggers"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Game Events -->
      <div v-if="groupedNodes.gameEvents.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">🎮</span>
          <span class="group-title">Game Events</span>
          <span class="group-count">{{ groupedNodes.gameEvents.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.gameEvents"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Features -->
      <div v-if="groupedNodes.features.length > 0" class="node-group">
        <div class="group-header">
          <span class="group-icon">🏛️</span>
          <span class="group-title">Features</span>
          <span class="group-count">{{ groupedNodes.features.length }}</span>
        </div>
        <ul class="node-list">
          <li
            v-for="node in groupedNodes.features"
            :key="node.id"
            class="node-item"
            :class="{ selected: store.selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
            <span class="node-label">{{ node.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Empty State -->
      <div v-if="store.filteredNodes.length === 0" class="empty-state">
        <p v-if="store.isLoading">Loading...</p>
        <p v-else-if="store.filters.searchQuery">No nodes match your search</p>
        <p v-else>No nodes to display</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selector-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selector-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.node-count {
  font-size: 0.8rem;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.search-box {
  margin-bottom: 1rem;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-box input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.node-groups {
  flex: 1;
  overflow-y: auto;
}

.node-group {
  margin-bottom: 1rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.group-icon {
  font-size: 1rem;
}

.group-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.group-count {
  font-size: 0.75rem;
  color: #666;
  background-color: #e0e0e0;
  padding: 1px 6px;
  border-radius: 8px;
}

.node-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.node-item:hover {
  background-color: #f0f0f0;
}

.node-item.selected {
  background-color: #e3f2fd;
}

.node-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.node-label {
  font-size: 0.85rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
