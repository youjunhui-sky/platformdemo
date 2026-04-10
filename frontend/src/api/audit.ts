import { request } from './request'
import type { AuditLog, AuditLogParams, AuditStats, PageResult } from '@/types'

export const auditApi = {
  getLogs(params: AuditLogParams) {
    return request.get<PageResult<AuditLog>>('/audit/logs', params)
  },

  getStats() {
    return request.get<AuditStats>('/audit/stats')
  },

  getLogDetail(id: string) {
    return request.get<AuditLog>(`/audit/logs/${id}`)
  }
}
