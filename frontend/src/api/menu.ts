import { request } from './request'
import type { Menu, MenuForm } from '@/types'

export const menuApi = {
  getAll(subsystemCode?: string) {
    return request.get<Menu[]>('/menus', { subsystemCode })
  },

  getTree(subsystemCode?: string) {
    return request.get<Menu[]>('/menus/tree', { subsystemCode })
  },

  getById(id: string) {
    return request.get<Menu>(`/menus/${id}`)
  },

  create(data: MenuForm) {
    return request.post<Menu>('/menus', data)
  },

  update(id: string, data: MenuForm) {
    return request.put<Menu>(`/menus/${id}`, data)
  },

  delete(id: string) {
    return request.delete(`/menus/${id}`)
  }
}
