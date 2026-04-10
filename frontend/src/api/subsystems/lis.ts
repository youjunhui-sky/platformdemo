import { request } from './request'
import type { PageParams, PageResult } from '@/types'

// LIS 检验任务
export interface LabTask {
  id: string
  taskNo: string
  patientId: string
  patientName: string
  barcode: string
  testType: string
  items: string
  status: string
  receiveTime: string
}

// LIS 检验结果
export interface LabResult {
  id: string
  taskId: string
  itemCode: string
  itemName: string
  value: string
  unit: string
  reference: string
  flag: string
  resultTime: string
}

export const lisApi = {
  // 检验任务
  getTaskList(params: PageParams & { status?: string; testType?: string }) {
    return request.get<PageResult<LabTask>>('/lis/task/list', { params })
  },

  getTaskDetail(id: string) {
    return request.get<LabTask>('/lis/task/' + id)
  },

  // 样本采集
  collectSample(id: string) {
    return request.post('/lis/task/' + id + '/collect')
  },

  // 结果录入
  getResultList(taskId: string) {
    return request.get<LabResult[]>('/lis/result/' + taskId)
  },

  saveResult(taskId: string, data: Partial<LabResult>[]) {
    return request.put('/lis/result/' + taskId, data)
  },

  // 审核
  approveResult(id: string) {
    return request.post('/lis/task/' + id + '/approve')
  },

  // 危急值
  getCriticalList() {
    return request.get<LabTask[]>('/lis/critical')
  }
}