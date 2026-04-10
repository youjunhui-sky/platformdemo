import { ref } from 'vue'
import { roleApi } from '@/api/role'
import type { DataPermission, DataScopeType } from '@/types'

export function useDataScope() {
  const loading = ref(false)
  const dataPermission = ref<DataPermission>({
    scopeType: 'all'
  })

  const fetchDataPermission = async (roleId: string) => {
    loading.value = true
    try {
      const res = await roleApi.getDataPermissions(roleId)
      dataPermission.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const saveDataPermission = async (roleId: string, data: DataPermission) => {
    loading.value = true
    try {
      await roleApi.setDataPermissions(roleId, data)
      dataPermission.value = data
      return true
    } finally {
      loading.value = false
    }
  }

  const getScopeTypeOptions = () => {
    return [
      { value: 'all', label: 'All Data' },
      { value: 'dept', label: 'Department Data' },
      { value: 'dept_and_child', label: 'Department and Sub-department Data' },
      { value: 'self', label: 'Own Data Only' }
    ]
  }

  const isCustomScope = (scopeType: DataScopeType) => {
    return scopeType !== 'all' && scopeType !== 'self'
  }

  return {
    loading,
    dataPermission,
    fetchDataPermission,
    saveDataPermission,
    getScopeTypeOptions,
    isCustomScope
  }
}
