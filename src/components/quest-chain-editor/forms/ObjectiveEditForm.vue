<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuestChainEditorStore, type ObjectiveEditData } from '@/stores/questChainEditor'
import type { ObjectiveNodeData } from '@/types/questChainEditor'

const props = defineProps<{
  objectiveData: ObjectiveNodeData
}>()

const store = useQuestChainEditorStore()

// Local form state
const formData = ref<Partial<ObjectiveEditData>>({})

// Initialize form data from props
watch(
  () => props.objectiveData,
  (data) => {
    if (data) {
      // Get any pending changes for this objective
      const pending = store.getPendingChanges(data.objectiveId)
      formData.value = {
        title: pending?.title ?? data.title,
        description: pending?.description ?? data.description,
        status: pending?.status ?? data.status,
        category: pending?.category ?? data.category,
        targetLocation: pending?.targetLocation ?? data.targetLocation ?? '',
      }
    }
  },
  { immediate: true }
)

// Track if form has changes compared to original
const hasLocalChanges = computed(() => {
  const original = props.objectiveData
  return (
    formData.value.title !== original.title ||
    formData.value.description !== original.description ||
    formData.value.status !== original.status ||
    formData.value.category !== original.category ||
    formData.value.targetLocation !== (original.targetLocation ?? '')
  )
})

// Update store when form fields change
function handleFieldChange(field: keyof ObjectiveEditData, value: string) {
  formData.value[field] = value as never

  // Push changes to store
  store.updateObjective(props.objectiveData.objectiveId, {
    [field]: value,
  })
}

// Cancel editing
function handleCancel() {
  store.setEditMode(false)
}

// Save changes
async function handleSave() {
  const success = await store.saveObjectiveChanges()
  if (success) {
    store.setEditMode(false)
  }
}
</script>

<template>
  <div class="objective-edit-form">
    <div class="form-header">
      <h4>Edit Objective</h4>
      <span v-if="hasLocalChanges" class="unsaved-indicator">Unsaved changes</span>
    </div>

    <div class="form-group">
      <label for="title">Title</label>
      <input
        id="title"
        type="text"
        :value="formData.title"
        @input="handleFieldChange('title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        rows="3"
        :value="formData.description"
        @input="handleFieldChange('description', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="status">Status</label>
        <select
          id="status"
          :value="formData.status"
          @change="handleFieldChange('status', ($event.target as HTMLSelectElement).value)"
        >
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div class="form-group">
        <label for="category">Category</label>
        <select
          id="category"
          :value="formData.category"
          @change="handleFieldChange('category', ($event.target as HTMLSelectElement).value)"
        >
          <option value="main">Main</option>
          <option value="secondary">Secondary</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="targetLocation">Target Location (q,r)</label>
      <input
        id="targetLocation"
        type="text"
        placeholder="e.g., 0,0"
        :value="formData.targetLocation"
        @input="handleFieldChange('targetLocation', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Discovery Conditions (read-only for now) -->
    <div v-if="objectiveData.discoveryConditions?.length" class="form-group">
      <label>Discovery Conditions</label>
      <ul class="condition-list">
        <li v-for="(cond, index) in objectiveData.discoveryConditions" :key="index">
          <span class="condition-type">{{ cond.type }}:</span>
          {{ cond.description || cond.id }}
        </li>
      </ul>
      <p class="field-hint">Discovery condition editing coming soon</p>
    </div>

    <!-- Subtasks (read-only for now) -->
    <div v-if="objectiveData.subtasks?.length" class="form-group">
      <label>Subtasks</label>
      <ul class="subtask-list">
        <li v-for="subtask in objectiveData.subtasks" :key="subtask.id">
          {{ subtask.description }}
        </li>
      </ul>
      <p class="field-hint">Subtask editing coming soon</p>
    </div>

    <div class="form-actions">
      <button class="btn-secondary" @click="handleCancel">Cancel</button>
      <button
        class="btn-primary"
        :disabled="store.isSaving || !store.isDirty"
        @click="handleSave"
      >
        {{ store.isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.objective-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.form-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.unsaved-indicator {
  font-size: 0.75rem;
  color: #f57c00;
  background-color: #fff3e0;
  padding: 2px 8px;
  border-radius: 4px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
}

input,
textarea,
select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

textarea {
  resize: vertical;
  min-height: 60px;
}

.condition-list,
.subtask-list {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0;
  font-size: 0.85rem;
}

.condition-list li,
.subtask-list li {
  padding: 0.25rem 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.condition-type {
  font-weight: 500;
  color: #1976d2;
}

.field-hint {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #999;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}
</style>
