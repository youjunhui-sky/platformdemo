<template>
  <div class="role-management">
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <div class="header-actions">
        <PermissionButton type="primary" permission="role:create" show-disabled @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增角色
        </PermissionButton>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="角色名/角色编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="roleList"
        border
        :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <PermissionButton type="primary" link permission="role:update" show-disabled @click="handleEdit(row)">
                编辑
              </PermissionButton>
              <PermissionButton type="success" link permission="role:menus" show-disabled @click="handleAssignMenus(row)">
                菜单权限
              </PermissionButton>
              <PermissionButton type="warning" link permission="role:subsystems" show-disabled @click="handleAssignSubsystems(row)">
                子系统
              </PermissionButton>
              <PermissionButton type="info" link permission="role:data-scope" show-disabled @click="handleDataScope(row)">
                数据范围
              </PermissionButton>
              <PermissionButton type="danger" link permission="role:delete" show-disabled @click="handleDelete(row)">
                删除
              </PermissionButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- Role Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="roleForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Assign Menus Dialog -->
    <el-dialog v-model="menusDialogVisible" title="分配菜单权限" width="750px" destroy-on-close>
      <el-tabs v-model="activeMenuTab">
        <el-tab-pane label="平台" name="platform">
          <div class="menu-hierarchy-container" style="max-height: 400px; overflow-y: auto;">
            <div v-if="safePlatformMenus.length > 0" class="menu-hierarchy-list">
              <!-- 遍历原始列表，每个菜单显示为一组（包括按钮权限） -->
              <template v-for="item in platformMenuFlatList" :key="item.id">
                <div class="menu-item-line" :style="{ paddingLeft: (item.level - 1) * 20 + 'px' }">
                  <el-checkbox
                    :indeterminate="isMenuIndeterminate(item.id)"
                    :model-value="isMenuChecked(item.id)"
                    @change="(val: any) => handleMenuCheckChange(item, val, undefined)"
                  >
                    {{ item.name }}
                  </el-checkbox>
                </div>
                <!-- 按钮权限不再单独显示 -->
              </template>
            </div>
            <el-empty v-else description="暂无菜单数据" />
          </div>
        </el-tab-pane>
        <el-tab-pane
          v-for="sub in subsystemList"
          :key="sub.id"
          :label="sub.name"
          :name="sub.code"
        >
          <div class="menu-hierarchy-container" style="max-height: 400px; overflow-y: auto;">
              <div v-if="getSubsystemMenus(sub.code) && getSubsystemMenus(sub.code).length > 0" class="menu-hierarchy-list">
                <template v-for="item in getSubsystemMenuFlatList(sub.code)" :key="item.id">
                  <div class="menu-item-line" :style="{ paddingLeft: (item.level - 1) * 20 + 'px' }">
                    <el-checkbox
                      :indeterminate="isMenuIndeterminate(item.id, sub.code)"
                      :model-value="isMenuChecked(item.id)"
                      @change="(val: any) => handleMenuCheckChange(item, val, sub.code)"
                    >
                      {{ item.name }}
                    </el-checkbox>
                  </div>
                </template>
              </div>
              <el-empty v-else description="暂无菜单数据" />
            </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="menusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleMenusSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Assign Subsystems Dialog -->
    <el-dialog v-model="subsystemsDialogVisible" title="分配子系统" width="500px" destroy-on-close>
      <div class="subsystem-list">
        <el-checkbox-group v-model="selectedSubsystemIds">
          <el-checkbox
            v-for="subsystem in subsystemList"
            :key="subsystem.id"
            :value="subsystem.id"
            style="display: block; margin-bottom: 12px;"
          >
            {{ subsystem.name }} ({{ subsystem.code }})
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="subsystemsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubsystemsSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Data Scope Dialog -->
    <el-dialog v-model="dataScopeDialogVisible" title="配置数据范围" width="600px" destroy-on-close>
      <el-form :model="dataScopeForm" label-width="120px">
        <el-form-item label="范围类型">
          <el-radio-group v-model="dataScopeForm.scopeType">
            <el-radio value="all">全部数据</el-radio>
            <el-radio value="dept">部门数据</el-radio>
            <el-radio value="dept_and_child">部门及子部门数据</el-radio>
            <el-radio value="self">仅本人数据</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="dataScopeForm.scopeType !== 'all' && dataScopeForm.scopeType !== 'self'" label="选择部门">
          <el-tree-select
            v-model="dataScopeForm.deptIds"
            :data="orgTree"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            placeholder="请选择部门"
            check-strictly
            filterable
            multiple
            collapse-tags
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataScopeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleDataScopeSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { roleApi } from '@/api/role'
import { menuApi } from '@/api/menu'
import { subsystemApi } from '@/api/subsystem'
import { organizationApi } from '@/api/organization'
import PermissionButton from '@/components/permission/PermissionButton.vue'
import type { Role, RoleForm, Menu, Subsystem, Organization } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const roleList = ref<Role[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})
const platformMenus = ref<Menu[]>([])
const safePlatformMenus = computed(() => Array.isArray(platformMenus.value) ? platformMenus.value : [])
const subsystemList = ref<Subsystem[]>([])
const orgTree = ref<Organization[]>([])
const dialogVisible = ref(false)
const menusDialogVisible = ref(false)
const subsystemsDialogVisible = ref(false)
const dataScopeDialogVisible = ref(false)
const isEdit = ref(false)
const currentRoleId = ref('')
const activeMenuTab = ref('platform')

