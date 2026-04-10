import { request } from './request'
import type { PageParams, PageResult } from '@/types'

// PACS 检查任务
export interface StudyTask {
  id: string
  studyNo: string
  patientId: string
  patientName: string
  modality: string
  bodyPart: string
  device: string
  status: string
  scheduledTime: string
}

// PACS 影像报告
export interface StudyReport {
  id: string
  studyId: string
  finding: string
  impression: string
  doctor: string
  reportTime: string
  status: string
}

export const pacsApi = {
  // 检查任务
  getStudyList(params: PageParams & { status?: string; modality?: string }) {
    return request.get<PageResult<StudyTask>>('/pacs/study/list', { params })
  },

  getStudyDetail(id: string) {
    return request.get<StudyTask>('/pacs/study/' + id)
  },

  // 预约
  createAppointment(data: Partial<StudyTask>) {
    return request.post('/pacs/appointment', data)
  },

  // 报告
  getReport(studyId: string) {
    return request.get<StudyReport>('/pacs/report/' + studyId)
  },

  saveReport(studyId: string, data: Partial<StudyReport>) {
    return request.put('/pacs/report/' + studyId, data)
  },

  // 胶片打印
  printFilm(studyId: string) {
    return request.post('/pacs/study/' + studyId + '/print')
  }
}