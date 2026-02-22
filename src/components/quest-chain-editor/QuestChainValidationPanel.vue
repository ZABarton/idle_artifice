<script setup lang="ts">
import { computed } from 'vue'
import { useQuestChainEditorStore } from '@/stores/questChainEditor'

const store = useQuestChainEditorStore()

const errors = computed(() => store.validationIssues.filter((i) => i.type === 'error'))
const warnings = computed(() => store.validationIssues.filter((i) => i.type === 'warning'))

function navigateToNode(nodeId: string | undefined) {
  if (nodeId) {
    store.selectNode(nodeId)
  }
}
</script>

<template>
  <div v-if="store.validationIssues.length > 0" class="validation-panel">
    <div class="panel-header">
      <h4>Validation Issues</h4>
      <div class="issue-counts">
        <span v-if="errors.length > 0" class="count error">{{ errors.length }} errors</span>
        <span v-if="warnings.length > 0" class="count warning">{{ warnings.length }} warnings</span>
      </div>
    </div>

    <div class="issues-list">
      <!-- Errors -->
      <div v-for="issue in errors" :key="issue.message" class="issue-item error">
        <span class="issue-icon">❌</span>
        <div class="issue-content">
          <span class="issue-message">{{ issue.message }}</span>
          <button
            v-if="issue.nodeId"
            class="navigate-btn"
            @click="navigateToNode(issue.nodeId)"
          >
            Go to node
          </button>
        </div>
      </div>

      <!-- Warnings -->
      <div v-for="issue in warnings" :key="issue.message" class="issue-item warning">
        <span class="issue-icon">⚠️</span>
        <div class="issue-content">
          <span class="issue-message">{{ issue.message }}</span>
          <button
            v-if="issue.nodeId"
            class="navigate-btn"
            @click="navigateToNode(issue.nodeId)"
          >
            Go to node
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.validation-panel {
  position: fixed;
  bottom: 0;
  left: 250px;
  right: 350px;
  background-color: #ffffff;
  border-top: 2px solid #e0e0e0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
}

.panel-header h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.issue-counts {
  display: flex;
  gap: 0.75rem;
}

.count {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
}

.count.error {
  background-color: #ffebee;
  color: #c62828;
}

.count.warning {
  background-color: #fff3e0;
  color: #ef6c00;
}

.issues-list {
  padding: 0.5rem;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.issue-item.error {
  background-color: #ffebee;
}

.issue-item.warning {
  background-color: #fff8e1;
}

.issue-icon {
  flex-shrink: 0;
  font-size: 0.9rem;
}

.issue-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.issue-message {
  font-size: 0.85rem;
  color: #333;
}

.navigate-btn {
  padding: 2px 8px;
  font-size: 0.75rem;
  background-color: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.navigate-btn:hover {
  background-color: rgba(0, 0, 0, 0.15);
}

@media (max-width: 1024px) {
  .validation-panel {
    left: 200px;
    right: 300px;
  }
}

@media (max-width: 768px) {
  .validation-panel {
    left: 0;
    right: 0;
  }
}
</style>
