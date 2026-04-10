<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">医院统一管理平台</h1>
        <p class="login-subtitle">Hospital Management System</p>
      </div>

      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            clearable
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            clearable
            autocomplete="current-password"
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              size="large"
              class="captcha-input"
            />
            <div class="captcha-display" @click="refreshCaptcha" v-html="captchaSvg" />
          </div>
        </el-form-item>

        <el-form-item>
          <div class="remember-forgot">
            <el-checkbox v-model="loginForm.remember">记住用户名</el-checkbox>
            <el-link type="primary" underline="never">忘记密码？</el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>Contact administrator for account issues</p>
      </div>
    </div>

    <div class="login-bg">
      <div class="bg-content">
        <h2>Unified Permission Management</h2>
        <p>Centralized management of users, roles, menus, and subsystems</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useUser } from '@/composables/useUser'
import { useSubsystem } from '@/composables/useSubsystem'
import { storage } from '@/utils/storage'
import { authApi } from '@/api/auth'

const router = useRouter()
const { login, fetchPlatformMenus } = useUser()
const { fetchAccessibleSubsystems } = useSubsystem()

const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaId = ref('')
const captchaSvg = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: 'Username must be 3-50 characters', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '请输入4位验证码', trigger: 'blur' }
  ]
}

const refreshCaptcha = async () => {
  try {
    const res = await authApi.getCaptcha() as any
    const captchaData = res.data?.data || res.data
    captchaId.value = captchaData?.id || ''
    captchaSvg.value = captchaData?.image || ''
  } catch (e) {
    console.error('Failed to get captcha:', e)
  }
}

onMounted(() => {
  // Load saved username if remember is enabled
  const savedUsername = storage.getSavedUsername()
  if (savedUsername) {
    loginForm.username = savedUsername
    loginForm.remember = true
  }
  refreshCaptcha()
})

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true

  try {
    await login(loginForm.username, loginForm.password, captchaId.value, loginForm.captcha)

    // Remember username if checked
    if (loginForm.remember) {
      storage.setSavedUsername(loginForm.username)
    }

    ElMessage.success('Login successful')

    // Fetch platform menus
    await fetchPlatformMenus()

    // Get accessible subsystems and determine redirect target
    const accessibleSubsystems = await fetchAccessibleSubsystems()

    if (accessibleSubsystems && accessibleSubsystems.length === 1) {
      const subsystemCode = accessibleSubsystems[0].code
      router.push(`/${subsystemCode}`)
    } else {
      router.push('/dashboard')
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '登录失败'
    ElMessage.error(msg)
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: #fff;
}

.login-box {
  flex: 0 0 50%;
  max-width: 500px;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header {
  margin-bottom: 40px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
}

.login-form {
  max-width: 320px;
}

.captcha-row {
  display: flex;
  gap: 12px;
}

.captcha-input {
  flex: 1;
}

.captcha-display {
  width: 120px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

.login-bg {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.bg-content {
  text-align: center;
  max-width: 400px;
}

.bg-content h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #fff;
}

.bg-content p {
  font-size: 18px;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .login-bg {
    display: none;
  }

  .login-box {
    flex: 1;
    padding: 40px 20px;
  }
}
</style>
