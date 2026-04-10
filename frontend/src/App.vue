<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  // Check if user info is already loaded from storage
  // If not, it will be loaded on first protected route access
})
</script>

<style>
#app {
  height: 100%;
}
</style>
