import { request } from './request'
import type { LoginParams, LoginResult, UserInfo, RefreshTokenResult } from '@/types'

interface Menu { id: string; name: string; code: string; path?: string; children?: Menu[] }

interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

interface CaptchaResult {
  id: string
  code: string
}

export const authApi = {
  getCaptcha() {
    return request.get<CaptchaResult>('/auth/captcha')
  },

  login(data: LoginParams & { captchaId?: string; captchaAnswer?: string }) {
    return request.post<LoginResult>('/auth/login', data)
  },

  logout() {
    return request.post('/auth/logout')
  },

  refresh() {
    return request.post<RefreshTokenResult>('/auth/refresh')
  },

  getUserInfo() {
    return request.get<UserInfo>('/auth/userinfo')
  },

  // 获取用户菜单（平台）
  getUserMenus() {
    return request.get<any>('/auth/menus')
  },

  getSsoMenu(subsystemCode: string) {
    return request.get<Menu[]>('/auth/sso/menu/' + subsystemCode)
  },

  changePassword(data: ChangePasswordParams) {
    return request.post('/auth/change-password', data)
  }
}
