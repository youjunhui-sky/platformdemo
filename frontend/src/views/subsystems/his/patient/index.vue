<template>
  <div class="subsystem-page">
    <div class="page-header">
      <h1>患者管理</h1>
      <p class="subtitle">Patient Management</p>
    </div>

    <el-card>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="患者姓名">
          <el-input v-model="queryForm.patientName" placeholder="请输入患者姓名" clearable />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="queryForm.idCard" placeholder="请输入身份证号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="在院" value="in" />
            <el-option label="离院" value="out" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe>
        <el-table-column prop="patientId" label="患者ID" width="100" />
        <el-table-column prop="patientName" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '在院' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastVisit" label="最近就诊" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button type="primary" link>详情</el-button>
            <el-button type="primary" link>就诊记录</el-button>
            <el-button type="primary" link>编辑</el-button>
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
  idCard: '',
  status: ''
})

const tableData = [
  {
    patientId: 'P001',
    patientName: '张三',
    gender: '男',
    age: 45,
    idCard: '110101197901011234',
    phone: '13800138000',
    address: '北京市朝阳区XX街道',
    status: '在院',
    lastVisit: '2024-04-06'
  },
  {
    patientId: 'P002',
    patientName: '李四',
    gender: '女',
    age: 32,
    idCard: '110101199201011234',
    phone: '13900139000',
    address: '北京市海淀区XX街道',
    status: '离院',
    lastVisit: '2024-04-05'
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
  queryForm.idCard = ''
  queryForm.status = ''
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