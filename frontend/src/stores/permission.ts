import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Menu, RouteRecordRaw } from '@/types'
import { menuApi } from '@/api/menu'

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<Menu[]>([])
  const routes = ref<RouteRecordRaw[]>([])
  const isMenuLoaded = ref(false)

  const setMenus = (menuList: Menu[]) => {
    menus.value = menuList
    isMenuLoaded.value = true
  }

  const setRoutes = (routeList: RouteRecordRaw[]) => {
    routes.value = routeList
  }

  const generateRoutes = (menuList: Menu[]): RouteRecordRaw[] => {
    return menuList.map((menu) => {
      const route: RouteRecordRaw = {
        path: menu.path,
        name: menu.name,
        component: menu.component ? loadComponent(menu.component) : undefined,
        redirect: menu.redirect,
        meta: {
          title: menu.name,
          icon: menu.icon,
          hidden: menu.visible === 0,
          permission: menu.permission ? [menu.permission] : undefined,
          keepAlive: menu.keepAlive === 1,
          requiresAuth: true
        }
      }

      if (menu.children && menu.children.length > 0) {
        route.children = generateRoutes(menu.children)
      }

      return route
    })
  }

  const loadComponent = (componentPath: string) => {
    if (!componentPath) return undefined
    // Dynamic import for views
    return () => import(`@/views/${componentPath}.vue`)
  }

  const loadMenusFromServer = async () => {
    try {
      const res = await menuApi.getTree()
      const menuData = res.data
      setMenus(menuData)
      return menuData
    } catch (error) {
      console.error('Failed to load menus:', error)
      return []
    }
  }

  const reset = () => {
    menus.value = []
    routes.value = []
    isMenuLoaded.value = false
  }

  return {
    menus,
    routes,
    isMenuLoaded,
    setMenus,
    setRoutes,
    generateRoutes,
    loadMenusFromServer,
    reset
  }
})
