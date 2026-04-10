<template>
  <div class="dict-container">
    <div class="dict-sidebar">
      <div class="sidebar-header">
        <h3>字典类型</h3>
        <el-button type="primary" size="small" @click="openTypeDialog()">
          新增类型
        </el-button>
      </div>
      <el-scrollbar class="sidebar-scroll">
        <div
          v-for="type in dictTypes"
          :key="type.id"
          :class="['type-item', { active: selectedTypeId === type.id }]"
          @click="selectType(type)"
        >
          <span class="type-name">{{ type.name }}</span>
          <span class="type-key">{{ type.key }}</span>
          <div class="type-actions">
            <el-icon @click.stop="openTypeDialog(type)"><Edit /></el-icon>
            <el-icon @click.stop="confirmDeleteType(type)"><Delete /></el-icon>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="dict-main">
      <div class="main-header">
        <div class="header-left">
          <h3>{{ selectedTypeName || '请选择字典类型' }}</h3>
          <span class="dict-count">共 {{ dictInfos.length }} 条</span>
        </div>
        <div class="header-right">
          <el-button type="primary" :disabled="!selectedTypeId" @click="openInfoDialog()">
            新增字典
          </el-button>
        </div>
      </div>

      <el-table :data="paginatedInfos" row-key="id" v-loading="loading">
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column prop="value" label="值" min-width="150" />
        <el-table-column prop="orderNum" label="排序" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openInfoDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="confirmDeleteInfo(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="dictInfos.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 字典类型弹窗 -->
    <el-dialog v-model="typeDialogVisible" :title="editingType ? '编辑类型' : '新增类型'" width="400px">
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="标识" prop="key">
          <el-input v-model="typeForm.key" placeholder="请输入标识" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitType" :loading="typeLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- ���典数据弹窗 -->
    <el-dialog v-model="infoDialogVisible" :title="editingInfo ? '编辑字典' : '新增字典'" width="500px">
      <el-form ref="infoFormRef" :model="infoForm" :rules="infoRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="infoForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model="infoForm.value" placeholder="请输入值" />
        </el-form-item>
        <el-form-item label="排序" prop="orderNum">
          <el-input-number v-model="infoForm.orderNum" :min="0" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="infoForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="infoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInfo" :loading="infoLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'
import { dictApi, type DictType, type DictInfo, type DictTypeForm, type DictInfoForm } from '@/api/dict'

// 数据
const loading = ref(false)
const dictTypes = ref<DictType[]>([])
const dictInfos = ref<DictInfo[]>([])
const selectedTypeId = ref('')
const selectedTypeName = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 弹窗状态
const typeDialogVisible = ref(false)
const typeLoading = ref(false)
const typeFormRef = ref<FormInstance>()
const editingType = ref<DictType | null>(null)
const typeForm = reactive<DictTypeForm>({
  name: '',
  key: ''
})

const typeRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  key: [{ required: true, message: '请输入标识', trigger: 'blur' }]
}

const infoDialogVisible = ref(false)
const infoLoading = ref(false)
const infoFormRef = ref<FormInstance>()
const editingInfo = ref<DictInfo | null>(null)
const parentInfo = ref<DictInfo | null>(null)
const infoForm = reactive<DictInfoForm>({
  name: '',
  value: '',
  typeId: '',
  parentId: '',
  orderNum: 0,
  remark: ''
})

const infoRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

// 计算属性
const paginatedInfos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return dictInfos.value.slice(start, end)
})

// 方法
async function loadTypes() {
  try {
    const res = await dictApi.getTypes()
    dictTypes.value = (res as any).data?.data || []
  } catch (e) {
    console.error('加载类型失败:', e)
  }
}

async function loadInfos(typeId: string) {
  loading.value = true
  try {
    const res = await dictApi.getDictInfosByType(typeId)
    dictInfos.value = (res as any).data?.data || []
  } catch (e) {
    console.error('加载字典失败:', e)
  } finally {
    loading.value = false
  }
}

