import { request } from './request'
import type { User, UserForm, UserListParams, PageResult, UserInfo } from '@/types'

export const userApi = {
  getList(params: UserListParams) {
    return request.get<PageResult<User>>('/users', params)
  },

  getById(id: string) {
    return request.get<User>(`/users/${id}`)
  },

  create(data: UserForm) {
    return request.post<User>('/users', data)
  },

  update(id: string, data: UserForm) {
    return request.put<User>(`/users/${id}`, data)
  },

  delete(id: string) {
    return request.delete(`/users/${id}`)
  },

  assignRoles(id: string, roleIds: string[]) {
    return request.put(`/users/${id}/roles`, { roleIds })
  },

  updateStatus(id: string, status: number) {
    return request.put(`/users/${id}/status`, { status })
  },

  resetPassword(id: string, newPassword: string) {
    return request.put(`/users/${id}/reset-password`, { password: newPassword })
  }
}
