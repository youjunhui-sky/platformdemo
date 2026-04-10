<template>
  <div class="subsystem-layout">
    <!-- Subsystem Sidebar -->
    <div class="subsystem-sidebar" :class="{ collapsed: isCollapse }">
      <div class="sidebar-logo" @click="handleBackToPlatform">
        <img src="/vite.svg" alt="logo" class="logo-img" />
        <span v-if="!isCollapse" class="logo-text">{{ subsystemName }}</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <template v-for="item in menuItems" :key="item.path">
          <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
            <template #title>
              <el-icon v-if="item.meta?.icon">
                <component :is="getIcon(item.meta.icon)" />
              </el-icon>
              <span>{{ item.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="getIcon(child.meta.icon)" />
              </el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.meta?.icon">
              <component :is="getIcon(item.meta.icon)" />
            </el-icon>
            <span>{{ item.meta?.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- Main Container -->
    <div class="subsystem-container">
      <!-- Subsystem Header -->
      <div class="subsystem-header">
        <div class="header-left">
          <el-button text @click="handleBackToPlatform">
            <el-icon><ArrowLeft /></el-icon>
            返回平台
          </el-button>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-icon><User /></el-icon>
              {{ userName }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Content Area -->
      <div class="subsystem-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  HomeFilled,
  User as UserIcon,
  FirstAidKit,
  Document,
  Setting,
  Grid
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useUser } from '@/composables/useUser'

const route = useRoute()
const router = useRouter()
const { logout } = useUser()
const userStore = useUserStore()

const isCollapse = ref(false)
const userName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || 'User')

// Get current subsystem code from route path
const subsystemCode = computed(() => {
  const path = route.path
  const match = path.match(/^\/(\w+)/)
  return match ? match[1] : 'his'
})

// Subsystem name mapping
const subsystemNames: Record<string, string> = {
  his: 'HIS',
  lis: 'LIS',
  pacs: 'PACS'
}

const subsystemName = computed(() => subsystemNames[subsystemCode.value] || '子系统')

const activeMenu = computed(() => route.path)

// Menu configuration per subsystem
const getSubsystemMenus = (code: string) => {
  const menus: Record<string, any[]> = {
    his: [
      {
        path: `/${code}`,
        meta: { title: '首页', icon: 'home' }
      },
      {
        path: `/${code}/outpatient`,
        meta: { title: '门诊管理', icon: 'firstAid' }
      },
      {
        path: `/${code}/inpatient`,
        meta: { title: '住院管理', icon: 'hospital' }
      },
      {
        path: `/${code}/patient`,
        meta: { title: '患者管理', icon: 'user' }
      }
    ],
    lis: [
      {
        path: `/${code}`,
        meta: { title: '首页', icon: 'home' }
      },
      {
        path: `/${code}/tasks`,
        meta: { title: '检验任务', icon: 'document' }
      },
      {
        path: `/${code}/results`,
        meta: { title: '结果管理', icon: 'document' }
      }
    ],
    pacs: [
      {
        path: `/${code}`,
        meta: { title: '首页', icon: 'home' }
      },
      {
        path: `/${code}/studies`,
        meta: { title: '检查管理', icon: 'document' }
      },
      {
        path: `/${code}/reports`,
        meta: { title: '报告管理', icon: 'document' }
      }
    ]
  }
  return menus[code] || menus.his
}

const menuItems = computed(() => getSubsystemMenus(subsystemCode.value))

// Icon mapping
const iconMap: Record<string, any> = {
  home: HomeFilled,
  user: UserIcon,
  firstAid: FirstAidKit,
  hospital: Grid,
  document: Document,
  setting: Setting
}

const getIcon = (iconName: string) => {
  return iconMap[iconName] || Document
}

const handleBackToPlatform = () => {
  router.push('/dashboard')
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await logout()
    } catch {
      // User cancelled
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  }
}
</script>

<style scoped>
.subsystem-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.subsystem-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 210px;
  background: #304156;
  z-index: 100;
  transition: width 0.3s;
}

.subsystem-sidebar.collapsed {
  width: 64px;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b3a4a;
  cursor: pointer;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 210px;
}

:deep(.el-menu) {
  background: transparent;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #bfcbd9;
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: #263445;
  color: #409eff;
}

:deep(.el-menu-item.is-active) {
  background: #409eff;
  color: #fff;
}

:deep(.el-sub-menu .el-menu-item) {
  height: 50px;
  line-height: 50px;
  padding-left: 50px !important;
}

.subsystem-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: 210px;
}

.subsystem-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
}

.user-dropdown:hover {
  background: #f5f7fa;
}

.subsystem-content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 16px;
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