// Subsystem menus cache
const subsystemMenusMap = ref<Record<string, Menu[]>>({})

// Flat menu list with level info
interface MenuFlatItem {
  id: string
  name: string
  level: number
  parentId: string | null
  permission?: string
  type?: string
}

// 按钮权限映射（已弃用，改用 menuButtonMap）
const menuPermissionMap = ref<Record<string, string[]>>({})

// 获取菜单的按钮权限列表（从按钮类型的子菜单）
const getMenuPermissions = (menuId: string): MenuFlatItem[] => {
  const buttonMenus = menuButtonMap.value[menuId]
  return buttonMenus || []
}

// 按钮子菜单映射：menuId -> button子菜单列表
const menuButtonMap = ref<Record<string, MenuFlatItem[]>>({})



const toFlatList = (menus: Menu[], level: number = 1, parentId: string | null = null): MenuFlatItem[] => {
  const result: MenuFlatItem[] = []
  for (const menu of menus) {
    result.push({
      id: menu.id,
      name: menu.name,
      level,
      parentId,
      permission: menu.permission,
      type: (menu as any).type || 'menu'  // 从菜单数据中获取type字段
    })
    if (menu.children && menu.children.length > 0) {
      result.push(...toFlatList(menu.children, level + 1, menu.id))
    }
  }
  return result
}

// Platform菜单扁平化列表
const platformMenuFlatList = computed(() => toFlatList(platformMenus.value))

// 子系统菜单扁平化列表
const subsystemMenuFlatMap = ref<Record<string, MenuFlatItem[]>>({})

const getSubsystemMenuFlatList = (code: string) => {
  const data = subsystemMenuFlatMap.value[code]
  return Array.isArray(data) ? data : []
}

const getSubsystemMenus = (code: string) => {
  const data = subsystemMenusMap.value[code]
  return Array.isArray(data) ? data : []
}

// 选中的菜单ID列表
const selectedMenuIds = ref<string[]>([])

// 平台菜单的父子关系映射
const menuParentMap = ref<Record<string, string>>({})
const menuChildrenMap = ref<Record<string, string[]>>({})

// 子系统菜单的父子关系映射（按subsystem code分开存储）
const subsystemParentMap = ref<Record<string, Record<string, string>>>({})
const subsystemChildrenMap = ref<Record<string, Record<string, string[]>>>({})

