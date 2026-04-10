<template>
  <el-button
    v-if="hasPermission"
    v-bind="$attrs"
    :type="type"
    :size="size"
    :icon="icon"
    :loading="loading"
    :disabled="disabled"
    :plain="plain"
    :round="round"
    :circle="circle"
    :text="text"
    :bg="bg"
    @click="$emit('click', $event)"
  >
    <slot />
  </el-button>
  <span v-else-if="showDisabled">
    <el-button
      v-bind="$attrs"
      :type="type"
      :size="size"
      :icon="icon"
      :loading="loading"
      :disabled="true"
      :plain="plain"
      :round="round"
      :circle="circle"
      :text="text"
      :bg="bg"
    >
      <slot />
    </el-button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

interface Props {
  permission?: string | string[]
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  size?: 'large' | 'default' | 'small'
  icon?: string
  loading?: boolean
  disabled?: boolean
  plain?: boolean
  round?: boolean
  circle?: boolean
  text?: boolean
  bg?: boolean
  showDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  permission: '',
  type: 'primary',
  size: 'default',
  loading: false,
  disabled: false,
  plain: false,
  round: false,
  circle: false,
  text: false,
  bg: false,
  showDisabled: false
})

defineEmits(['click'])

const userStore = useUserStore()

const hasPermission = computed(() => {
  if (!props.permission) return true

  const permissions = Array.isArray(props.permission)
    ? props.permission
    : [props.permission]

  return permissions.some((perm) => userStore.hasPermission(perm))
})
</script>
