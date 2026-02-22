import { createRouter, createWebHistory } from 'vue-router'
import MainView from '@/views/MainView.vue'
import DebugView from '@/views/DebugView.vue'
import DialogEditorView from '@/views/DialogEditorView.vue'
import QuestChainEditorView from '@/views/QuestChainEditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MainView,
    },
    {
      path: '/debug',
      name: 'debug',
      component: DebugView,
    },
    {
      path: '/dev/dialog-editor',
      name: 'dialog-editor',
      component: DialogEditorView,
    },
    {
      path: '/dev/quest-chain-editor',
      name: 'quest-chain-editor',
      component: QuestChainEditorView,
    },
  ],
})

export default router
