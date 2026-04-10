import { request } from './request'
import type { Organization } from '@/types'

export const organizationApi = {
  getTree() {
    return request.get<Organization[]>('/organizations')
  },

  getById(id: string) {
    return request.get<Organization>(`/organizations/${id}`)
  },

  create(data: any) {
    return request.post<Organization>('/organizations', data)
  },

  update(id: string, data: any) {
    return request.put<Organization>(`/organizations/${id}`, data)
  },

  delete(id: string) {
    return request.delete(`/organizations/${id}`)
  }
}
