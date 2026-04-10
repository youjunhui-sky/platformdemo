<template>
  <div class="app-sidebar" :class="{ collapsed: isCollapse }">
    <div class="sidebar-logo">
      <span v-if="!isCollapse" class="logo-text">权限平台</span>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  User,
  Avatar,
  Menu as MenuIcon,
  Document,
  Setting,
  Grid
} from '@element-plus/icons-vue'
import { usePermissionStore } from '@/stores/permission'

interface Props {
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const route = useRoute()
const permissionStore = usePermissionStore()

const isCollapse = computed(() => props.collapsed)

const activeMenu = computed(() => route.path)

// Use menus from backend store, fallback to static menus
const menuItems = computed(() => {
  const backendMenus = permissionStore.menus
  if (backendMenus && backendMenus.length > 0) {
    return backendMenus.map((menu: any) => ({
      path: menu.path,
      meta: {
        title: menu.meta?.title || menu.name,
        icon: menu.icon
      },
      children: menu.children?.map((child: any) => ({
        path: child.path,
        meta: {
          title: child.meta?.title || child.name,
          icon: child.icon
        }
      }))
    }))
  }

  // Fallback to static menus if no backend menus
  // return [
  //   {
  //     path: '/dashboard',
  //     meta: { title: '工作台', icon: 'home' }
  //   },
  //   {
  //     path: '/subsystem-access',
  //     meta: { title: '子系统访问', icon: 'app' }
  //   },
  //   {
  //     path: '/system-management',
  //     meta: { title: '系统管理', icon: 'setting' },
  //     children: [
  //       {
  //         path: '/system-management/user',
  //         meta: { title: '用户管理', icon: 'user' }
  //       },
  //       {
  //         path: '/system-management/role',
  //         meta: { title: '角色管理', icon: 'role' }
  //       },
  //       {
  //         path: '/system-management/menu',
  //         meta: { title: '菜单管理', icon: 'menu' }
  //       },
  //       {
  //         path: '/system-management/subsystem',
  //         meta: { title: '子系统管理', icon: 'app' }
  //       }
  //     ]
  //   },
  //   {
  //     path: '/audit',
  //     meta: { title: '审计日志', icon: 'document' }
  //   }
  // ]
})

const iconMap: Record<string, any> = {
  home: HomeFilled,
  user: User,
  role: Avatar,
  menu: MenuIcon,
  app: Grid,
  document: Document,
  setting: Setting
}

const getIcon = (iconName: string) => {
  return iconMap[iconName] || MenuIcon
}
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 210px;
  background: #304156;
  z-index: 100;
  transition: width 0.3s;
}

.app-sidebar.collapsed {
  width: 64px;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b3a4a;
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

:deep(.el-sub-menu .el-menu-item.is-active) {
  background: #409eff;
}
</style>
