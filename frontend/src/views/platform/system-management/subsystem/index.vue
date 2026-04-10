<template>
  <div class="subsystem-management">
    <div class="page-header">
      <h1 class="page-title">子系统管理</h1>
      <div class="header-actions">
        <PermissionButton type="primary" permission="subsystem:create" show-disabled @click="handleAdd">
          <el-icon><Plus /></el-icon>
          注册子系统
        </PermissionButton>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="subsystemList"
        border
        :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="code" label="子系统编码" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="子系统名称" min-width="180">
          <template #default="{ row }">
            <div class="subsystem-name">
              <img v-if="row.logoUrl" :src="row.logoUrl" class="subsystem-logo" />
              <img v-else :src="getIcon(row.code)" class="subsystem-logo" :style="{ backgroundColor: getColor(row.code) + '20', padding: '4px', borderRadius: '4px' }" />
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <PermissionButton type="primary" link permission="subsystem:update" show-disabled @click="handleEdit(row)">
              编辑
            </PermissionButton>
            <PermissionButton
              :type="row.status === 'active' ? 'warning' : 'success'"
              link
              show-disabled
              :permission="row.status === 'active' ? 'subsystem:disable' : 'subsystem:enable'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </PermissionButton>
           
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

    <!-- Subsystem Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="subsystemForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="子系统编码" prop="code">
          <el-input v-model="subsystemForm.code" placeholder="如：HIS, LIS" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="子系统名称" prop="name">
          <el-input v-model="subsystemForm.name" placeholder="请输入子系统名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="subsystemForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="图标" prop="logoUrl">
          <div class="logo-selector">
            <div class="logo-options">
              <div
                v-for="icon in iconOptions"
                :key="icon.code"
                class="logo-option"
                :class="{ active: subsystemForm.logoUrl === icon.url }"
                @click="subsystemForm.logoUrl = icon.url"
              >
                <img :src="icon.url" :alt="icon.name" />
              </div>
            </div>
            <div class="logo-custom">
              <el-input v-model="subsystemForm.logoUrl" placeholder="或输入自定义Logo图片地址" clearable>
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="subsystemForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Secret Dialog -->
    <el-dialog v-model="secretDialogVisible" title="新密钥" width="500px" destroy-on-close>
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>
          请复制并妥善保存此密钥，过后将无法再次查看。
        </template>
      </el-alert>
      <div class="secret-display">
        <el-input v-model="newSecret" type="textarea" :rows="3" readonly />
        <el-button type="primary" @click="copySecret">
          <el-icon><DocumentCopy /></el-icon>
          复制
        </el-button>
      </div>
      <template #footer>
        <el-button type="primary" @click="secretDialogVisible = false">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, DocumentCopy, Link } from '@element-plus/icons-vue'
import { subsystemApi } from '@/api/subsystem'
import PermissionButton from '@/components/permission/PermissionButton.vue'
import type { Subsystem, SubsystemForm } from '@/types'
import { getSubsystemIcon, getSubsystemColor } from '@/utils/subsystem-icon'

const loading = ref(false)
const submitLoading = ref(false)
const subsystemList = ref<Subsystem[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})
const dialogVisible = ref(false)
const secretDialogVisible = ref(false)
const isEdit = ref(false)
const newSecret = ref('')

const formRef = ref<FormInstance>()

const subsystemForm = reactive<SubsystemForm>({
  code: '',
  name: '',
  description: '',
  logoUrl: '',
  status: 'active'
})

const formRules: FormRules = {
  code: [
    { required: true, message: '请输入子系统编码', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入子系统名称', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => (isEdit.value ? '编辑子系统' : '注册子系统'))

// Helper functions for icon mapping
const getIcon = (code: string) => getSubsystemIcon(code)
const getColor = (code: string) => getSubsystemColor(code)

// Logo图标选项
const iconOptions = [
  { code: 'HIS', name: 'HIS医院', url: '/images/subsystems/HIS.svg' },
  { code: 'LIS', name: 'LIS检验', url: '/images/subsystems/LIS.svg' },
  { code: 'PACS', name: 'PACS影像', url: '/images/subsystems/PACS.svg' },
  { code: 'EMR', name: 'EMR病历', url: '/images/subsystems/EMR.svg' },
  { code: 'PASS', name: 'PASS用药', url: '/images/subsystems/PASS.svg' },
  { code: 'HRMS', name: 'HRMS人力', url: '/images/subsystems/HRMS.svg' },
  { code: 'OA', name: 'OA办公', url: '/images/subsystems/OA.svg' },
  { code: 'RIS', name: 'RIS放射', url: '/images/subsystems/PACS.svg' },
  { code: 'CIS', name: 'CIS临床', url: '/images/subsystems/EMR.svg' },
]

// 根据编码自动匹配图标的观察者
watch(
  () => subsystemForm.code,
  (newCode) => {
    if (!newCode || isEdit.value) return
    const matched = iconOptions.find(opt => opt.code === newCode.toUpperCase())
    if (matched) {
      subsystemForm.logoUrl = matched.url
    }
  }
)

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await subsystemApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize
    }) as any
    // API返回结构: { code: 0, data: { data: [...], total: 3 } }
    const list = res.data?.data?.data || res.data?.data || res.data?.list || []
    subsystemList.value = Array.isArray(list) ? list : []
    pagination.total = Number(res.data?.data?.total) || 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(subsystemForm, {
    id: undefined,
    code: '',
    name: '',
    description: '',
    logoUrl: '',
    status: 'active'
  })
  dialogVisible.value = true
}

const handleEdit = (row: Subsystem) => {
  isEdit.value = true
  subsystemForm.id = row.id
  subsystemForm.code = row.code
  subsystemForm.name = row.name
  subsystemForm.description = row.description || ''
  subsystemForm.logoUrl = row.logoUrl || ''
  subsystemForm.status = row.status
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
      await subsystemApi.update(subsystemForm.id!, subsystemForm)
      ElMessage.success('子系统更新成功')
    } else {
      await subsystemApi.create(subsystemForm)
      ElMessage.success('子系统注册成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row: Subsystem) => {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}该子系统吗？`, '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await subsystemApi.updateStatus(row.id, newStatus)
    ElMessage.success(`子系统${action}成功`)
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}

const handleRotateSecret = async (row: Subsystem) => {
  try {
    await ElMessageBox.confirm('确定要重新生成密钥吗？旧密钥将失效。', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await subsystemApi.rotateSecret(row.id)
    newSecret.value = res.data.secret
    secretDialogVisible.value = true
  } catch (e) {
    // User cancelled or error
  }
}

const copySecret = async () => {
  try {
    await navigator.clipboard.writeText(newSecret.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const handleDelete = async (row: Subsystem) => {
  try {
    await ElMessageBox.confirm('确定要删除该子系统吗？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await subsystemApi.delete(row.id)
    ElMessage.success('子系统删除成功')
    loadData()
  } catch (e) {
    // User cancelled or error
  }
}
</script>

<style scoped>
.subsystem-management {
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

.subsystem-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subsystem-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.logo-selector {
  width: 100%;
}

.logo-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.logo-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.logo-option:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.logo-option.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.logo-option img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.icon-label {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.logo-custom {
  margin-top: 8px;
}

.secret-display {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.secret-display .el-input {
  flex: 1;
}
</style>