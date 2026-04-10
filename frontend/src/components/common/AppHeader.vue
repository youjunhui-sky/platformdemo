<template>
  <div class="app-header">
    <div class="header-left">
      <el-icon class="fold-btn" @click="toggleSidebar">
        <Fold v-if="!layoutStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <div class="system-title">医院统一权限管理平台</div>
    </div>
    <div class="header-right">
      <el-dropdown @command="handleCommand" trigger="click">
        <div class="user-info">
          <el-avatar :size="32" icon="User" />
          <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 修改密码弹框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px" destroy-on-close>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 个人中心弹框 -->
    <el-dialog v-model="profileDialogVisible" title="个人中心" width="450px" destroy-on-close>
      <div class="profile-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ userStore.userInfo?.username }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ userStore.userInfo?.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属机构">{{ userStore.userInfo?.orgName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ userStore.userInfo?.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ userStore.userInfo?.email || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="profileDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage, FormInstance, FormRules } from 'element-plus'
import { Fold, Expand, User, Lock, SwitchButton, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useLayoutStore } from '@/stores/layout'
import { authApi } from '@/api/auth'

const router = useRouter()
const emit = defineEmits(['toggle-sidebar'])

const userStore = useUserStore()
const layoutStore = useLayoutStore()

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: (_: any, value: string, callback: any) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  passwordLoading.value = true
  try {
    await authApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    // 自动退出登录
    await authApi.logout()
    userStore.reset()
    router.push('/login')
  } catch (e: any) {
    ElMessage.error(e?.message || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 个人中心相关
const profileDialogVisible = ref(false)

const handleProfile = async () => {
  profileDialogVisible.value = true
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      handleProfile()
      break
    case 'password':
      // 重置表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      passwordDialogVisible.value = true
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await authApi.logout()
        userStore.reset()
        router.push('/login')

      } catch {
        // User cancelled
      }
      break
  }
}
</script>

<style scoped>
.app-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.fold-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 16px;
  color: #666;
}

.fold-btn:hover {
  color: #409eff;
}

.system-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-info:hover {
  background: #f5f5f5;
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: #333;
}
</style>