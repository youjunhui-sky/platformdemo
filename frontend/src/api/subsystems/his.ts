import { request } from './request'
import type { PageParams, PageResult } from '@/types'

// HIS 门诊记录
export interface OutpatientRecord {
  id: string
  outpatientNo: string
  patientId: string
  patientName: string
  gender: string
  age: number
  department: string
  doctor: string
  diagnosis: string
  status: string
  visitTime: string
}

// HIS 住院记录
export interface InpatientRecord {
  id: string
  admissionNo: string
  patientId: string
  patientName: string
  gender: string
  age: number
  department: string
  ward: string
  bedNo: string
  doctor: string
  diagnosis: string
  admissionDate: string
  status: string
}

// HIS 患者档案
export interface Patient {
  id: string
  patientId: string
  patientName: string
  gender: string
  age: number
  idCard: string
  phone: string
  address: string
  status: string
  lastVisit: string
}

export const hisApi = {
  // 门诊管理
  getOutpatientList(params: PageParams & { department?: string; doctor?: string }) {
    return request.get<PageResult<OutpatientRecord>>('/his/outpatient/list', { params })
  },

  getOutpatientDetail(id: string) {
    return request.get<OutpatientRecord>('/his/outpatient/' + id)
  },

  // 住院管理
  getInpatientList(params: PageParams & { department?: string; ward?: string }) {
    return request.get<PageResult<InpatientRecord>>('/his/inpatient/list', { params })
  },

  getInpatientDetail(id: string) {
    return request.get<InpatientRecord>('/his/inpatient/' + id)
  },

  // 患者管理
  getPatientList(params: PageParams & { status?: string }) {
    return request.get<PageResult<Patient>>('/his/patient/list', { params })
  },

  getPatientDetail(id: string) {
    return request.get<Patient>('/his/patient/' + id)
  },

  createPatient(data: Partial<Patient>) {
    return request.post('/his/patient', data)
  },

  updatePatient(id: string, data: Partial<Patient>) {
    return request.put('/his/patient/' + id, data)
  }
}