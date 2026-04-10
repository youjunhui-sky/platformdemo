import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSubsystemStore } from '@/stores/subsystem'
import { subsystemApi } from '@/api/subsystem'

export function useSubsystem() {
  const router = useRouter()
  const subsystemStore = useSubsystemStore()
  const loading = ref(false)

  const subsystems = computed(() => subsystemStore.subsystems)
  const currentSubsystem = computed(() => subsystemStore.currentSubsystem)

  const fetchAccessibleSubsystems = async () => {
    loading.value = true
    try {
      const res = await subsystemApi.getAccessible()
      const list = res.data.data || res.data
      subsystemStore.setSubsystems(list)
      return list
    } finally {
      loading.value = false
    }
  }

  const fetchAllSubsystems = async () => {
    loading.value = true
    try {
      const res = await subsystemApi.getAll()
      const list = res.data.data || res.data
      subsystemStore.setSubsystems(list)
      return list
    } finally {
      loading.value = false
    }
  }

  const setCurrentSubsystem = (system: any) => {
    subsystemStore.setCurrentSubsystem(system)
  }

  const navigateToSubsystem = (subsystem: any) => {
    // 使用路由跳转到子系统页面
    router.push(`/${subsystem.code}`)
  }

  const getSubsystemByCode = (code: string) => {
    return subsystemStore.getSubsystemByCode(code)
  }

  return {
    subsystems,
    currentSubsystem,
    loading,
    fetchAccessibleSubsystems,
    fetchAllSubsystems,
    setCurrentSubsystem,
    navigateToSubsystem,
    getSubsystemByCode
  }
}