// 构建父子关系映射
const buildParentChildMap = (flatList: MenuFlatItem[], subsystemCode?: string) => {
  const parentMap: Record<string, string> = {}
  const childrenMap: Record<string, string[]> = {}
  for (const item of flatList) {
    if (item.parentId) {
      parentMap[item.id] = item.parentId
      if (!childrenMap[item.parentId]) {
        childrenMap[item.parentId] = []
      }
      childrenMap[item.parentId].push(item.id)
    }
  }

  if (subsystemCode) {
    // 存储子系统映射
    subsystemParentMap.value[subsystemCode] = parentMap
    subsystemChildrenMap.value[subsystemCode] = childrenMap
  } else {
    // 存储平台映射
    menuParentMap.value = parentMap
    menuChildrenMap.value = childrenMap
  }
}

// 获取当前激活tab的父子关系映射
const getCurrentParentMap = (subsystemCode?: string) => {
  if (subsystemCode) {
    return subsystemParentMap.value[subsystemCode] || {}
  }
  return menuParentMap.value
}

const getCurrentChildrenMap = (subsystemCode?: string) => {
  if (subsystemCode) {
    return subsystemChildrenMap.value[subsystemCode] || {}
  }
  return menuChildrenMap.value
}

// 初始化平台菜单的父子关系
const initPlatformMenuParentChild = () => {
  if (platformMenus.value && platformMenus.value.length > 0) {
    const flatList = toFlatList(platformMenus.value)
    console.log('initPlatformMenuParentChild: flatList length:', flatList.length)
    buildParentChildMap(flatList)
    console.log('after buildParentChildMap: parentMap keys:', Object.keys(menuParentMap.value).slice(0, 5))
    console.log('after buildParentChildMap: childrenMap keys:', Object.keys(menuChildrenMap.value).slice(0, 5))
  }
}

const isMenuChecked = (menuId: string) => {
  return selectedMenuIds.value.includes(menuId)
}

const isMenuIndeterminate = (menuId: string, subsystemCode?: string) => {
  const childrenMap = getCurrentChildrenMap(subsystemCode)
  const children = childrenMap[menuId]
  if (!children || children.length === 0) return false
  const checkedCount = children.filter(id => selectedMenuIds.value.includes(id)).length
  return checkedCount > 0 && checkedCount < children.length
}

const handleMenuCheckChange = (item: MenuFlatItem, checked: any, subsystemCode?: string) => {
  const isChecked = Boolean(checked)

  // 使用对应的父子关系映射
  const parentMap = getCurrentParentMap(subsystemCode)
  const childrenMap = getCurrentChildrenMap(subsystemCode)

  // 递归获取所有子孙ID
  const getAllDescendants = (menuId: string): string[] => {
    const result: string[] = []
    const children = childrenMap[menuId]
    if (children && children.length > 0) {
      for (const childId of children) {
        result.push(childId)
        result.push(...getAllDescendants(childId))
      }
    }
    return result
  }

  // 递归获取所有祖先ID
  const getAllAncestors = (menuId: string): string[] => {
    const result: string[] = []
    let current = menuId
    while (parentMap[current]) {
      const parentId = parentMap[current]
      result.push(parentId)
      current = parentId
    }
    return result
  }

  if (isChecked) {
    // 勾选时，勾选当前菜单及其所有子孙，同时勾选所有祖先
    const descendants = getAllDescendants(item.id)
    const ancestors = getAllAncestors(item.id)
    for (const id of [item.id, ...descendants, ...ancestors]) {
      if (!selectedMenuIds.value.includes(id)) {
        selectedMenuIds.value.push(id)
      }
    }
  } else {
    // 取消勾选时取消当前菜单及其所有子孙
    const descendants = getAllDescendants(item.id)
    for (const id of [item.id, ...descendants]) {
      const idx = selectedMenuIds.value.indexOf(id)
      if (idx > -1) selectedMenuIds.value.splice(idx, 1)
    }
  }
}

const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined
})

const roleForm = reactive<RoleForm>({
  name: '',
  code: '',
  description: '',
  status: 1
})

const dataScopeForm = reactive({
  scopeType: 'all' as 'all' | 'dept' | 'dept_and_child' | 'self',
  deptIds: [] as string[]
})

const selectedSubsystemIds = ref<string[]>([])

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '角色编码必须为小写字母和下划线', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

