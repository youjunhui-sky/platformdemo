<template>
  <div class="subsystem-page">
    <div class="page-header">
      <h1>住院管理</h1>
      <p class="subtitle">Inpatient Management</p>
    </div>

    <el-card>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="患者姓名">
          <el-input v-model="queryForm.patientName" placeholder="请输入患者姓名" clearable />
        </el-form-item>
        <el-form-item label="住院号">
          <el-input v-model="queryForm.admissionNo" placeholder="请输入住院号" clearable />
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="queryForm.department" placeholder="请选择科室" clearable>
            <el-option label="内科" value="内科" />
            <el-option label="外科" value="外科" />
            <el-option label="儿科" value="儿科" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe>
        <el-table-column prop="admissionNo" label="住院号" width="120" />
        <el-table-column prop="patientName" label="患者姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="department" label="科室" width="120" />
        <el-table-column prop="ward" label="病房" width="100" />
        <el-table-column prop="bedNo" label="床位号" width="80" />
        <el-table-column prop="doctor" label="主治医生" width="100" />
        <el-table-column prop="diagnosis" label="诊断" />
        <el-table-column prop="admissionDate" label="入院日期" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default>
            <el-button type="primary" link>详情</el-button>
            <el-button type="primary" link>医嘱</el-button>
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
  admissionNo: '',
  department: ''
})

const tableData = [
  {
    admissionNo: 'IP20240405001',
    patientName: '王五',
    gender: '男',
    age: 58,
    department: '内科',
    ward: '内科一区',
    bedNo: '15',
    doctor: '张医生',
    diagnosis: '高血压',
    admissionDate: '2024-04-05'
  },
  {
    admissionNo: 'IP20240404002',
    patientName: '赵六',
    gender: '女',
    age: 42,
    department: '外科',
    ward: '外科二区',
    bedNo: '22',
    doctor: '刘医生',
    diagnosis: '胆囊炎',
    admissionDate: '2024-04-04'
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
  queryForm.admissionNo = ''
  queryForm.department = ''
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