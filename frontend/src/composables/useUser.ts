import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { authApi } from '@/api/auth'
import { storage } from '@/utils/storage'
import router from '@/router'
import type { LoginResult } from '@/types'

export function useUser() {
  const userStore = useUserStore()

  const token = computed(() => userStore.token)
  const userInfo = computed(() => userStore.userInfo)
  const isLoggedIn = computed(() => !!userStore.token)

  const login = async (username: string, password: string, captchaId?: string, captchaAnswer?: string): Promise<LoginResult> => {
    const res = await authApi.login({ username, password, captchaId, captchaAnswer })
    // Backend wraps response in {code, message, data: {...}}
    // Actual login data is in res.data.data
    const data = res.data.data || res.data

    userStore.setToken(data.accessToken)
    userStore.setUserInfo(data.user)
    userStore.setPermissions(data.permissions)

    // 不再登录时获取菜单，单独调用 fetchPlatformMenus
    storage.setRefreshToken(data.refreshToken)

    return data
  }

  // 单独获取平台菜单的方法
  const fetchPlatformMenus = async () => {
    try {
      const res = await authApi.getUserMenus()
      const permissionStore = usePermissionStore()
      // res.data 是 API 响应 {code: 0, data: [...]}, 需要取 res.data.data 获取菜单数组
      const menuList = res.data?.data || res.data || []
      permissionStore.setMenus(menuList)
      return menuList
    } catch (error) {
      console.error('Failed to fetch platform menus:', error)
      return []
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Ignore logout API errors
    } finally {
      userStore.reset()
      router.push('/login')
    }
  }

  const getUserInfo = async () => {
    try {
      const res = await authApi.getUserInfo()
      userStore.setUserInfo(res.data)
      return res.data
    } catch (error) {
      userStore.reset()
      throw error
    }
  }

  const updateUserInfo = (info: any) => {
    userStore.setUserInfo({ ...userStore.userInfo, ...info } as any)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    getUserInfo,
    updateUserInfo,
    fetchPlatformMenus
  }
}