onMounted(async () => {
  await loadSubsystems()
  await Promise.all([loadData(), loadMenus(), loadOrgTree()])
})

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  pagination.page = 1
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await roleApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status
    } as any) as any
    // API返回结构: { code: 0, data: { data: [...], total: 3 } }
    const list = res.data?.data?.data || res.data?.data || []
    roleList.value = Array.isArray(list) ? list : []
    pagination.total = Number(res.data?.data?.total) || 0
  } finally {
    loading.value = false
  }
}

const loadMenus = async () => {
  // 清空按钮权限映射
  menuButtonMap.value = {}

  // Load platform menus
  const platformRes = await menuApi.getTree('') as any
  platformMenus.value = platformRes.data?.data || platformRes.data || []

  // 使用原始列表构建父子关系映射（包含所有菜单，包括按钮类型）
  const allFlatList = toFlatList(platformMenus.value)
  initPlatformMenuParentChild()

  // 提取按钮类型的子菜单
  allFlatList.forEach((item: any) => {
    if (item.type === 'button' && item.parentId) {
      if (!menuButtonMap.value[item.parentId]) {
        menuButtonMap.value[item.parentId] = []
      }
      menuButtonMap.value[item.parentId].push(item)
    }
  })

  // Load menus for each subsystem dynamically
  const subs = subsystemList.value
  if (Array.isArray(subs)) {
    for (const sub of subs) {
      const res = await menuApi.getTree(sub.code) as any
      const menus = res.data?.data || res.data || []
      subsystemMenusMap.value[sub.code] = menus
      // Generate flat list for subsystem
      const flatList = toFlatList(menus)
      subsystemMenuFlatMap.value[sub.code] = flatList
      // 构建子系统菜单的父子关系映射（传入subsystem code）
      buildParentChildMap(flatList, sub.code)
    }
  }
}

const loadSubsystems = async () => {
  const res = await subsystemApi.getAll() as any
  // API返回结构: { data: { data: [...], total: number } }
  const list = res.data?.data?.data || res.data?.data || res.data || []
  subsystemList.value = list
}

