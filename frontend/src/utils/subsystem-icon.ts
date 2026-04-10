/**
 * 子系统图标映射
 * 根据 subsystem code 返回对应的图标URL
 * 常见医院子系统编码:
 * - HIS: 医院信息系统 (Hospital Information System)
 * - LIS: 检验信息系统 (Laboratory Information System)
 * - PACS: 医学影像系统 (Picture Archiving and Communication System)
 * - EMR: 电子病历系统 (Electronic Medical Record)
 * - RIS: 放射信息系统 (Radiology Information System)
 * - CIS: 临床信息系统 (Clinical Information System)
 * - PASS: 合理用药系统 (Pharmacy Administration Surveillance System)
 * - HRMS: 人力资源系统 (Human Resource Management System)
 * - OA: 办公自动化系统 (Office Automation)
 * - CRM: 客户关系系统 (Customer Relationship Management)
 */

const subsystemIconMap: Record<string, string> = {
  HIS: '/images/subsystems/HIS.svg',
  LIS: '/images/subsystems/LIS.svg',
  PACS: '/images/subsystems/PACS.svg',
  EMR: '/images/subsystems/EMR.svg',
  RIS: '/images/subsystems/PACS.svg',  // 复用PACS图标
  CIS: '/images/subsystems/EMR.svg', // 复用EMR图标
  PASS: '/images/subsystems/PASS.svg',
  HRMS: '/images/subsystems/HRMS.svg',
  OA: '/images/subsystems/OA.svg',
  CRM: '/images/subsystems/OA.svg',  // 复用OA图标
}

const subsystemColorMap: Record<string, string> = {
  HIS: '#409EFF',
  LIS: '#67C23A',
  PACS: '#E6A23C',
  EMR: '#909399',
  RIS: '#F56C6C',
  CIS: '#8E44AD',
  PASS: '#FF9800',
  HRMS: '#2196F3',
  OA: '#795548',
  CRM: '#00BCD4',
}

/**
 * 根据子系统编码获取图标URL
 */
export function getSubsystemIcon(code: string): string {
  const upperCode = (code || '').toUpperCase()
  return subsystemIconMap[upperCode] || subsystemIconMap.default
}

/**
 * 根据子系统编码获取颜色
 */
export function getSubsystemColor(code: string): string {
  const upperCode = (code || '').toUpperCase()
  return subsystemColorMap[upperCode] || subsystemColorMap.default
}