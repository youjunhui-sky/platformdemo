import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Subsystem } from '@/types'

export const useSubsystemStore = defineStore('subsystem', () => {
  const subsystems = ref<Subsystem[]>([])
  const currentSubsystem = ref<Subsystem | null>(null)

  const setSubsystems = (list: Subsystem[]) => {
    subsystems.value = list
  }

  const setCurrentSubsystem = (system: Subsystem | null) => {
    currentSubsystem.value = system
  }

  const getSubsystemByCode = (code: string): Subsystem | undefined => {
    return subsystems.value.find((s) => s.code === code)
  }

  const reset = () => {
    subsystems.value = []
    currentSubsystem.value = null
  }

  return {
    subsystems,
    currentSubsystem,
    setSubsystems,
    setCurrentSubsystem,
    getSubsystemByCode,
    reset
  }
})
