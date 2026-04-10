<template>
  <div class="pacs-index">
    <div class="page-header">
      <h1>PACS 医学影像系统</h1>
      <p class="subtitle">Picture Archiving and Communication System</p>
    </div>

    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon waiting">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">18</div>
                <div class="stat-label">待检查</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon today">
                <el-icon><Checked /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">45</div>
                <div class="stat-label">今日完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon urgent">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">2</div>
                <div class="stat-label">急诊</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon report">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">8</div>
                <div class="stat-label">待书写报告</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>检查任务</span>
          <el-button type="primary" size="small">新建预约</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe>
        <el-table-column prop="studyNo" label="检查号" width="140" />
        <el-table-column prop="patientName" label="患者姓名" width="100" />
        <el-table-column prop="modality" label="检查类型" width="100" />
        <el-table-column prop="bodyPart" label="检查部位" width="120" />
        <el-table-column prop="device" label="设备" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scheduledTime" label="预约时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button type="primary" link>查看影像</el-button>
            <el-button type="primary" link>书写报告</el-button>
            <el-button type="primary" link>查看报告</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Clock, Checked, Warning, Document } from '@element-plus/icons-vue'

const tableData = [
  {
    studyNo: 'MR20240406001',
    patientName: '张三',
    modality: 'MRI',
    bodyPart: '颅脑',
    device: 'MRI-1',
    status: '待检查',
    scheduledTime: '2024-04-06 10:00:00'
  },
  {
    studyNo: 'CT20240406002',
    patientName: '李四',
    modality: 'CT',
    bodyPart: '胸部',
    device: 'CT-1',
    status: '已完成',
    scheduledTime: '2024-04-06 09:30:00'
  },
  {
    studyNo: 'DR20240406003',
    patientName: '王五',
    modality: 'DR',
    bodyPart: '腹部',
    device: 'DR-1',
    status: '急诊',
    scheduledTime: '2024-04-06 11:00:00'
  }
]

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    '待检查': 'warning',
    '检查中': 'primary',
    '已完成': 'success',
    '待书写': 'warning',
    '急诊': 'danger'
  }
  return map[status] || ''
}
</script>

<style scoped>
.pacs-index {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.statistics-cards {
  margin-bottom: 24px;
}

.stat-card {
  margin-bottom: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.stat-icon.waiting {
  background: #e6a23c;
  color: #fff;
}

.stat-icon.today {
  background: #67c23a;
  color: #fff;
}

.stat-icon.urgent {
  background: #f56c6c;
  color: #fff;
}

.stat-icon.report {
  background: #909399;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>