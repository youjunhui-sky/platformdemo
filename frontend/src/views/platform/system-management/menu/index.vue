<template>
  <div class="menu-management">
    <div class="page-header">
      <h1 class="page-title">菜单管理</h1>
      <div class="header-actions">
        <PermissionButton type="primary" permission="menu:create" show-disabled @click="handleAdd(null)">
          <el-icon><Plus /></el-icon>
          新增菜单
        </PermissionButton>
      </div>
    </div>

    <div class="subsystem-tabs">
      <el-radio-group v-model="currentSubsystem" @change="handleSubsystemChange">
        <el-radio-button value="">平台</el-radio-button>
        <el-radio-button value="his">HIS</el-radio-button>
        <el-radio-button value="lis">LIS</el-radio-button>
        <el-radio-button value="pacs">PACS</el-radio-button>
      </el-radio-group>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="menuTree"
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
        default-expand-all
      >
        <el-table-column prop="name" label="菜单名称" width="200">
          <template #default="{ row }">
            <el-icon v-if="row.icon" class="menu-icon">
              <component :is="getIcon(row.icon)" />
            </el-icon>
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="200" show-overflow-tooltip />
        <el-table-column prop="component" label="组件" width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permission" label="权限标识" width="180" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="isVisible" label="显示" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isVisible === true || row.isVisible === 1 ? 'success' : 'danger'" size="small">
              {{ row.isVisible === true || row.isVisible === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <PermissionButton type="primary" link permission="menu:create" size="small" show-disabled @click="handleAdd(row)">
              新增子级
            </PermissionButton>
            <PermissionButton type="primary" link permission="menu:update" show-disabled @click="handleEdit(row)">
              编辑
            </PermissionButton>
            <PermissionButton type="danger" link permission="menu:delete" show-disabled @click="handleDelete(row)">
              删除
            </PermissionButton>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Menu Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="menuForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="menuForm.parentId"
            :data="menuSelectTree"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            placeholder="请选择上级菜单（不选则为根菜单）"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="menuForm.menuType">
            <el-radio value="catalog">目录</el-radio>
            <el-radio value="menu">菜单</el-radio>
            <el-radio value="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'button'" label="路由路径" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType === 'menu'" label="组件" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径（如 system/user/index）" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'button'" label="图标" prop="icon">
          <el-input v-model="menuForm.icon" placeholder="请输入图标名称">
            <template #append>
              <el-icon><component :is="getIcon(menuForm.icon || '')" /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'catalog'" label="权限标识" prop="permission">
          <el-input v-model="menuForm.permission" placeholder="如：system:user:list" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="menuForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item v-if="menuForm.menuType !== 'button'" label="是否显示" prop="visible">
          <el-radio-group v-model="menuForm.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="menuForm.menuType === 'menu'" label="Keep Alive" prop="keepAlive">
          <el-radio-group v-model="menuForm.keepAlive">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="menuForm.status">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  HomeFilled,
  User,
  Setting,
  Menu as MenuIcon,
  Document,
  Grid,
  List,
  Tools
} from '@element-plus/icons-vue'
import { menuApi } from '@/api/menu'
import PermissionButton from '@/components/permission/PermissionButton.vue'
import type { Menu, MenuForm } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const menuTree = ref<Menu[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentSubsystem = ref('')

const formRef = ref<FormInstance>()

const menuForm = reactive<MenuForm>({
  parentId: null,
  name: '',
  path: '',
  component: '',
  icon: '',
  menuType: 'menu',
  permission: '',
  sort: 0,
  status: 1,
  visible: 1,
  keepAlive: 0
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ],
  menuType: [
    { required: true, message: '请选择菜单类型', trigger: 'change' }
  ]
}

// Add root option to select tree
const menuSelectTree = computed(() => {
  return [
    { id: null, name: '根菜单', children: menuTree.value }
  ]
})

const dialogTitle = computed(() => (isEdit.value ? '编辑菜单' : '新增菜单'))

const iconMap: Record<string, any> = {
  home: HomeFilled,
  user: User,
  setting: Setting,
  menu: MenuIcon,
  document: Document,
  grid: Grid,
  list: List,
  tools: Tools
}

const getIcon = (iconName: string) => {
  return iconMap[iconName] || MenuIcon
}

const getTypeTagType = (type: string) => {
  switch (type) {
    case 'catalog':
      return 'warning'
    case 'menu':
      return 'success'
    case 'button':
      return 'info'
    default:
      return 'info'
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'catalog':
      return '目录'
    case 'menu':
      return '菜单'
    case 'button':
      return '按钮'
    default:
      return type
  }
}

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const subsystem = currentSubsystem.value || undefined
    const res = await menuApi.getTree(subsystem)
    menuTree.value = res.data?.data || res.data || []
  } finally {
    loading.value = false
  }
}

const handleSubsystemChange = () => {
  loadData()
}

const handleAdd = (parent: Menu | null) => {
  isEdit.value = false
  Object.assign(menuForm, {
    id: undefined,
    parentId: parent?.id || null,
    name: '',
    path: '',
    component: '',
    icon: '',
    menuType: parent ? 'menu' : 'catalog',
    permission: '',
    sort: 0,
    status: 1,
    visible: 1,
    keepAlive: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  menuForm.id = row.id
  menuForm.parentId = row.parentId
  menuForm.name = row.name
  menuForm.path = row.path || ''
  menuForm.component = row.component || ''
  menuForm.icon = row.icon || ''
  menuForm.menuType = row.type || 'menu'
  menuForm.permission = row.permission || ''
  menuForm.sort = row.sortOrder || 0
  menuForm.status = row.status
  menuForm.visible = row.isVisible === true || row.isVisible === 1 ? 1 : 0
  menuForm.keepAlive = row.isCache === true || row.isCache === 1 ? 1 : 0
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
      await menuApi.update(menuForm.id!, menuForm)
      ElMessage.success('菜单更新成功')
    } else {
      await menuApi.create(menuForm)
      ElMessage.success('菜单创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: Menu) => {
  if (row.children && row.children.length > 0) {
    ElMessage.warning('请先删除子菜单')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除该菜单吗？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await menuApi.delete(row.id)
    ElMessage.success('菜单删除成功')
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}
</script>

<style scoped>
.menu-management {
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

.subsystem-tabs {
  margin-bottom: 16px;
}

.table-container {
  padding: 0;
}

.menu-icon {
  margin-right: 8px;
  vertical-align: middle;
}
</style>