const loadOrgTree = async () => {
  try {
    const res = await organizationApi.getTree() as any
    orgTree.value = res.data?.data || res.data || []
  } catch (e) {
    orgTree.value = []
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(roleForm, {
    id: undefined,
    name: '',
    code: '',
    description: '',
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: Role) => {
  isEdit.value = true
  roleForm.id = row.id
  roleForm.name = row.name
  roleForm.code = row.code
  roleForm.description = row.description || ''
  roleForm.status = row.status
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await roleApi.update(roleForm.id!, roleForm)
      ElMessage.success('角色更新成功')
    } else {
      await roleApi.create(roleForm)
      ElMessage.success('角色创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleAssignMenus = async (row: Role) => {
  currentRoleId.value = row.id

  // Ensure menus are loaded
  if (platformMenus.value.length === 0) {
    await loadMenus()
  }

  // Always rebuild parent-child map before opening dialog
  const allFlatList = toFlatList(platformMenus.value)
  console.log('handleAssignMenus: allFlatList length:', allFlatList.length)
  buildParentChildMap(allFlatList)

  // Rebuild subsystem parent-child maps
  for (const code of Object.keys(subsystemMenuFlatMap.value)) {
    const flatList = subsystemMenuFlatMap.value[code]
    if (flatList && flatList.length > 0) {
      buildParentChildMap(flatList, code)
    }
  }

  // Load role's current menus
  const res = await roleApi.getMenuTree(row.id) as any
  const menuData = res.data?.data || res.data || []

  // Get all role menu IDs (no filtering - we need all platform + subsystem IDs)
  const checkedIds = getAllCheckedIds(menuData)
  console.log('role menu IDs:', checkedIds.length, checkedIds.slice(0, 10))

  // Just use all the IDs - don't filter
  selectedMenuIds.value = checkedIds
  menusDialogVisible.value = true

  await nextTick()
}

const getAllCheckedIds = (menus: any[]): string[] => {
  if (!Array.isArray(menus)) {
    console.log('getAllCheckedIds: menus is not an array', menus)
    return []
  }

  // 检查是否是树结构（有 checked 属性）
  const isTree = menus.length > 0 && menus[0].hasOwnProperty('checked')

  if (isTree) {
    // 树结构：遍历提取checked的ID
    const ids: string[] = []
    const traverse = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return
      nodes.forEach((node) => {
        if (node.checked) {
          ids.push(node.id)
        }
        if (node.children) {
          traverse(node.children)
        }
      })
    }
    traverse(menus)
    console.log('getAllCheckedIds from tree result:', ids)
    return ids
  } else {
    // 扁平结构：返回所有菜单ID（当前角色拥有的所有菜单权限）
    console.log('getAllCheckedIds from flat list result:', menus.map(m => m.id))
    return menus.map(m => m.id)
  }
}

const handleMenusSubmit = async () => {
  // Filter out button permissions (those containing ":") - only keep menu IDs
  const menuIds = selectedMenuIds.value.filter(id => !id.includes(':'))

  submitLoading.value = true
  try {
    await roleApi.assignMenus(currentRoleId.value, { menuIds })
    ElMessage.success('菜单权限分配成功')
    menusDialogVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

const handleAssignSubsystems = async (row: Role) => {
  currentRoleId.value = row.id
  subsystemsDialogVisible.value = true

  const res = await roleApi.getSubsystems(row.id) as any
  console.log('getSubsystems raw res:', res)
  console.log('getSubsystems res.data:', res.data)
  // If data has .data property, extract it
  const data = res.data?.data || res.data
  console.log('subsystem data:', data)
  // Map to IDs
  selectedSubsystemIds.value = (data || []).map((s: any) => s.id)
  console.log('selected subsystem IDs:', selectedSubsystemIds.value)
}

const handleSubsystemsSubmit = async () => {
  submitLoading.value = true
  try {
    await roleApi.assignSubsystems(currentRoleId.value, {
      subsystemIds: selectedSubsystemIds.value
    })
    ElMessage.success('子系统分配成功')
    subsystemsDialogVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

const handleDataScope = async (row: Role) => {
  currentRoleId.value = row.id
  dataScopeDialogVisible.value = true

  const res = await roleApi.getDataPermissions(row.id) as any
  const data = res.data?.data || res.data
  // Reset form first
  Object.assign(dataScopeForm, {
    scopeType: 'all',
    deptIds: []
  })
  // Then assign retrieved data
  if (data) {
    dataScopeForm.scopeType = data.scopeType || 'all'
    dataScopeForm.deptIds = data.deptIds || []
  }
}

const handleDataScopeSubmit = async () => {
  submitLoading.value = true
  try {
    await roleApi.setDataPermissions(currentRoleId.value, dataScopeForm)
    ElMessage.success('数据范围配置成功')
    dataScopeDialogVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await roleApi.delete(row.id)
    ElMessage.success('角色删除成功')
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}
</script>

<style scoped>
.role-management {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.table-container {
  padding: 0;
}

.table-container .el-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.menu-tree-container {
  max-height: 400px;
  overflow-y: auto;
}

.menu-hierarchy-container {
  max-height: 400px;
  overflow-y: auto;
}

.menu-hierarchy-list {
  padding: 8px 0;
}

.menu-item-line {
  padding: 4px 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.menu-item-line:hover {
  background-color: #f5f7fa;
}

.menu-item-line .el-checkbox {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
}

.menu-item-line .el-checkbox__label {
  display: inline-block;
  line-height: 1;
}

/* 选中不高亮显示蓝色 */
.menu-item-line .el-checkbox__input.is-checked + .el-checkbox__label {
  color: #303133;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 12px;
}

.permission-tags .el-checkbox {
  color: #409eff;
}

.permission-tags .el-checkbox:first-child {
  margin-left: 12px;
}

.button-items .el-checkbox__label {
  color: #409eff;
}

.permission-tags {
  display: inline !important;
  vertical-align: middle;
}

.permission-tags .perm-tag {
  display: inline !important;
  margin-right: 4px;
  padding: 1px 6px;
  font-size: 12px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 2px;
}

.subsystem-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.el-checkbox {
  margin-right: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.action-buttons .el-button {
  margin: 0;
}
</style>
