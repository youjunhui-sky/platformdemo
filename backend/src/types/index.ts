// Token Payload Types
export interface AccessTokenPayload {
  sub: string;        // user id
  name: string;
  deptId: string | null;
  roleIds: string[];
  dataScope: number;
  subsystemCodes: string[];
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface RefreshTokenData {
  jti: string;
  userId: string;
  sessionId: string;
}

export interface SsoTicket {
  ticket: string;
  userId: string;
  subsystemId: string;
  expiresAt: Date;
}

// JWT Strategy Types
export interface JwtPayload {
  sub: string;
  name: string;
  username: string;
  roles?: string[];
  roleIds: string[];
  jti: string;
  dataScope: number;
  subsystemCodes: string[];
  deptId: string | null;
}

// Menu Tree Types
export interface MenuTreeNode {
  id: string;
  name: string;
  code: string;
  path: string | null;
  component: string | null;
  redirect: string | null;
  icon: string | null;
  sortOrder: number;
  type: string;
  permission: string | null;
  isVisible: boolean;
  isCache: boolean;
  isFrame: boolean;
  children: MenuTreeNode[];
}

// API Response Types
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Login Types
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserInfo;
  subsystems: SubsystemInfo[];
  permissions: string[];
  menus: any[];
}

export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  orgId: string | null;
  orgName: string | null;
  status: number;
  isFirstLogin: boolean;
}

export interface SubsystemInfo {
  id: string;
  code: string;
  name: string;
  domain: string;
  logoUrl: string | null;
}

// Request with user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      correlationId?: string;
    }
  }
}
