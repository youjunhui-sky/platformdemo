<template>
  <div class="audit-log">
    <div class="page-header">
      <h1 class="page-title">Audit Log</h1>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalCount }}</div>
        <div class="stat-label">Total Logs</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.successCount }}</div>
        <div class="stat-label">Success</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ stats.failCount }}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.todayCount }}</div>
        <div class="stat-label">Today</div>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="Module">
          <el-input v-model="searchForm.module" placeholder="Enter module name" clearable />
        </el-form-item>
        <el-form-item label="Operation">
          <el-input v-model="searchForm.businessType" placeholder="Enter operation type" clearable />
        </el-form-item>
        <el-form-item label="Operator">
          <el-input v-model="searchForm.operatorName" placeholder="Enter operator name" clearable />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="searchForm.status" placeholder="All" clearable>
            <el-option label="Success" :value="1" />
            <el-option label="Failed" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="Date Range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="To"
            start-placeholder="Start date"
            end-placeholder="End date"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            Search
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            Reset
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <AuditLogTable
      :data="logList"
      :loading="loading"
      :total="pagination.total"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      @size-change="loadData"
      @current-change="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { auditApi } from '@/api/audit'
import AuditLogTable from '@/components/audit/AuditLogTable.vue'
import type { AuditLog, AuditStats } from '@/types'

const loading = ref(false)
const logList = ref<AuditLog[]>([])
const dateRange = ref<[string, string] | null>(null)

const stats = reactive<AuditStats>({
  totalCount: 0,
  successCount: 0,
  failCount: 0,
  todayCount: 0,
  weekData: [],
  moduleStats: []
})

const searchForm = reactive({
  module: '',
  businessType: '',
  operatorName: '',
  status: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

onMounted(async () => {
  await Promise.all([loadData(), loadStats()])
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await auditApi.getLogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      module: searchForm.module || undefined,
      businessType: searchForm.businessType || undefined,
      operatorName: searchForm.operatorName || undefined,
      status: searchForm.status,
      startDate: dateRange.value?.[0] || undefined,
      endDate: dateRange.value?.[1] || undefined
    })
    logList.value = res.data.list
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await auditApi.getStats()
    Object.assign(stats, res.data)
  } catch (e) {
    // Ignore stats error
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.module = ''
  searchForm.businessType = ''
  searchForm.operatorName = ''
  searchForm.status = undefined
  dateRange.value = null
  handleSearch()
}
</script>

<style scoped>
.audit-log {
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.stat-card.danger .stat-value {
  color: #f56c6c;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-form {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
