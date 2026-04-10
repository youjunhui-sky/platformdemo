<template>
  <div class="his-index">
    <div class="page-header">
      <h1>HIS 医院信息管理系统</h1>
      <p class="subtitle">Hospital Information System</p>
    </div>

    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon outpatients">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">1,234</div>
                <div class="stat-label">今日门诊</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon inpatients">
                <el-icon><House /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">456</div>
                <div class="stat-label">在院患者</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon surgeries">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">28</div>
                <div class="stat-label">今日手术</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon beds">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">92%</div>
                <div class="stat-label">床位使用率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="quick-links">
      <h2>功能模块</h2>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="link-card" @click="$router.push('/his/outpatient')">
            <el-icon class="link-icon"><FirstAidKit /></el-icon>
            <div class="link-text">门诊管理</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="link-card" @click="$router.push('/his/inpatient')">
            <el-icon class="link-icon"><House /></el-icon>
            <div class="link-text">住院管理</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="link-card" @click="$router.push('/his/patient')">
            <el-icon class="link-icon"><User /></el-icon>
            <div class="link-text">患者管理</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="link-card">
            <el-icon class="link-icon"><FirstAidKit /></el-icon>
            <div class="link-text">医嘱管理</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, House, Calendar, Box, FirstAidKit } from '@element-plus/icons-vue'
</script>

<style scoped>
.his-index {
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
  margin-bottom: 32px;
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

.stat-icon.outpatients {
  background: #409eff;
  color: #fff;
}

.stat-icon.inpatients {
  background: #67c23a;
  color: #fff;
}

.stat-icon.surgeries {
  background: #e6a23c;
  color: #fff;
}

.stat-icon.beds {
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

.quick-links h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.link-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.link-card:hover {
  transform: translateY(-4px);
}

.link-icon {
  font-size: 36px;
  color: #409eff;
  margin-bottom: 12px;
}

.link-text {
  font-size: 16px;
  color: #606266;
}
</style>