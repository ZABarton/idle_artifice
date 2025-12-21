<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogEditorStore } from '@/stores/dialogEditor'

const store = useDialogEditorStore()
const isExpanded = ref(true)

const totalIssues = computed(
  () => store.validationErrors.length + store.validationWarnings.length
)

const statusMessage = computed(() => {
  if (store.validationErrors.length > 0) {
    return `${store.validationErrors.length} Error${store.validationErrors.length > 1 ? 's' : ''}`
  }
  if (store.validationWarnings.length > 0) {
    return `${store.validationWarnings.length} Warning${store.validationWarnings.length > 1 ? 's' : ''}`
  }
  return 'No Issues'
})

const statusClass = computed(() => {
  if (store.validationErrors.length > 0) return 'status-error'
  if (store.validationWarnings.length > 0) return 'status-warning'
  return 'status-success'
})

function togglePanel() {
  isExpanded.value = !isExpanded.value
}

function highlightNode(nodeId: string | undefined) {
  if (nodeId) {
    store.selectNode(nodeId)
  }
}
</script>

<template>
  <div class="validation-panel" :class="{ collapsed: !isExpanded }">
    <div class="panel-header" @click="togglePanel">
      <div class="header-left">
        <span :class="['status-badge', statusClass]">{{ statusMessage }}</span>
        <span v-if="totalIssues > 0" class="issue-count">{{ totalIssues }} total issues</span>
      </div>
      <button class="toggle-btn">{{ isExpanded ? '▼' : '▲' }}</button>
    </div>

    <div v-if="isExpanded" class="panel-content">
      <div v-if="store.validationErrors.length === 0 && store.validationWarnings.length === 0" class="no-issues">
        <span class="success-icon">✓</span>
        All validation checks passed
      </div>

      <div v-if="store.validationErrors.length > 0" class="issues-section">
        <h3 class="section-title error-title">Errors ({{ store.validationErrors.length }})</h3>
        <div
          v-for="(error, index) in store.validationErrors"
          :key="`error-${index}`"
          class="issue-item error-item"
        >
          <div class="issue-icon">✗</div>
          <div class="issue-content">
            <div class="issue-message">{{ error.message }}</div>
            <div v-if="error.nodeId" class="issue-actions">
              <button @click="highlightNode(error.nodeId)" class="btn-highlight">
                Show Node: {{ error.nodeId }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="store.validationWarnings.length > 0" class="issues-section">
        <h3 class="section-title warning-title">
          Warnings ({{ store.validationWarnings.length }})
        </h3>
        <div
          v-for="(warning, index) in store.validationWarnings"
          :key="`warning-${index}`"
          class="issue-item warning-item"
        >
          <div class="issue-icon">⚠</div>
          <div class="issue-content">
            <div class="issue-message">{{ warning.message }}</div>
            <div v-if="warning.nodeId" class="issue-actions">
              <button @click="highlightNode(warning.nodeId)" class="btn-highlight">
                Show Node: {{ warning.nodeId }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.validation-panel {
  background-color: white;
  border-top: 2px solid #e0e0e0;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  transition: max-height 0.3s;
}

.validation-panel.collapsed {
  max-height: 60px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.panel-header:hover {
  background-color: #f5f5f5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-error {
  background-color: #ffebee;
  color: #c62828;
}

.status-warning {
  background-color: #fff3e0;
  color: #ef6c00;
}

.status-success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.issue-count {
  font-size: 0.85rem;
  color: #666;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem 0.5rem;
}

.panel-content {
  overflow-y: auto;
  padding: 1rem 1.5rem;
  flex: 1;
}

.no-issues {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #2e7d32;
  font-size: 1rem;
}

.success-icon {
  font-size: 1.5rem;
}

.issues-section {
  margin-bottom: 1.5rem;
}

.issues-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.error-title {
  color: #c62828;
}

.warning-title {
  color: #ef6c00;
}

.issue-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid;
}

.error-item {
  background-color: #ffebee;
  border-left-color: #c62828;
}

.warning-item {
  background-color: #fff3e0;
  border-left-color: #ef6c00;
}

.issue-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-item .issue-icon {
  color: #c62828;
}

.warning-item .issue-icon {
  color: #ef6c00;
}

.issue-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.issue-message {
  font-size: 0.85rem;
  color: #333;
  line-height: 1.4;
}

.issue-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-highlight {
  padding: 0.25rem 0.5rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-highlight:hover {
  background-color: #0b7dda;
}
</style>
