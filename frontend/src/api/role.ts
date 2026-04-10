import { request } from './request'
import type { Role, RoleForm, RoleMenuParams, RoleSubsystemParams, DataPermission, PageResult, PageParams } from '@/types'

export const roleApi = {
  getList(params?: PageParams) {
    return request.get<Role[]>('/roles', params)
  },

  getPageList(params?: PageParams) {
    return request.get<PageResult<Role>>('/roles', { ...params, page: params?.page ?? 1, pageSize: params?.pageSize ?? 10 })
  },

  getById(id: string) {
    return request.get<Role>(`/roles/${id}`)
  },

  create(data: RoleForm) {
    return request.post<Role>('/roles', data)
  },

  update(id: string, data: RoleForm) {
    return request.put<Role>(`/roles/${id}`, data)
  },

  delete(id: string) {
    return request.delete(`/roles/${id}`)
  },

  getMenuTree(id: string) {
    return request.get<MenuTreeNode[]>(`/roles/${id}/menus`)
  },

  assignMenus(id: string, data: RoleMenuParams) {
    return request.put(`/roles/${id}/menus`, data)
  },

  getSubsystems(id: string) {
    return request.get<string[]>(`/roles/${id}/subsystems`)
  },

  assignSubsystems(id: string, data: RoleSubsystemParams) {
    return request.put(`/roles/${id}/subsystems`, data)
  },

  getDataPermissions(id: string) {
    return request.get<DataPermission>(`/roles/${id}/data-permissions`)
  },

  setDataPermissions(id: string, data: DataPermission) {
    return request.put(`/roles/${id}/data-permissions`, data)
  }
}

export interface MenuTreeNode {
  id: string
  name: string
  parentId: string | null
  children?: MenuTreeNode[]
  checked?: boolean
  halfChecked?: boolean
}
