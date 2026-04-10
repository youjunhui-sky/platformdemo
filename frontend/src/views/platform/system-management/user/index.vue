<template>
  <div class="user-management">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <div class="header-actions">
        <PermissionButton type="primary" permission="user:create" show-disabled @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </PermissionButton>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/姓名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="userList"
        border
        :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column prop="orgName" label="所属科室" width="150" show-overflow-tooltip />
        <el-table-column label="角色" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="role in (row.roles || [])"
              :key="role.id"
              size="small"
              class="mr-4"
            >
              {{ role.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <PermissionButton type="primary" link permission="user:update" show-disabled @click="handleEdit(row)">
                编辑
              </PermissionButton>
              <PermissionButton type="primary" link permission="user:roles" show-disabled @click="handleAssignRoles(row)">
                分配角色
              </PermissionButton>
              <PermissionButton type="warning" link permission="user:reset-password" show-disabled @click="handleResetPassword(row)">
                重置密码
              </PermissionButton>
              <PermissionButton
                :type="row.status === 1 ? 'danger' : 'success'"
                link
                :permission="row.status === 1 ? 'user:disable' : 'user:enable'"
                show-disabled
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </PermissionButton>
              <PermissionButton type="danger" link permission="user:delete" @click="handleDelete(row)">
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

    <!-- User Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="userForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="!!userForm.id" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!userForm.id" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所属科室" prop="orgId">
          <el-tree-select
            v-model="userForm.orgId"
            :data="orgTree"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            placeholder="请选择科室"
            check-strictly
            filterable
          />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="userForm.roleIds" multiple placeholder="请选择角色">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
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

    <!-- Assign Roles Dialog -->
    <el-dialog v-model="rolesDialogVisible" title="分配角色" width="500px" destroy-on-close>
      <el-select v-model="selectedRoleIds" multiple placeholder="请选择角色" style="width: 100%">
        <el-option
          v-for="role in roleList"
          :key="role.id"
          :label="role.name"
          :value="role.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="rolesDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleAssignRolesSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { roleApi } from '@/api/role'
import { organizationApi } from '@/api/organization'
import PermissionButton from '@/components/permission/PermissionButton.vue'
import type { User, UserForm, Role, Organization } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const userList = ref<User[]>([])
const roleList = ref<Role[]>([])
const orgTree = ref<Organization[]>([])
const dialogVisible = ref(false)
const rolesDialogVisible = ref(false)
const isEdit = ref(false)
const currentUserId = ref('')
const selectedRoleIds = ref<string[]>([])

const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const userForm = reactive<UserForm>({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  orgId: '',
  roleIds: [],
  status: 1
})

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码至少6个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => (isEdit.value ? '编辑用户' : '新增用户'))

onMounted(async () => {
  await Promise.all([loadData(), loadRoles(), loadOrgTree()])
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status
    }) as any
    // res.data 是后端返回的 {code: 0, data: [...], meta: {...}}
    // 实际数据在 res.data.data 中
    userList.value = res.data?.data || res.data || []
    pagination.total = Number(res.data?.meta?.total) || 0
  } catch (error) {
    console.error('Failed to load users:', error)
    userList.value = []
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  const res = await roleApi.getList() as any
  roleList.value = res.data?.data || res.data || []
}

const loadOrgTree = async () => {
  try {
    const res = await organizationApi.getTree() as any
    orgTree.value = res.data?.data || res.data || []
  } catch (e) {
    orgTree.value = []
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(userForm, {
    id: undefined,
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    orgId: '',
    roleIds: [],
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  isEdit.value = true
  userForm.id = row.id
  userForm.username = row.username
  userForm.realName = row.realName
  userForm.email = row.email
  userForm.phone = row.phone
  userForm.orgId = row.orgId
  userForm.roleIds = row.roles?.map((r) => r.id) || []
  userForm.status = row.status
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
      await userApi.update(userForm.id!, userForm)
      ElMessage.success('用户更新成功')
    } else {
      await userApi.create(userForm)
      ElMessage.success('用户创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    // Error handled by request interceptor
  } finally {
    submitLoading.value = false
  }
}

const handleAssignRoles = (row: User) => {
  currentUserId.value = row.id
  selectedRoleIds.value = row.roles?.map((r) => r.id) || []
  rolesDialogVisible.value = true
}

const handleAssignRolesSubmit = async () => {
  submitLoading.value = true
  try {
    await userApi.assignRoles(currentUserId.value, selectedRoleIds.value)
    ElMessage.success('角色分配成功')
    rolesDialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleResetPassword = async (row: User) => {
  try {
    await ElMessageBox.confirm('确定要重置该用户密码吗？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userApi.resetPassword(row.id, '123456')
    ElMessage.success('密码已重置为 123456')
  } catch (e) {
    // User cancelled or error
  }
}

const handleToggleStatus = async (row: User) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userApi.updateStatus(row.id, newStatus)
    ElMessage.success(`用户${action}成功`)
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userApi.delete(row.id)
    ElMessage.success('用户删除成功')
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}
</script>

<style scoped>
.user-management {
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

.search-form {
  margin-bottom: 0;
}

.table-container {
  padding: 0;
}

.el-pagination {
  display: flex;
  justify-content: flex-end;
}

.mr-4 {
  margin-right: 4px;
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
