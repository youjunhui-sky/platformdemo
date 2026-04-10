<template>
  <div class="subsystem-page">
    <div class="page-header">
      <h1>门诊管理</h1>
      <p class="subtitle">Outpatient Management</p>
    </div>

    <el-card>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="患者姓名">
          <el-input v-model="queryForm.patientName" placeholder="请输入患者姓名" clearable />
        </el-form-item>
        <el-form-item label="门诊号">
          <el-input v-model="queryForm.outpatientNo" placeholder="请输入门诊号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe>
        <el-table-column prop="outpatientNo" label="门诊号" width="120" />
        <el-table-column prop="patientName" label="患者姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="department" label="科室" width="120" />
        <el-table-column prop="doctor" label="医生" width="100" />
        <el-table-column prop="diagnosis" label="诊断" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已就诊' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="visitTime" label="就诊时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default>
            <el-button type="primary" link>详情</el-button>
            <el-button type="primary" link>处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const queryForm = reactive({
  patientName: '',
  outpatientNo: ''
})

const tableData = [
  {
    outpatientNo: 'OP20240406001',
    patientName: '张三',
    gender: '男',
    age: 45,
    department: '内科',
    doctor: '李医生',
    diagnosis: '上呼吸道感染',
    status: '已就诊',
    visitTime: '2024-04-06 09:30:00'
  },
  {
    outpatientNo: 'OP20240406002',
    patientName: '李四',
    gender: '女',
    age: 32,
    department: '外科',
    doctor: '王医生',
    diagnosis: '腹部不适',
    status: '待就诊',
    visitTime: '2024-04-06 10:00:00'
  }
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 2
})

const handleSearch = () => {
  console.log('search', queryForm)
}

const handleReset = () => {
  queryForm.patientName = ''
  queryForm.outpatientNo = ''
}
</script>

<style scoped>
.subsystem-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.search-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>