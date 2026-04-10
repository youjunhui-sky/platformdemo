import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { permissionDirective } from './directives/permission'
import './styles/main.css'

const app = createApp(App)

// Register Pinia
const pinia = createPinia()
app.use(pinia)

// Register Router
app.use(router)

// Register Element Plus with Chinese locale
app.use(ElementPlus, { locale: zhCn })

// Register Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Register permission directive
app.directive('permission', permissionDirective)

// Mount app
app.mount('#app')
