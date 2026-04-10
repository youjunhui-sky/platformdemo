<template>
  <div class="lis-index">
    <div class="page-header">
      <h1>LIS 实验室信息系统</h1>
      <p class="subtitle">Laboratory Information System</p>
    </div>

    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">28</div>
                <div class="stat-label">待审核</div>
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
                <div class="stat-value">156</div>
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
                <div class="stat-value">3</div>
                <div class="stat-label">危急值</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon queue">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">12</div>
                <div class="stat-label">待采样</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>检验任务</span>
          <el-button type="primary" size="small">新建任务</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe>
        <el-table-column prop="taskNo" label="检验单号" width="140" />
        <el-table-column prop="patientName" label="患者姓名" width="100" />
        <el-table-column prop="barcode" label="条码号" width="120" />
        <el-table-column prop="testType" label="检验类型" width="120" />
        <el-table-column prop="items" label="检验项目" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiveTime" label="接收时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default>
            <el-button type="primary" link>录入</el-button>
            <el-button type="primary" link>审核</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Clock, Checked, Warning, List } from '@element-plus/icons-vue'

const tableData = [
  {
    taskNo: 'LB20240406001',
    patientName: '张三',
    barcode: 'BC240406001',
    testType: '血常规',
    items: 'WBC,RBC,HGB,HCT',
    status: '待审核',
    receiveTime: '2024-04-06 09:30:00'
  },
  {
    taskNo: 'LB20240406002',
    patientName: '李四',
    barcode: 'BC240406002',
    testType: '生化',
    items: 'ALT,AST,BUN,Cr',
    status: '已完成',
    receiveTime: '2024-04-06 09:45:00'
  },
  {
    taskNo: 'LB20240406003',
    patientName: '王五',
    barcode: 'BC240406003',
    testType: '免疫',
    items: 'HBV,HCV,HIV',
    status: '待采样',
    receiveTime: '2024-04-06 10:00:00'
  }
]

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    '待采样': 'warning',
    '已采样': '',
    '检验中': 'primary',
    '待审核': 'warning',
    '已完成': 'success'
  }
  return map[status] || ''
}
</script>

<style scoped>
.lis-index {
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

.stat-icon.pending {
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

.stat-icon.queue {
  background: #409eff;
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