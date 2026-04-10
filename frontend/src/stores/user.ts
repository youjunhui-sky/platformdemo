import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '@/types'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(storage.getToken() || '')
  const userInfo = ref<UserInfo | null>(storage.getUser())
  const permissions = ref<string[]>(storage.getPermissions())

  const setToken = (newToken: string) => {
    token.value = newToken
    storage.setToken(newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    storage.setUser(info)
  }

  const setPermissions = (perms: string[]) => {
    permissions.value = perms
    storage.setPermissions(perms)
  }

  const hasPermission = (permission: string | string[]): boolean => {
    if (!permission) return true
    if (!permissions.value || !Array.isArray(permissions.value)) return false
    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.value.includes(p))
    }
    return permissions.value.includes(permission)
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!userInfo.value?.roles) return false
    if (Array.isArray(role)) {
      return role.some((r) => userInfo.value!.roles.some((ur) => ur.code === r))
    }
    return userInfo.value.roles.some((ur) => ur.code === role)
  }

  const reset = () => {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    storage.clearAll()
  }

  return {
    token,
    userInfo,
    permissions,
    setToken,
    setUserInfo,
    setPermissions,
    hasPermission,
    hasRole,
    reset
  }
})