function selectType(type: DictType) {
  selectedTypeId.value = type.id
  selectedTypeName.value = type.name
  currentPage.value = 1
  loadInfos(type.id)
}

function openTypeDialog(type?: DictType) {
  editingType.value = type || null
  if (type) {
    typeForm.name = type.name
    typeForm.key = type.key
  } else {
    typeForm.name = ''
    typeForm.key = ''
  }
  typeDialogVisible.value = true
}

async function submitType() {
  if (!typeFormRef.value) return

  await typeFormRef.value.validate()
  typeLoading.value = true

  try {
    const data = {
      name: String(typeForm.name),
      key: String(typeForm.key)
    }
    if (editingType.value) {
      await dictApi.updateType(editingType.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await dictApi.createType(data)
      ElMessage.success('创建成功')
    }
    typeDialogVisible.value = false
    await loadTypes()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    typeLoading.value = false
  }
}

async function confirmDeleteType(type: DictType) {
  try {
    await ElMessageBox.confirm(
      '确定要删除此类型吗？相关的字典数据也会被删除。',
      '提示',
      { type: 'warning' }
    )
    await dictApi.deleteType(type.id)
    ElMessage.success('删除成功')
    if (selectedTypeId.value === type.id) {
      selectedTypeId.value = ''
      selectedTypeName.value = ''
      dictInfos.value = []
    }
    await loadTypes()
  } catch (e) {
    // 用户取消
  }
}

function openInfoDialog(info?: DictInfo, parent?: DictInfo) {
  editingInfo.value = info || null
  parentInfo.value = parent || null

  if (info) {
    infoForm.name = info.name
    infoForm.value = info.value || ''
    infoForm.typeId = info.typeId
    infoForm.parentId = info.parentId || ''
    infoForm.orderNum = info.orderNum || 0
    infoForm.remark = info.remark || ''
  } else if (parent) {
    infoForm.name = ''
    infoForm.value = ''
    infoForm.typeId = selectedTypeId.value
    infoForm.parentId = parent.id
    infoForm.orderNum = 0
    infoForm.remark = ''
  } else {
    infoForm.name = ''
    infoForm.value = ''
    infoForm.typeId = selectedTypeId.value
    infoForm.parentId = ''
    infoForm.orderNum = 0
    infoForm.remark = ''
  }
  infoDialogVisible.value = true
}

async function submitInfo() {
  if (!infoFormRef.value) return

  await infoFormRef.value.validate()
  infoLoading.value = true

  try {
    const data = {
      name: infoForm.name,
      value: infoForm.value,
      typeId: selectedTypeId.value,
      parentId: infoForm.parentId || undefined,
      orderNum: infoForm.orderNum,
      remark: infoForm.remark
    }
    if (editingInfo.value) {
      await dictApi.updateDictInfo(editingInfo.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await dictApi.createDictInfo(data)
      ElMessage.success('创建成功')
    }
    infoDialogVisible.value = false
    await loadInfos(selectedTypeId.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    infoLoading.value = false
  }
}

async function confirmDeleteInfo(info: DictInfo) {
  try {
    await ElMessageBox.confirm(
      '确定要删除此项目吗？',
      '提示',
      { type: 'warning' }
    )
    await dictApi.deleteDictInfo(info.id)
    ElMessage.success('删除成功')
    await loadInfos(selectedTypeId.value)
  } catch (e) {
    // 用户取消
  }
}

onMounted(() => {
  loadTypes()
})
</script>

<style scoped>
.dict-container {
  display: flex;
  height: 100%;
  background: #fff;
  border-radius: 4px;
}

.dict-sidebar {
  width: 280px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
}

.type-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.type-item:hover {
  background-color: #f5f7fa;
}

.type-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.type-name {
  font-weight: 500;
  color: #303133;
}

.type-key {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.type-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.type-item:hover .type-actions {
  opacity: 1;
}

.dict-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.dict-count {
  font-size: 14px;
  color: #909399;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #fafafa;
}
</style>