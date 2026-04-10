import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { staticRoutes, redirectRoutes } from './routes/static'
import { setupRouterGuards } from './guards'
import { usePermissionStore } from '@/stores/permission'

export const routes: RouteRecordRaw[] = [
  ...staticRoutes,
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '工作台',
          icon: 'home'
        }
      },
      {
        path: 'system-management',
        redirect: '/system-management/user',
        meta: {
          title: '系统管理',
          icon: 'setting'
        },
        children: [
          {
            path: 'user',
            name: 'UserManagement',
            component: () => import('@/views/platform/system-management/user/index.vue'),
            meta: {
              title: '用户管理',
              icon: 'user'
            }
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: () => import('@/views/platform/system-management/role/index.vue'),
            meta: {
              title: '角色管理',
              icon: 'role'
            }
          },
          {
            path: 'menu',
            name: 'MenuManagement',
            component: () => import('@/views/platform/system-management/menu/index.vue'),
            meta: {
              title: '菜单管理',
              icon: 'menu'
            }
          },
          {
            path: 'subsystem',
            name: 'SubsystemManagement',
            component: () => import('@/views/platform/system-management/subsystem/index.vue'),
            meta: {
              title: '子系统管理',
              icon: 'app'
            }
          },
          {
            path: 'organization',
            name: 'OrganizationManagement',
            component: () => import('@/views/platform/system-management/organization/index.vue'),
            meta: {
              title: '机构管理',
              icon: 'office'
            }
          },
        ]
      },
      {
        path: 'audit',
        name: 'AuditLog',
        component: () => import('@/views/platform/audit/index.vue'),
        meta: {
          title: '审计日志',
          icon: 'document'
        }
      },
      {
        path: 'base-data',
        redirect: '/base-data/dict',
        meta: {
          title: '基础数据',
          icon: 'setting'
        },
        children: [
          {
            path: 'dict',
            name: 'DictManagement',
            component: () => import('@/views/platform/base-data/dict/index.vue'),
            meta: {
              title: '字典管理',
              icon: 'dictionary'
            }
          }
        ]
      }
    ]
  },
  // HIS子系统路由
  {
    path: '/his',
    component: () => import('@/layouts/SubsystemLayout.vue'),
    meta: { subsystem: 'his', title: '医院信息系统' },
    children: [
      {
        path: '',
        name: 'HIS',
        component: () => import('@/views/subsystems/his/index.vue'),
        meta: { title: 'HIS工作台' }
      },
      {
        path: 'patient',
        name: 'HISPatient',
        component: () => import('@/views/subsystems/his/patient/index.vue'),
        meta: { title: '患者管理' }
      },
      {
        path: 'outpatient',
        name: 'HISOutpatient',
        component: () => import('@/views/subsystems/his/outpatient/index.vue'),
        meta: { title: '门诊管理' }
      },
      {
        path: 'inpatient',
        name: 'HISInpatient',
        component: () => import('@/views/subsystems/his/inpatient/index.vue'),
        meta: { title: '住院管理' }
      }
    ]
  },
  // LIS子系统路由
  {
    path: '/lis',
    component: () => import('@/layouts/SubsystemLayout.vue'),
    meta: { subsystem: 'lis', title: '检验信息系统' },
    children: [
      {
        path: '',
        name: 'LIS',
        component: () => import('@/views/subsystems/lis/index.vue'),
        meta: { title: 'LIS工作台' }
      }
    ]
  },
  // PACS子系统路由
  {
    path: '/pacs',
    component: () => import('@/layouts/SubsystemLayout.vue'),
    meta: { subsystem: 'pacs', title: '影像归档系统' },
    children: [
      {
        path: '',
        name: 'PACS',
        component: () => import('@/views/subsystems/pacs/index.vue'),
        meta: { title: 'PACS工作台' }
      }
    ]
  },
  ...redirectRoutes
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

setupRouterGuards(router)

export const addAsyncRoutes = (routes: RouteRecordRaw[]) => {
  routes.forEach((route) => {
    if (!router.hasRoute(route.name!)) {
      router.addRoute('Dashboard', route)
    }
  })
}

export default router
