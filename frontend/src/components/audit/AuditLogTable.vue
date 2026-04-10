<template>
  <div class="audit-log-table">
    <el-table
      v-loading="loading"
      :data="data"
      stripe
      border
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
    >
      <el-table-column type="index" label="No." width="60" align="center" />
      <el-table-column prop="module" label="Module" width="120" show-overflow-tooltip />
      <el-table-column prop="businessType" label="Operation Type" width="120" show-overflow-tooltip />
      <el-table-column prop="method" label="Method" width="100" show-overflow-tooltip />
      <el-table-column prop="operatorName" label="Operator" width="120" />
      <el-table-column prop="deptName" label="Department" width="120" show-overflow-tooltip />
      <el-table-column prop="requestUrl" label="URL" min-width="200" show-overflow-tooltip />
      <el-table-column prop="requestIp" label="IP Address" width="130" />
      <el-table-column prop="costTime" label="Duration (ms)" width="100" align="center">
        <template #default="{ row }">
          <span :class="{ 'cost-high': row.costTime > 1000 }">
            {{ row.costTime }}ms
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? 'Success' : 'Failed' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="Time" width="180" />
      <el-table-column label="Actions" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleView(row)">
            View
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <el-dialog v-model="dialogVisible" title="Log Details" width="800px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="Module">
          {{ currentLog?.module }}
        </el-descriptions-item>
        <el-descriptions-item label="Business Type">
          {{ currentLog?.businessType }}
        </el-descriptions-item>
        <el-descriptions-item label="Method">
          {{ currentLog?.method }}
        </el-descriptions-item>
        <el-descriptions-item label="Request Method">
          {{ currentLog?.requestMethod }}
        </el-descriptions-item>
        <el-descriptions-item label="Operator">
          {{ currentLog?.operatorName }}
        </el-descriptions-item>
        <el-descriptions-item label="Department">
          {{ currentLog?.deptName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP Address">
          {{ currentLog?.requestIp }}
        </el-descriptions-item>
        <el-descriptions-item label="Location">
          {{ currentLog?.requestLocation || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag :type="currentLog?.status === 1 ? 'success' : 'danger'">
            {{ currentLog?.status === 1 ? 'Success' : 'Failed' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Duration">
          {{ currentLog?.costTime }}ms
        </el-descriptions-item>
        <el-descriptions-item label="Request URL" :span="2">
          {{ currentLog?.requestUrl }}
        </el-descriptions-item>
        <el-descriptions-item label="Request Parameters" :span="2">
          <pre class="json-content">{{ currentLog?.methodParam || '{}' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentLog?.errorMsg" label="Error Message" :span="2">
          <span class="error-text">{{ currentLog?.errorMsg }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="Time" :span="2">
          {{ currentLog?.createTime }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AuditLog } from '@/types'

interface Props {
  data: AuditLog[]
  loading?: boolean
  total?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  total: 0
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  view: [log: AuditLog]
}>()

const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const currentLog = ref<AuditLog | null>(null)

const handleSizeChange = (size: number) => {
  emit('update:pageSize', size)
}

const handleCurrentChange = (page: number) => {
  emit('update:currentPage', page)
}

const handleView = (log: AuditLog) => {
  currentLog.value = log
  dialogVisible.value = true
  emit('view', log)
}
</script>

<style scoped>
.audit-log-table {
  width: 100%;
}

.cost-high {
  color: #f56c6c;
  font-weight: 600;
}

.json-content {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-text {
  color: #f56c6c;
}

.el-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
