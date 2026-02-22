<script setup lang="ts">
import { useQuestChainEditorStore } from '@/stores/questChainEditor'

const store = useQuestChainEditorStore()

function toggleFilter(filterType: 'objectives' | 'dialogTrees' | 'tutorials' | 'dialogTriggers' | 'areaTriggers') {
  const filterKey = `show${filterType.charAt(0).toUpperCase() + filterType.slice(1)}` as keyof typeof store.filters
  store.updateFilters({ [filterKey]: !store.filters[filterKey] })
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">Show:</span>

      <button
        class="filter-btn"
        :class="{ active: store.filters.showObjectives }"
        @click="toggleFilter('objectives')"
      >
        <span class="filter-icon">🎯</span>
        <span class="filter-text">Objectives</span>
        <span class="filter-count">{{ store.nodeCounts.objectives }}</span>
      </button>

      <button
        class="filter-btn"
        :class="{ active: store.filters.showDialogTrees }"
        @click="toggleFilter('dialogTrees')"
      >
        <span class="filter-icon">💬</span>
        <span class="filter-text">Dialogs</span>
        <span class="filter-count">{{ store.nodeCounts.dialogTrees }}</span>
      </button>

      <button
        class="filter-btn"
        :class="{ active: store.filters.showTutorials }"
        @click="toggleFilter('tutorials')"
      >
        <span class="filter-icon">📚</span>
        <span class="filter-text">Tutorials</span>
        <span class="filter-count">{{ store.nodeCounts.tutorials }}</span>
      </button>

      <button
        class="filter-btn"
        :class="{ active: store.filters.showDialogTriggers }"
        @click="toggleFilter('dialogTriggers')"
      >
        <span class="filter-icon">⚡</span>
        <span class="filter-text">Dialog Triggers</span>
        <span class="filter-count">{{ store.nodeCounts.dialogTriggers }}</span>
      </button>

      <button
        class="filter-btn"
        :class="{ active: store.filters.showAreaTriggers }"
        @click="toggleFilter('areaTriggers')"
      >
        <span class="filter-icon">📍</span>
        <span class="filter-text">Area Triggers</span>
        <span class="filter-count">{{ store.nodeCounts.areaTriggers }}</span>
      </button>
    </div>

    <div class="filter-group">
      <span class="filter-label">Category:</span>
      <select
        :value="store.filters.categoryFilter"
        @change="store.updateFilters({ categoryFilter: ($event.target as HTMLSelectElement).value as 'all' | 'main' | 'secondary' })"
      >
        <option value="all">All</option>
        <option value="main">Main</option>
        <option value="secondary">Secondary</option>
      </select>
    </div>

    <div class="stats">
      <span class="stat-item">
        <span class="stat-value">{{ store.filteredNodes.length }}</span>
        <span class="stat-label">nodes</span>
      </span>
      <span class="stat-item">
        <span class="stat-value">{{ store.filteredEdges.length }}</span>
        <span class="stat-label">edges</span>
      </span>
      <span v-if="store.hasErrors" class="stat-item error">
        <span class="stat-value">{{ store.errorCount }}</span>
        <span class="stat-label">errors</span>
      </span>
      <span v-if="store.hasWarnings" class="stat-item warning">
        <span class="stat-value">{{ store.warningCount }}</span>
        <span class="stat-label">warnings</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.6rem;
  background-color: #e0e0e0;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  opacity: 0.6;
}

.filter-btn:hover {
  background-color: #d0d0d0;
}

.filter-btn.active {
  background-color: #2196f3;
  color: white;
  opacity: 1;
}

.filter-icon {
  font-size: 0.9rem;
}

.filter-text {
  font-weight: 500;
}

.filter-count {
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.1);
}

.filter-btn.active .filter-count {
  background-color: rgba(255, 255, 255, 0.2);
}

select {
  padding: 0.35rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: white;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: #2196f3;
}

.stats {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.8rem;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.stat-label {
  color: #666;
}

.stat-item.error .stat-value {
  color: #c62828;
}

.stat-item.warning .stat-value {
  color: #ef6c00;
}

@media (max-width: 1200px) {
  .filter-text {
    display: none;
  }
}

@media (max-width: 900px) {
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats {
    margin-left: 0;
  }
}
</style>
