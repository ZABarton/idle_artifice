import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

// Spoiler warning for players using DevTools
const styles = {
  title: 'font-size: 24px; font-weight: bold; color: #4A90E2;',
  warning: 'font-size: 14px; font-weight: bold; color: #FF6B6B;',
  message: 'font-size: 12px; color: #666;',
}

console.log('%c🎮 Idle Artifice', styles.title)
console.log('%c⚠️ Spoiler Warning!', styles.warning)
console.log(
  '%cThis game contains mysteries and story elements. ' +
    'Using DevTools may reveal future content and spoil surprises. ' +
    'We recommend playing naturally to get the full experience!',
  styles.message
)
console.log('%cHappy adventuring! 🗺️', 'font-size: 12px; color: #4A90E2;')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
