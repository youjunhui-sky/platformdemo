import { request } from './request'
import type { PageResult, PageParams } from '@/types'

export const dictApi = {
  // DictType APIs
  getTypes(params?: PageParams) {
    return request.get<DictType[]>('/dict/type', params)
  },

  getTypeById(id: string) {
    return request.get<DictType>(`/dict/type/${id}`)
  },

  createType(data: DictTypeForm) {
    return request.post<DictType>('/dict/type', data)
  },

  updateType(id: string, data: DictTypeForm) {
    return request.put<DictType>(`/dict/type/${id}`, data)
  },

  deleteType(id: string) {
    return request.delete(`/dict/type/${id}`)
  },

  // DictInfo APIs
  getAllDictInfos() {
    return request.get<DictInfo[]>('/dict/info')
  },

  getDictInfosByType(typeId: string) {
    return request.get<DictInfo[]>(`/dict/info/type/${typeId}`)
  },

  createDictInfo(data: DictInfoForm) {
    return request.post<DictInfo>('/dict/info', data)
  },

  updateDictInfo(id: string, data: DictInfoForm) {
    return request.put<DictInfo>(`/dict/info/${id}`, data)
  },

  deleteDictInfo(id: string) {
    return request.delete(`/dict/info/${id}`)
  },

  // Data APIs
  getDictData(types?: string) {
    return request.get<Record<string, any[]>>('/dict/data', { types })
  },

  getAllTypes() {
    return request.get<DictType[]>('/dict/types')
  },

  getDictName(id: string) {
    return request.post<DictInfo>('/dict/getName', { id })
  }
}

export interface DictType {
  id: string
  name: string
  key: string
  createdAt?: string
  updatedAt?: string
}

export interface DictTypeForm {
  name: string
  key: string
}

export interface DictInfo {
  id: string
  name: string
  value?: string
  typeId: string
  parentId?: string
  orderNum: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  children?: DictInfo[]
}

export interface DictInfoForm {
  name: string
  value?: string
  typeId: string
  parentId?: string
  orderNum?: number
  remark?: string
}