<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { formatRelativeTime } from '@/utils/time'

/**
 * HelpView Component
 * Full-screen view for browsing completed tutorials and conversation history
 */

const dialogsStore = useDialogsStore()

// Track which tutorial/conversation is currently expanded
const expandedTutorialId = ref<string | null>(null)
const expandedConversationId = ref<string | null>(null)

// Get completed tutorials
const completedTutorials = computed(() => {
  const allTutorials = Array.from(dialogsStore.loadedTutorials.values())
  return allTutorials.filter((tutorial) =>
    dialogsStore.completedTutorials.has(tutorial.id)
  )
})

// Get conversation history
const conversations = computed(() => dialogsStore.conversationHistory)

// Toggle tutorial expansion
function toggleTutorial(tutorialId: string) {
  if (expandedTutorialId.value === tutorialId) {
    expandedTutorialId.value = null
  } else {
    expandedTutorialId.value = tutorialId
    expandedConversationId.value = null // Close any open conversation
  }
}

// Toggle conversation expansion
function toggleConversation(conversationId: string) {
  if (expandedConversationId.value === conversationId) {
    expandedConversationId.value = null
  } else {
    expandedConversationId.value = conversationId
    expandedTutorialId.value = null // Close any open tutorial
  }
}

// Check if tutorial is expanded
function isTutorialExpanded(tutorialId: string): boolean {
  return expandedTutorialId.value === tutorialId
}

// Check if conversation is expanded
function isConversationExpanded(conversationId: string): boolean {
  return expandedConversationId.value === conversationId
}

// Format timestamp for conversation
function formatTimestamp(date: Date): string {
  return formatRelativeTime(date)
}

// Format message timestamp for transcript
function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <div class="help-view-container">
    <!-- Header Bar -->
    <header class="help-view-header">
      <h1 class="help-view-header__title">Help</h1>
    </header>

    <!-- Main Content - Scrollable -->
    <div class="help-view-content">
      <!-- Completed Tutorials Section -->
      <section v-if="completedTutorials.length > 0" class="tutorials-section">
        <h2 class="section-title">Completed Tutorials</h2>
        <div class="help-list">
          <div
            v-for="tutorial in completedTutorials"
            :key="tutorial.id"
            class="help-card"
            :class="{ expanded: isTutorialExpanded(tutorial.id) }"
            @click="toggleTutorial(tutorial.id)"
          >
            <div class="help-card-header">
              <h3 class="help-card-title">{{ tutorial.title }}</h3>
              <span class="expand-icon">{{ isTutorialExpanded(tutorial.id) ? '▼' : '▶' }}</span>
            </div>

            <!-- Expanded Tutorial Content -->
            <div v-if="isTutorialExpanded(tutorial.id)" class="help-card-content">
              <div class="tutorial-content">{{ tutorial.content }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Conversation History Section -->
      <section v-if="conversations.length > 0" class="conversations-section">
        <h2 class="section-title">Conversation History</h2>
        <div class="help-list">
          <div
            v-for="conversation in conversations"
            :key="conversation.conversationId"
            class="help-card"
            :class="{ expanded: isConversationExpanded(conversation.conversationId) }"
            @click="toggleConversation(conversation.conversationId)"
          >
            <div class="help-card-header">
              <div class="conversation-summary">
                <h3 class="help-card-title">
                  Conversation with {{ conversation.characterName }}
                </h3>
                <div class="conversation-timestamp">{{ formatTimestamp(conversation.startedAt) }}</div>
              </div>
              <span class="expand-icon">{{
                isConversationExpanded(conversation.conversationId) ? '▼' : '▶'
              }}</span>
            </div>

            <!-- Expanded Conversation Transcript -->
            <div v-if="isConversationExpanded(conversation.conversationId)" class="help-card-content">
              <div class="transcript">
                <div
                  v-for="(entry, index) in conversation.transcript"
                  :key="index"
                  class="transcript-entry"
                  :class="entry.speaker"
                >
                  <div class="transcript-header">
                    <span class="speaker-name">{{ entry.speakerName }}</span>
                    <span class="message-time">{{ formatMessageTime(entry.timestamp) }}</span>
                  </div>
                  <div class="transcript-message">{{ entry.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div
        v-if="completedTutorials.length === 0 && conversations.length === 0"
        class="empty-state"
      >
        <p>No tutorials completed or conversations recorded yet.</p>
        <p class="empty-state-hint">
          Complete tutorials and talk to characters to see them appear here.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container */
.help-view-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
}

/* Header Bar */
.help-view-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: #2c3e50;
  padding: 0 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  flex-shrink: 0;
}

.help-view-header__title {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Main Content Area */
.help-view-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* Section Styling */
section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #2196f3;
}

/* Help List */
.help-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Help Card */
.help-card {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.help-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-color: #2196f3;
}

.help-card.expanded {
  border-color: #2196f3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.help-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.help-card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.conversation-summary {
  flex: 1;
}

.conversation-timestamp {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.25rem;
}

.expand-icon {
  font-size: 0.9rem;
  color: #666;
  transition: transform 0.2s;
  flex-shrink: 0;
}

/* Help Card Content (Expanded) */
.help-card-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

/* Tutorial Content */
.tutorial-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #555;
  font-size: 0.95rem;
}

/* Transcript Styling */
.transcript {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transcript-entry {
  padding: 0.75rem;
  border-radius: 6px;
  background: #f9f9f9;
}

.transcript-entry.npc {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.transcript-entry.player {
  background: #f1f8e9;
  border-left: 4px solid #4caf50;
}

.transcript-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.speaker-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.message-time {
  font-size: 0.75rem;
  color: #888;
}

.transcript-message {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #888;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.empty-state-hint {
  font-size: 0.9rem;
  color: #aaa;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .help-view-content {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .help-card {
    padding: 1rem;
  }

  .help-card-title {
    font-size: 1rem;
  }
}
</style>
