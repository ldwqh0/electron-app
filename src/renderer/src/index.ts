import { createApp } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import './styles'
import router from './router'
import { home, registryModule } from './modules'

console.log(process.env.NODE_ENV)

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

registryModule(home, { router })

app.use(router)
  .use(createPinia())
  .mount('#app')
