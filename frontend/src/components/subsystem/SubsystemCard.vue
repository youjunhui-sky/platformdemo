<template>
  <div class="subsystem-card" @click="handleClick">
    <div class="card-icon" :style="iconStyle">
      <img v-if="subsystem.logoUrl" :src="subsystem.logoUrl" :alt="subsystem.name" />
      <img v-else :src="subsystemIcon" :alt="subsystem.name" />
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ subsystem.name }}</h3>
      <p class="card-description">{{ subsystem.description || '点击进入子系统' }}</p>
      <div class="card-status">
        <el-tag :type="subsystem.status === 'active' ? 'success' : 'danger'" size="small">
          {{ subsystem.status === 'active' ? '启用' : '禁用' }}
        </el-tag>
      </div>
    </div>
    <div class="card-action">
      <el-icon><ArrowRight /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import type { Subsystem } from '@/types'
import { getSubsystemIcon, getSubsystemColor } from '@/utils/subsystem-icon'

interface Props {
  subsystem: Subsystem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [subsystem: Subsystem]
}>()

const subsystemIcon = computed(() => getSubsystemIcon(props.subsystem.code))
const iconColor = computed(() => getSubsystemColor(props.subsystem.code))

const iconStyle = computed(() => ({
  background: `${iconColor.value}15`
}))

const handleClick = () => {
  if (props.subsystem.status !== 'active') {
    return
  }
  emit('click', props.subsystem)
}
</script>

<style scoped>
.subsystem-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.subsystem-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  margin-right: 16px;
  flex-shrink: 0;
}

.card-icon img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.card-description {
  font-size: 14px;
  color: #999;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-status {
  display: flex;
  align-items: center;
}

.card-action {
  flex-shrink: 0;
  margin-left: 16px;
  font-size: 20px;
  color: #c0c4cc;
  transition: color 0.3s;
}

.subsystem-card:hover .card-action {
  color: #409eff;
}
</style>
