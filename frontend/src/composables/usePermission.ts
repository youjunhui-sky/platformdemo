import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermission() {
  const userStore = useUserStore()

  const permissions = computed(() => userStore.permissions)

  const hasPermission = (permission: string | string[]): boolean => {
    return userStore.hasPermission(permission)
  }

  const hasRole = (role: string | string[]): boolean => {
    return userStore.hasRole(role)
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some((perm) => userStore.hasPermission(perm))
  }

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every((perm) => userStore.hasPermission(perm))
  }

  return {
    permissions,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions
  }
}
