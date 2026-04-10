// ========== Common ==========
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageParams {
  page?: number
  pageSize?: number
  keyword?: string
}

// ========== Auth ==========
export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserInfo
  subsystems: Subsystem[]
  permissions: string[]
}

export interface RefreshTokenResult {
  accessToken: string
  expiresIn: number
}

// ========== User ==========
export interface UserInfo {
  id: string
  username: string
  realName: string
  email: string
  phone: string
  orgId: string
  orgName: string
  roles: Role[]
  status?: number
  createTime?: string
}

export interface User {
  id: string
  username: string
  realName: string
  email: string
  phone: string
  orgId: string
  orgName: string
  status: number
  roles: Role[]
  createTime: string
  updateTime: string
}

export interface UserForm {
  id?: string
  username: string
  password?: string
  realName: string
  email: string
  phone: string
  orgId: string
  roleIds: string[]
  status: number
}

export interface UserListParams extends PageParams {
  status?: number
  orgId?: string
}

// ========== Role ==========
export interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: number
  createTime: string
  updateTime?: string
}

export interface RoleForm {
  id?: string
  name: string
  code: string
  description?: string
  status: number
}

export interface RoleMenuParams {
  menuIds: string[]
}

export interface RoleSubsystemParams {
  subsystemIds: string[]
}

export interface DataPermission {
  scopeType: 'all' | 'dept' | 'dept_and_child' | 'self'
  deptIds?: string[]
}

// ========== Menu ==========
export interface Menu {
  id: string
  name: string
  parentId: string | null
  path: string
  component?: string
  redirect?: string
  icon?: string
  menuType: 'catalog' | 'menu' | 'button'
  permission?: string
  sort: number
  status: number
  visible: number
  keepAlive: number
  children?: Menu[]
  createTime: string
  updateTime?: string
}

export interface MenuForm {
  id?: string
  name: string
  parentId: string | null
  path?: string
  component?: string
  redirect?: string
  icon?: string
  menuType: 'catalog' | 'menu' | 'button'
  permission?: string
  sort: number
  status: number
  visible: number
  keepAlive: number
}

// ========== Subsystem ==========
export interface Subsystem {
  id: string
  code: string
  name: string
  description?: string
  logo?: string
  status: string
}

export interface SubsystemForm {
  id?: string
  code: string
  name: string
  description?: string
  logo?: string
  status: string
}

// ========== Audit ==========
export interface AuditLog {
  id: string
  module: string
  businessType: string
  method: string
  requestMethod: string
  operatorType: string
  operatorName: string
  deptName?: string
  requestUrl: string
  requestIp: string
  requestLocation?: string
  methodParam?: string
  returnParam?: string
  status: number
  errorMsg?: string
  costTime: number
  createTime: string
}

export interface AuditLogParams extends PageParams {
  module?: string
  businessType?: string
  operatorName?: string
  status?: number
  startDate?: string
  endDate?: string
}

export interface AuditStats {
  totalCount: number
  successCount: number
  failCount: number
  todayCount: number
  weekData: { date: string; count: number }[]
  moduleStats: { module: string; count: number }[]
}

// ========== Organization ==========
export interface Organization {
  id: string
  name: string
  parentId: string | null
  code: string
  level: number
  sort: number
  type: string
  status: number
  children?: Organization[]
  createTime: string
}

// ========== Route ==========
export interface RouteRecordRaw {
  path: string
  name?: string
  component?: any
  redirect?: string
  meta?: RouteMeta
  children?: RouteRecordRaw[]
}

export interface RouteMeta {
  title: string
  icon?: string
  hidden?: boolean
  requiresAuth?: boolean
  permission?: string | string[]
  keepAlive?: boolean
  activeMenu?: string
}

// ========== Data Scope ==========
export type DataScopeType = 'all' | 'dept' | 'dept_and_child' | 'self'
