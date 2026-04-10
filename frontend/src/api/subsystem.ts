import { request } from './request'
import type { Subsystem, SubsystemForm, PageResult, PageParams, ApiResponse } from '@/types'

export const subsystemApi = {
  getAccessible() {
    return request.get<ApiResponse<Subsystem[]>>('/subsystems/accessible')
  },

  getList(params?: PageParams) {
    return request.get<PageResult<Subsystem>>('/subsystems', params)
  },

  getAll() {
    return request.get<ApiResponse<Subsystem[]>>('/subsystems')
  },

  getById(id: string) {
    return request.get<Subsystem>(`/subsystems/${id}`)
  },

  create(data: SubsystemForm) {
    return request.post<Subsystem>('/subsystems', data)
  },

  update(id: string, data: SubsystemForm) {
    return request.put<Subsystem>(`/subsystems/${id}`, data)
  },

  updateStatus(id: string, status: string) {
    return request.put(`/subsystems/${id}/status`, { status })
  },

  delete(id: string) {
    return request.delete(`/subsystems/${id}`)
  },

  rotateSecret(id: string) {
    return request.post<{ secret: string }>(`/subsystems/${id}/secret/rotate`)
  }
}
