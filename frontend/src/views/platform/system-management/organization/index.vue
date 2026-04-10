<template>
  <div class="organization-management">
    <div class="page-header">
      <h1 class="page-title">机构管理</h1>
      <div class="header-actions">
        <PermissionButton type="primary" permission="organization:create" show-disabled @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增机构
        </PermissionButton>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="机构名称/编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
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
        :data="orgList"
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
      >
        <el-table-column prop="name" label="机构名称" width="200" />
        <el-table-column prop="code" label="机构编码" width="150" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="层级" width="80" align="center" />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <PermissionButton type="primary" link permission="organization:create" size="small" show-disabled @click="handleAdd(row)">
              新增子级
            </PermissionButton>
            <PermissionButton type="primary" link permission="organization:update" show-disabled @click="handleEdit(row)">
              编辑
            </PermissionButton>
            <PermissionButton type="danger" link permission="organization:delete" @click="handleDelete(row)">
              删除
            </PermissionButton>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Organization Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="orgForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="上级机构" prop="parentId">
          <el-tree-select
            v-model="orgForm.parentId"
            :data="orgSelectTree"
            :props="{ label: 'name', value: 'id', children: 'children' } as any"
            placeholder="请选择上级机构（不选则为根机构）"
            clearable
            check-strictly
            :disabled="isParentDisabled"
          />
        </el-form-item>
        <el-form-item label="机构名称" prop="name">
          <el-input v-model="orgForm.name" placeholder="请输入机构名称" />
        </el-form-item>
        <el-form-item label="机构编码" prop="code">
          <el-input v-model="orgForm.code" placeholder="请输入机构编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="orgForm.type" placeholder="请选择类型">
            <el-option label="医院" value="hospital" />
            <el-option label="科室" value="department" />
            <el-option label="病区" value="ward" />
            <el-option label="小组" value="group" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="orgForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="orgForm.status">
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
import { organizationApi } from '@/api/organization'
import PermissionButton from '@/components/permission/PermissionButton.vue'
import type { Organization as OrgType } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const orgList = ref<OrgType[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined
})

const orgForm = reactive({
  id: undefined as string | undefined,
  parentId: null as string | null,
  name: '',
  code: '',
  type: 'department',
  sort: 0,
  status: 1
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入机构名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入机构编码', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑机构' : '新增机构')

const orgSelectTree = ref<any[]>([])

const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    hospital: '医院',
    department: '科室',
    ward: '病区',
    group: '小组'
  }
  return map[type] || type
}

const getTypeTagType = (type: string): string => {
  const map: Record<string, string> = {
    hospital: 'danger',
    department: 'warning',
    ward: 'success',
    group: 'info'
  }
  return map[type] || 'info'
}

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await organizationApi.getTree() as any
    orgList.value = res.data?.data || res.data || []

    // Build select tree
    orgSelectTree.value = [{
      id: '',
      name: '无上级',
      children: orgList.value
    }]
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  loadData()
}

const handleAdd = (row?: any) => {
  isEdit.value = false
  // 记录是否是新增子级（如果是，则不能修改上级）
  const isChild = !!row
  Object.assign(orgForm, {
    id: undefined,
    parentId: row?.id || null,
    name: '',
    code: '',
    type: 'department',
    sort: 0,
    status: 1
  })
  // 如果是新增子级，保存状态用于禁用上级选择
  ;(orgForm as any)._isChild = isChild
  dialogVisible.value = true
}

const isParentDisabled = computed(() => {
  return isEdit.value || (orgForm as any)._isChild === true
})

const handleEdit = (row: any) => {
  isEdit.value = true
  orgForm.id = row.id
  orgForm.parentId = row.parentId
  orgForm.name = row.name
  orgForm.code = row.code
  orgForm.type = row.type
  orgForm.sort = row.sortOrder || 0
  orgForm.status = row.status
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
      await organizationApi.update(orgForm.id!, {
        name: orgForm.name,
        code: orgForm.code,
        type: orgForm.type,
        sortOrder: orgForm.sort,
        status: orgForm.status,
        parentId: orgForm.parentId
      } as any)
      ElMessage.success('机构更新成功')
    } else {
      console.log('Submitting orgForm:', JSON.stringify(orgForm))
      await organizationApi.create({
        name: orgForm.name,
        code: orgForm.code,
        type: orgForm.type,
        sortOrder: orgForm.sort,
        status: orgForm.status,
        parentId: orgForm.parentId
      } as any)
      ElMessage.success('机构创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e: any) {
    console.error('Submit error:', e)
    ElMessage.error(e?.response?.data?.message || '提交失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该机构吗？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await organizationApi.delete(row.id)
    ElMessage.success('机构删除成功')
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}
</script>

<style scoped>
.organization-management {
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.action-buttons .el-button {
  margin: 0;
}

.mr-4 {
  margin-right: 4px;
}
</style>