<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1 class="welcome-title">Welcome, {{ userStore.userInfo?.realName || userStore.userInfo?.username }}!</h1>
        <p class="welcome-subtitle">{{ currentDate }}</p>
      </div>
    </div>

    <div v-loading="loading" class="subsystem-grid">
      <SubsystemCard
        v-for="subsystem in subsystems"
        :key="subsystem.id"
        :subsystem="subsystem"
        @click="handleSubsystemClick"
      />
      <el-empty v-if="!loading && subsystems.length === 0" description="当前用户没有注册子系统" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useUserStore } from '@/stores/user'
import { useSubsystem } from '@/composables/useSubsystem'
import SubsystemCard from '@/components/subsystem/SubsystemCard.vue'
import type { Subsystem } from '@/types'

dayjs.extend(relativeTime)

const userStore = useUserStore()
const { fetchAccessibleSubsystems, navigateToSubsystem } = useSubsystem()

const loading = ref(false)
const subsystems = ref<Subsystem[]>([])

const currentDate = computed(() => {
  return dayjs().format('dddd, MMMM D, YYYY')
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetchAccessibleSubsystems() as any
    const list = Array.isArray(res) ? res : (res?.data || [])
    subsystems.value = list
  } finally {
    loading.value = false
  }
}

const handleSubsystemClick = (subsystem: any) => {
  navigateToSubsystem(subsystem)
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.welcome-subtitle {
  font-size: 14px;
  color: #909399;
}

.subsystem-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .subsystem-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .subsystem-grid {
    grid-template-columns: 1fr;
  }
}
</style>
