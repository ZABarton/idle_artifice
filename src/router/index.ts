import { createRouter, createWebHistory } from 'vue-router'
import MainView from '@/views/MainView.vue'
import DebugView from '@/views/DebugView.vue'

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
  ],
})

export default router
