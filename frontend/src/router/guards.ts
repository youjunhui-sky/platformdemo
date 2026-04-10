import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { storage } from '@/utils/storage'
import { usePermissionStore } from '@/stores/permission'
import { authApi } from '@/api/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/404', '/403']

// Load menus if not already loaded
const loadMenusIfNeeded = async () => {
  const permissionStore = usePermissionStore()
  if (!permissionStore.menus || permissionStore.menus.length === 0) {
    try {
      const res = await authApi.getUserMenus()
      permissionStore.setMenus(res.data?.data || res.data || [])
    } catch (e) {
      console.error('Failed to load menus:', e)
    }
  }
}

export const setupRouterGuards = (router: any) => {
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    NProgress.start()

    const hasToken = !!storage.getToken()

    if (hasToken) {
      // Load menus if not loaded yet
      await loadMenusIfNeeded()

      if (to.path === '/login' || to.path === '/') {
        next({ path: '/dashboard', replace: true })
      } else {
        next()
      }
    } else {
      if (whiteList.includes(to.path)) {
        next()
      } else {
        next(`/login?redirect=${to.path}`)
      }
    }
    NProgress.done()
  })

  router.afterEach((to: RouteLocationNormalized) => {
    document.title = to.meta.title ? `${to.meta.title} - 医院权限管理平台` : '医院权限管理平台'
    NProgress.done()
  })

  router.onError((error: Error) => {
    NProgress.done()
    console.error('Router error:', error)
  })
}