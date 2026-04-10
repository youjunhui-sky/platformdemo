<template>
  <div class="main-layout">
    <AppSidebar :collapsed="layoutStore.sidebarCollapsed" />
    <div class="main-container" :class="{ 'sidebar-collapsed': layoutStore.sidebarCollapsed }">
      <AppHeader @toggle-sidebar="layoutStore.toggleSidebar" />
      <div class="main-content">
        <AppBreadcrumb />
        <div class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: 210px;
  transition: margin-left 0.3s;
}

.main-container.sidebar-collapsed {
  margin-left: 64px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 16px;
}

.page-content {
  background: #fff;
  border-radius: 4px;
  min-height: calc(100vh - 180px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
