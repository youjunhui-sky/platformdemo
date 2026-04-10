# 医院统一权限管理平台架构设计文档

**文档版本**: v1.0
**编制日期**: 2026-04-03
**架构师**: ArchitectUX Agent
**状态**: 设计完成，待评审

---

## 目录

1. [整体系统架构](#1-整体系统架构)
2. [技术架构设计](#2-技术架构设计)
3. [权限模型设计](#3-权限模型设计)
4. [子系统注册机制](#4-子系统注册机制)
5. [SSO认证流程](#5-sso认证流程)
6. [数据库设计](#6-数据库设计)
7. [API接口设计](#7-api接口设计)
8. [前端架构设计](#8-前端架构设计)
9. [安全加固方案](#9-安全加固方案)
10. [部署架构](#10-部署架构)

---

## 1. 整体系统架构

### 1.1 系统定位

本平台（称为 **权限管理主平台**，以下简称"主平台"）是医院信息系统的统一身份认证与权限控制中枢。所有子系统（HIS、LIS、PACS、EMR等）作为"租户"注册到主平台，共享主平台的认证和权限服务。终端用户（医生、护士、管理员等）通过主平台单点登录，统一管理个人身份和跨系统访问权限。

```
┌─────────────────────────────────────────────────────────────────────┐
│                        医院信息外网 (DMZ)                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐  │
│  │  HIS     │   │  LIS     │   │  PACS    │   │  EMR             │  │
│  │ 门诊/住院 │   │  检验系统 │   │  影像系统 │   │  电子病历         │  │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────────┬─────────┘  │
│       │             │             │                  │            │
│       └─────────────┴─────────────┴──────────────────┘            │
│                              │                                      │
│                    ┌─────────▼─────────┐                          │
│                    │   API Gateway      │                          │
│                    │  (Kong / Nginx)     │                          │
│                    └─────────┬─────────┘                          │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                      医院信息内网                                     │
│                    ┌──────────────────┐                             │
│                    │  主平台 (IDP)     │                             │
│                    │  ─────────────── │                             │
│                    │  · 用户管理       │                             │
│                    │  · 角色管理       │                             │
│                    │  · 菜单/按钮权限  │                             │
│                    │  · 子系统注册     │                             │
│                    │  · SSO认证服务    │                             │
│                    │  · 数据权限控制   │                             │
│                    │  · 审计日志       │                             │
│                    └────────┬─────────┘                             │
│                             │                                        │
│                    ┌────────▼────────┐                              │
│                    │  PostgreSQL     │   ┌────────┐  ┌───────────┐ │
│                    │  (主数据库)      │◄──│ Redis  │  │ MinIO/OSS │ │
│                    │                  │   │(缓存)  │  │ (文件存储) │ │
│                    └──────────────────┘   └────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 系统角色与职责矩阵

| 角色 | 职责范围 | 典型用户 |
|------|---------|---------|
| **超级管理员** | 平台全局配置、子系统注册审批、系统参数管理 | 信息科主任 |
| **平台管理员** | 用户/角色/权限日常管理、审计日志查看 | 信息科干事 |
| **子系统管理员** | 所辖子系统的菜单/按钮权限细化 | 各科室信息员 |
| **科室主管** | 科室成员角色分配、子系统访问授权 | 科室主任 |
| **普通医护人员** | 仅访问已授权子系统，权限范围内操作 | 医生、护士、药师 |

### 1.3 子系统部署拓扑

```
                    ┌─────────────────┐
                    │  主平台 IDP      │
                    │  portal.hosp.com│
                    └────────┬────────┘
                             │ HTTPS (443)
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼────┐ ┌──────▼──────┐ ┌─────▼──────┐
    │ HIS           │ │ LIS         │ │ PACS       │
    │ his.hosp.com  │ │ lis.hosp.com│ │ pacs.hosp. │
    │ (独立K8s集群) │ │ (K8s Pod)   │ │ com        │
    └─────────┬─────┘ └──────┬──────┘ └─────┬──────┘
              │              │              │
              └──────────────┴──────────────┘
                         │
            ┌────────────▼─────────────┐
            │    API Gateway / WAF     │
            │  (统一入口，带认证鉴权)    │
            └───────────────────────────┘

    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ EMR      │ │ HRP      │ │ CRM      │ │ 药品管理  │
    │ emr.hosp.│ │ hrp.hosp.│ │ crm.hosp.│ │ drug.hosp│
    └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 1.4 子系统分类

| 类别 | 子系统 | 数据敏感度 | 典型访问量 |
|------|--------|-----------|-----------|
| 核心业务 | HIS | 极高( PHI ) | 日均万级会话 |
| 核心业务 | EMR | 极高( PHI ) | 日均万级会话 |
| 辅助诊断 | LIS/PACS | 高 | 日均千级会话 |
| 运营管理 | HRP/CRM | 中 | 日均百级会话 |
| 专业系统 | 药品/手术/合理用药 | 高 | 日均千级会话 |

> PHI = Protected Health Information，受保护的健康信息（HIPAA 术语）

---

## 2. 技术架构设计

### 2.1 整体技术栈

```
┌─────────────────────────────────────────────────────┐
│                    接入层                            │
│   浏览器 / 移动端 / 第三方系统                        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   CDN (可选)                          │
│              静态资源加速 / WAF 防护                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 API Gateway (Kong)                   │
│   · 请求路由    · 限流熔断    · JWT 验签              │
│   · 协议转换    · 日志记录    · CORS 处理             │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼────────┐     ┌──────────▼─────────┐
│   主平台 Backend │     │  子系统 Backend    │
│   (Node.js/Koa)  │     │  (各子系统自实现)  │
│                  │     │                    │
│   · 用户管理     │     │  共享认证SDK验Token│
│   · 角色权限     │     │  各自业务逻辑      │
│   · SSO认证      │     │  各自数据存储      │
│   · 子系统注册   │     │                    │
│   · 审计日志     │     │                    │
└─────────┬────────┘     └──────────┬─────────┘
          │                         │
┌─────────▼────────┐     ┌──────────▼─────────┐
│   PostgreSQL     │     │  各子系统 DB        │
│   (主平台数据)   │     │  (隔离数据库)        │
│                  │     │                    │
│   Redis Cluster  │     │  Redis Cluster     │
│   (会话/缓存)    │     │  (子系统缓存)        │
└──────────────────┘     └────────────────────┘
```

### 2.2 前端技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Vue 3 (Composition API) | 响应式、TypeScript 支持好 |
| UI 库 | Element Plus | 医院场景组件丰富 |
| 状态管理 | Pinia | 轻量、支持持久化 |
| 构建工具 | Vite | 快速冷启动、HMR |
| HTTP 客户端 | Axios + 拦截器 | 统一 Token 注入、自动刷新 |
| 路由 | Vue Router 4 | 嵌套路由、导航守卫 |
| 权限指令 | 自定义 `v-permission` | 按钮级别细粒度控制 |
| 图表 | ECharts | 仪表盘/审计日志可视化 |

### 2.3 后端技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 运行时 | Node.js 20 LTS | 成熟、生态丰富 |
| 框架 | NestJS | 模块化、装饰器驱动、TypeORM 集成好 |
| ORM | TypeORM / Prisma | 类型安全、自动迁移 |
| 数据库 | PostgreSQL 16 | JSONB 支持、副本集支持 |
| 缓存 | Redis 7 Cluster | Token 存储、分布式锁、会话缓存 |
| 消息队列 | RabbitMQ | 异步日志写入、事件通知 |
| 文件存储 | MinIO (S3兼容) | 审计日志附件、用户头像 |
| 搜索 | Elasticsearch | 审计日志全文检索 |
| 容器化 | Docker + Kubernetes | 主平台集群部署 |

### 2.4 主平台 Backend 模块划分

```
src/
├── modules/
│   ├── auth/              # 认证模块（登录/登出/Token/SSO）
│   ├── user/              # 用户管理模块
│   ├── role/              # 角色管理模块
│   ├── menu/              # 菜单/按钮权限模块
│   ├── subsystem/         # 子系统注册与管理模块
│   ├── data-permission/   # 数据权限模块
│   ├── audit/             # 审计日志模块
│   ├── organization/       # 组织架构模块（科室/病区）
│   └── system/             # 系统配置模块
├── common/
│   ├── decorators/        # 自定义装饰器（@RequirePermission）
│   ├── guards/            # 路由守卫（JWT Guard / Permission Guard）
│   ├── interceptors/      # 拦截器（响应格式化/日志/异常）
│   ├── filters/           # 异常过滤器
│   └── middleware/        # 中间件（日志/跨域/限流）
├── libs/
│   ├── sso-sdk/           # 子系统集成SDK（Token验证/菜单拉取）
│   ├── token/             # JWT 生成与验证
│   └── encryption/        # 加密工具（国密SM2/SM4可选）
└── database/
    ├── migrations/        # 数据库迁移脚本
    └── seeds/             # 初始化数据
```

---

## 3. 权限模型设计

### 3.1 RBAC-7 多层权限模型

采用 **RBAC + 数据权限 + 列权限 + 行级权限** 四层扩展的混合模型：

```
┌─────────────────────────────────────────────────────────┐
│                    权限模型分层结构                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Level 1: 用户 ──属于──► 角色 (User → Role)              │
│                多对多关系                                │
│                                                         │
│  Level 2: 角色 ──拥有──► 菜单权限 (Role → MenuPermission)│
│                多对多关系                                │
│                                                         │
│  Level 3: 角色 ──拥有──► 按钮权限 (Role → ButtonPermission)│
│                多对多关系                                │
│                                                         │
│  Level 4: 角色 ──拥有──► API权限 (Role → ApiPermission) │
│                多对多关系                                │
│                                                         │
│  Level 5: 角色 ──关联──► 数据权限 (Role → DataPermission)│
│                数据范围：全部/本部门/本部门及下级/仅本人  │
│                                                         │
│  Level 6: 角色 ──关联──► 子系统权限 (Role → Subsystem)   │
│                决定用户可见哪些子系统图标                  │
│                                                         │
│  Level 7: 用户 ──属于──► 组织架构 (User → Organization)  │
│                组织决定数据权限的数据范围                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 数据权限控制策略

数据权限通过 **组织架构树** 实现行级过滤：

| 数据权限级别 | 范围描述 | SQL 过滤条件示例 |
|------------|---------|----------------|
| **全部数据** | 无限制，可查看所有数据 | `1=1` |
| **本部门数据** | 仅本部门创建的数据 | `created_by.dept_id = :userDeptId` |
| **本部门及下级** | 本部门 + 所有子部门数据 | `created_by.dept_id IN (:userDeptIdTree)` |
| **仅本人数据** | 仅自己创建的数据 | `created_by.user_id = :userId` |
| **自定义** | 按数据权限规则细粒度配置 | `patient.hospital_area IN (:allowedAreas)` |

数据权限在 **应用层** 注入 MyBatis/Hibernate 拦截器，或在查询构建器层面自动追加 `WHERE` 条件：

```typescript
// 查询拦截器示例：在所有查询中自动注入数据权限条件
@Injectable()
export class DataPermissionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const dataScope = this.getDataScope(user); // 解析用户数据权限级别
    const scopeConditions = this.buildConditions(user, dataScope);

    // 将权限条件注入到 query context，供 service 层使用
    request.dataScope = scopeConditions;
    return next.handle();
  }
}
```

### 3.3 权限继承与覆盖

```
角色层级: 超级管理员 > 系统管理员 > 科室主管 > 普通员工

继承规则:
  · 子角色继承父角色所有权限
  · 子角色可细化权限（移除部分父权限）
  · 拒绝权限显式声明，优先级高于继承
  · 拒绝权限语法: Role - Permission (显式拒绝覆盖隐式允许)
```

### 3.4 跨子系统权限继承

```
用户 → 角色集合 → 子系统访问权限 → 子系统内菜单权限

示例场景:
  医生A (角色: 主治医生)
    ├─ [平台级] 可访问 HIS + EMR + LIS + PACS
    ├─ [HIS内] 门诊模块(可写) + 住院模块(只读)
    ├─ [EMR内] 电子病历(创建/编辑本人患者)
    └─ [数据权限] 仅看本科室患者数据

护士B (角色: 门诊护士)
    ├─ [平台级] 可访问 HIS + EMR + LIS
    ├─ [HIS内] 门诊模块(只读) + 输液管理(可写)
    └─ [数据权限] 仅看门诊护理组数据
```

---

## 4. 子系统注册机制

### 4.1 子系统注册流程

```
┌────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│子系统A │    │ 主平台管理员 │    │  主平台DB   │    │   DNS/Nginx  │
└───┬────┘    └──────┬──────┘    └──────┬──────┘    └───────┬──────┘
    │                │                   │                   │
    │ 1.注册申请     │                   │                   │
    │───────────────►│                   │                   │
    │                │ 2.创建子系统记录  │                   │
    │                │──────────────────►│                   │
    │                │ 3.生成appId/appSecret│                  │
    │                │◄──────────────────│                   │
    │ 4.返回凭证      │                   │                   │
    │◄───────────────│                   │                   │
    │                │                   │                   │
    │ 5.配置回调地址   │                   │                   │
    │───────────────►│                   │                   │
    │                │ 6.更新子系统配置    │                   │
    │                │──────────────────►│                   │
    │                │                   │                   │
    │                │ 7.配置子系统域名    │                   │
    │                │───────────────────────────────────────►│
    │                │                   │                   │
    │ 8.健康检查心跳   │                   │                   │
    │─────────────────────────────────────►                   │
```

### 4.2 子系统注册数据结构

```typescript
interface Subsystem {
  id: string;                    // UUID
  code: string;                   // 子系统代码，如 "HIS", "LIS", "PACS"
  name: string;                   // 子系统名称，如 "医院信息系统"
  appId: string;                  // 应用ID（公开）
  appSecret: string;              // 应用密钥（加密存储）
  domain: string;                 // 子系统域名，如 https://his.hosp.com
  callbackUrl: string;            // SSO回调地址
  logo: string;                   // 图标URL
  description: string;
  status: 'pending' | 'active' | 'suspended';  // 注册状态
  authType: 'jwt' | 'oauth2' | 'saml';          // 认证协议
  ssoEnabled: boolean;            // 是否启用SSO
  autoLogoutSync: boolean;        // 是否同步登出
  menuSyncUrl: string;            // 菜单同步接口地址
  healthCheckUrl: string;         // 健康检查接口
  healthCheckInterval: number;   // 健康检查间隔（秒）
  registeredAt: Date;
  registeredBy: string;
  metadata: Record<string, any>; // 扩展元数据
}
```

### 4.3 子系统 SDK 集成

每个子系统通过引入 **主平台 SSO SDK** 实现零侵入集成：

```typescript
// npm package: @hospital-platform/sso-sdk
import { SSOSDK } from '@hospital-platform/sso-sdk';

// 初始化（通常在子系统入口文件中）
const sso = new SSOSDK({
  platformUrl: 'https://idp.hosp.com',    // 主平台地址
  appId: 'his-app-id',
  appSecret: 'his-app-secret',
  debug: false,
});

// 获取当前用户（已登录状态下）
const user = await sso.getCurrentUser();

// 验证Token（所有接口拦截器中调用）
const isValid = await sso.validateToken(token);

// 获取该用户在子系统内的菜单权限
const menus = await sso.getMenus('HIS', {
  roleIds: user.roleIds,
});

// 统一登出（登出后通知主平台）
await sso.logout();

// 监听主平台的强制登出事件
sso.onForceLogout((reason) => {
  // 清除本地会话，重定向到登录页
  localStorage.clear();
  window.location.href = '/login?reason=force_logout';
});
```

### 4.4 菜单同步机制

```
┌────────────┐         ┌──────────────┐         ┌────────────┐
│  主平台     │         │   同步事件    │         │  子系统    │
│  管理员     │         │              │         │            │
└─────┬──────┘         └──────┬───────┘         └─────┬──────┘
      │                       │                        │
      │ 1. 编辑子系统菜单      │                        │
      │──────────────►        │                        │
      │                       │                        │
      │ 2. 发布菜单变更        │                        │
      │──────────────►        │                        │
      │                       │                        │
      │ 3. POST /webhook/menu │                        │
      │───────────────────────────────────────────────►│
      │                       │                        │
      │                       │ 4. 子系统更新本地菜单   │
      │                       │◄───────────────────────│
      │                       │                        │
      │ 5. 可选: 实时拉取模式   │                        │
      │◄───────────────────────────────────────────────│
```

---

## 5. SSO认证流程

### 5.1 完整SSO时序图

```
用户浏览器              主平台                   子系统                    数据库/缓存
   │                     │                        │                          │
   │  1.访问主平台登录页   │                        │                          │
   │────────────────────►│                        │                          │
   │                     │                        │                          │
   │  2.输入用户名/密码    │                        │                          │
   │────────────────────►│                        │                          │
   │                     │ 3.验证凭证              │                          │
   │                     │────────────────────────────────────────────────►│
   │                     │◄────────────────────────────────────────────────│
   │                     │ 4.生成多Token                                    │
   │                     │────────────────────────────────────────────────►│
   │                     │                         │                          │
   │  5.返回 Token + RefreshToken + 子系统列表     │                          │
   │◄────────────────────│                         │                          │
   │                     │                         │                          │
   │  6.携带 access_token 访问子系统接口            │                          │
   │──────────────────────────────────────────────►│                          │
   │                     │                        │ 7.验Token (共享密钥/公钥)  │
   │                     │                         │─────────────►             │
   │                     │                         │◄─────────────│            │
   │                     │                         │                          │
   │  8.返回子系统资源     │                        │                          │
   │◄──────────────────────────────────────────────│                          │
   │                     │                         │                          │
   │  9.access_token 过期，携带 refresh_token 刷新  │                          │
   │────────────────────►│                        │                          │
   │                     │ 10.验证refresh_token    │                          │
   │                     │────────────────────────────────────────────────►│
   │                     │ 11.生成新access_token    │                          │
   │                     │────────────────────────────────────────────────►│
   │  12.返回新 tokens    │                        │                          │
   │◄────────────────────│                         │                          │
```

### 5.2 Token 设计

```typescript
// Access Token Payload (JWT)
interface AccessToken {
  sub: string;           // 用户ID
  name: string;          // 用户姓名
  deptId: string;        // 科室ID
  deptName: string;      // 科室名称
  roleIds: string[];     // 角色ID列表
  dataScope: number;     // 数据权限级别 (1=全部 2=本部门 3=本部门及下级 4=仅本人)
  subsystemCodes: string[];  // 有权限的子系统代码列表
  iss: string;           // 签发者: "hospital-idp"
  aud: string;           // 受众: "all" 或具体子系统代码
  iat: number;           // 签发时间
  exp: number;           // 过期时间 (默认 15 分钟)
  jti: string;           // Token唯一ID (用于撤销)
  type: 'access';        // Token类型
}

// Refresh Token (存 Redis，不暴露给前端)
// 前端只持有 refresh_token 的引用ID
interface RefreshTokenRecord {
  tokenId: string;       // refresh_token 的 JTI
  userId: string;
  roles: string[];
  createdAt: number;
  expiresAt: number;     // 默认 7 天
  deviceInfo: string;    // 设备信息
}
```

### 5.3 Token 生命周期

| Token 类型 | 有效期 | 存储位置 | 刷新方式 |
|-----------|-------|---------|---------|
| Access Token | 15 分钟 | 内存 / sessionStorage | 自动刷新 |
| Refresh Token | 7 天 | HttpOnly Cookie / Redis | 每次刷新更新 |
| 子系统 Ticket | 30 秒（一次性） | URL 参数 | 不需要刷新 |

### 5.4 子系统 Ticket 模式（可选 SAML-like）

对于不支持 JWT 共享密钥的旧子系统，采用 **Ticket 交换模式**：

```
1. 用户在主平台点击子系统图标
2. 主平台生成一次性 Ticket（有效期30秒），写入 Redis
3. 跳转到: https://his.hosp.com/sso/callback?ticket=xxxxx
4. 子系统用 Ticket 调用主平台接口换 Token
5. 主平台验证 Ticket，销毁 Ticket，返回子系统 Token
6. 子系统用 Token 建立本地会话
```

### 5.5 跨域处理

```
场景: 主平台 (idp.hosp.com) → 子系统 (his.hosp.com)

方案: Token 存 HttpOnly Cookie（主域名设置）

  Set-Cookie: idp_token=<jwt>; Domain=.hosp.com; HttpOnly; Secure; SameSite=Lax; Max-Age=900

子系统读取: 通过主平台提供的 /sso/tokeninfo 接口查询用户信息
  （避免子域直接读取主域 Cookie）

跨域请求:
  · API 调用走 API Gateway（统一域名），避免跨域
  · 子系统前端 → 子系统后端：无跨域（同域）
  · 子系统后端 → 主平台后端：通过内部网络/VPN
```

---

## 6. 数据库设计

### 6.1 ER 关系图

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  组织架构表   │       │     用户表        │       │  子系统表     │
│organization │       │     sys_user      │       │ sys_subsystem│
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)           │       │ id (PK)       │
│ parent_id    │   │   │ username         │       │ code          │
│ name         │   │   │ password_hash    │       │ name          │
│ code         │   │   │ real_name        │       │ app_id        │
│ level        │   └──►│ org_id (FK)       │       │ app_secret    │
│ sort_order   │       │ phone             │       │ domain        │
│ type         │       │ email             │       │ status        │
└──────────────┘       │ status            │       │ ...           │
       │               │ is_first_login   │       └───────┬───────┘
       │               │ password_expire  │               │
       │               │ last_login_at    │               │
       │               └───────┬──────────┘               │
       │                       │                           │
       │               ┌────────┴──────────┐               │
       │               │                   │               │
       │         ┌─────▼───────┐   ┌───────▼──────┐         │
       │         │用户子系统关联│   │ 用户子系统关联│         │
       │         │user_subsystem│   │subsys_role_map│        │
       │         └─────┬───────┘   └───────┬──────┘         │
       │               │                   │               │
       │               │                   │               │
┌──────▼──────┐         │                   │         ┌──────▼──────┐
│   角色表     │         │                   │         │ 子系统角色表 │
│  sys_role   │         │                   │         │subsys_role │
├──────────────┤         │                   │         ├─────────────┤
│ id (PK)      │◄────────┴─────────┐   ┌─────►│ id (PK)  │
│ name         │                   │   │      │ subsystem_id│
│ code         │                   │   │      │ code        │
│ level        │                   │   │      │ name        │
│ description  │                   │   │      │ description │
│ is_system    │                   │   │      └─────────────┘
│ data_scope   │                   │   │             │
└──────┬───────┘                   │   │             │
       │                           │   │             │
       │  ┌─────────────────────────┴───┴──────────┐ │
       │  │        用户-角色关联表 user_role        │ │
       │  ├────────────────────────────────────────┤ │
       │  │ user_id (FK)  │  role_id (FK)           │ │
       │  └─────────────────────────────────────────┘ │
       │                                                 │
       │  ┌──────────────────────────┐                   │
       │  │      角色-子系统关联      │                   │
       │  │   role_subsystem_map    │                   │
       │  ├──────────────────────────┤                   │
       │  │ role_id (FK)             │◄──────────────────┘
       │  │ subsystem_id (FK)        │
       │  │ subsystem_code           │
       │  └──────────────────────────┘
       │
       │
┌──────▼────────────────────────────┐
│         菜单/按钮权限表           │
│         sys_menu                  │
├───────────────────────────────────┤
│ id (PK)                           │
│ parent_id                         │
│ subsystem_id (FK)  ──────────────┐│
│ name                             ││
│ code (唯一标识)                   ││
│ path                             ││
│ component                         ││
│ icon                             ││
│ sort_order                       ││
│ type: 'menu'|'button'|'api'      ││
│ permission                       ││  (如: "his:patient:create")
│ is_visible                        │
│ is_cached                         │
│ is_frame                          │
└──────┬────────────────────────────┘
       │
       │  ┌────────────────────────────────────────────┐
       │  │         角色-菜单权限关联表                  │
       │  │         role_menu_map                      │
       │  ├────────────────────────────────────────────┤
       │  │ id                                         │
       │  │ role_id (FK)                               │
       │  │ menu_id (FK)                               │
       │  │ permission_type: '可见'|'操作'|'拒绝'      │
       │  └────────────────────────────────────────────┘
       │
       │  ┌────────────────────────────────────────────┐
       │  │         数据权限规则表                       │
       │  │         data_permission_rule               │
       │  ├────────────────────────────────────────────┤
       │  │ id                                         │
       │  │ role_id (FK)                               │
       │  │ entity_type: 'patient'|'order'|'report'... │
       │  │ field_name: 'dept_id'                      │
       │  │ operator: 'eq'|'in'|'like'|'between'       │
       │  │ value_type: 'fixed'|'sql'|'expression'     │
       │  │ value                                      │
       │  └────────────────────────────────────────────┘
       │
       │  ┌────────────────────────────────────────────┐
       │  │         审计日志表                           │
       │  │         sys_audit_log                       │
       │  ├────────────────────────────────────────────┤
       │  │ id                                         │
       │  │ user_id (FK)                               │
       │  │ username                                   │
       │  │ subsystem_code                             │
       │  │ action                                     │
       │  │ module                                     │
       │  │ ip_address                                 │
       │  │ user_agent                                 │
       │  │ request_method                             │
       │  │ request_url                                │
       │  │ request_params (JSONB)                    │
       │  │ response_code                              │
       │  │ duration_ms                                │
       │  │ error_message                              │
       │  │ created_at                                 │
       │  └────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   子系统菜单权限扩展表                      │
│              subsystem_menu_permission                    │
├──────────────────────────────────────────────────────────┤
│ id                                                        │
│ subsystem_id (FK)                                         │
│ parent_id                                                 │
│ name                                                      │
│ code                                                      │
│ path                                                      │
│ icon                                                      │
│ sort_order                                                │
│ permission_code (按钮级: "his:patient:view")              │
│ permission_type: 'page'|'button'|'column'                │
│ data_rule_ids (关联数据权限规则)                           │
│ created_at                                                │
└──────────────────────────────────────────────────────────┘
```

### 6.2 核心表结构 DDL

```sql
-- ===============================================================
-- 1. 组织架构表 (支持树形结构)
-- ===============================================================
CREATE TABLE sys_organization (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID REFERENCES sys_organization(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,
    level           SMALLINT NOT NULL DEFAULT 1,
    sort_order      SMALLINT DEFAULT 0,
    type            VARCHAR(20) NOT NULL,  -- 'hospital'|'department'|'ward'|'group'
    status          SMALLINT DEFAULT 1,     -- 1=正常 0=停用
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_org_parent ON sys_organization(parent_id);
CREATE INDEX idx_org_code ON sys_organization(code);

-- ===============================================================
-- 2. 用户表
-- ===============================================================
CREATE TABLE sys_user (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    real_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(100),
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    org_id          UUID REFERENCES sys_organization(id),
    status          SMALLINT DEFAULT 1,     -- 1=正常 2=停用 3=锁定
    is_first_login  BOOLEAN DEFAULT TRUE,
    password_expire_at TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    login_fail_count SMALLINT DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_org ON sys_user(org_id);
CREATE INDEX idx_user_username ON sys_user(username);
CREATE INDEX idx_user_status ON sys_user(status);

-- ===============================================================
-- 3. 角色表
-- ===============================================================
CREATE TABLE sys_role (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,
    level           SMALLINT DEFAULT 5,    -- 角色层级 1=最高 10=最低
    description     VARCHAR(500),
    data_scope      SMALLINT DEFAULT 4,     -- 1=全部 2=本部门 3=本部门及下级 4=仅本人
    is_system       BOOLEAN DEFAULT FALSE,  -- 系统内置角色不可删除
    status          SMALLINT DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_role_code ON sys_role(code);

-- ===============================================================
-- 4. 子系统表
-- ===============================================================
CREATE TABLE sys_subsystem (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE NOT NULL,  -- HIS, LIS, PACS...
    name            VARCHAR(100) NOT NULL,
    app_id          VARCHAR(100) UNIQUE NOT NULL,
    app_secret_hash VARCHAR(255) NOT NULL,        -- 加密存储
    domain          VARCHAR(500) NOT NULL,
    logo_url        VARCHAR(500),
    description     VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'pending', -- pending|active|suspended
    auth_type       VARCHAR(20) DEFAULT 'jwt',     -- jwt|oauth2|saml|ticket
    sso_enabled     BOOLEAN DEFAULT TRUE,
    auto_logout_sync BOOLEAN DEFAULT TRUE,
    menu_sync_url   VARCHAR(500),
    callback_url    VARCHAR(500),
    health_check_url VARCHAR(500),
    health_check_interval INT DEFAULT 60,
    last_health_at  TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    registered_at   TIMESTAMPTZ DEFAULT NOW(),
    registered_by   UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subsystem_code ON sys_subsystem(code);
CREATE INDEX idx_subsystem_status ON sys_subsystem(status);

-- ===============================================================
-- 5. 用户-角色关联表
-- ===============================================================
CREATE TABLE sys_user_role (
    user_id         UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ===============================================================
-- 6. 角色-子系统关联表
-- ===============================================================
CREATE TABLE sys_role_subsystem (
    role_id         UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
    subsystem_id    UUID NOT NULL REFERENCES sys_subsystem(id) ON DELETE CASCADE,
    status          SMALLINT DEFAULT 1,     -- 1=授权 0=禁用
    granted_at      TIMESTAMPTZ DEFAULT NOW(),
    granted_by      UUID,
    PRIMARY KEY (role_id, subsystem_id)
);

-- ===============================================================
-- 7. 全局菜单表（主平台维护的子系统菜单元数据）
-- ===============================================================
CREATE TABLE sys_menu (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID REFERENCES sys_menu(id) ON DELETE CASCADE,
    subsystem_id    UUID REFERENCES sys_subsystem(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(100) NOT NULL,  -- 唯一标识: his:patient:list
    path            VARCHAR(255),
    component       VARCHAR(255),
    redirect        VARCHAR(255),
    icon            VARCHAR(100),
    sort_order      SMALLINT DEFAULT 0,
    type            VARCHAR(20) DEFAULT 'menu', -- menu|button|api|directory
    permission      VARCHAR(100),             -- 权限标识: system:user:create
    is_visible      BOOLEAN DEFAULT TRUE,
    is_cache        BOOLEAN DEFAULT FALSE,
    is_frame        BOOLEAN DEFAULT FALSE,
    status          SMALLINT DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subsystem_id, code)
);
CREATE INDEX idx_menu_parent ON sys_menu(parent_id);
CREATE INDEX idx_menu_subsystem ON sys_menu(subsystem_id);
CREATE INDEX idx_menu_code ON sys_menu(code);

-- ===============================================================
-- 8. 角色-菜单权限关联表
-- ===============================================================
CREATE TABLE sys_role_menu (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
    menu_id         UUID NOT NULL REFERENCES sys_menu(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) DEFAULT 'visible',  -- visible|operate|deny
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, menu_id, permission_type)
);

-- ===============================================================
-- 9. 数据权限规则表
-- ===============================================================
CREATE TABLE sys_data_permission_rule (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
    subsystem_id    UUID REFERENCES sys_subsystem(id),
    entity_type     VARCHAR(100) NOT NULL,    -- 实体类型: patient, order, lab_report
    field_name      VARCHAR(100) NOT NULL,    -- 过滤字段: dept_id, doctor_id
    operator        VARCHAR(20) NOT NULL,    -- eq, ne, gt, lt, in, not_in, like, between
    value_type      VARCHAR(20) NOT NULL,    -- fixed, sql, expression, current_user
    value           TEXT,                      -- 固定值或表达式
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dpr_role ON sys_data_permission_rule(role_id);

-- ===============================================================
-- 10. 审计日志表
-- ===============================================================
CREATE TABLE sys_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES sys_user(id),
    username        VARCHAR(50) NOT NULL,
    real_name       VARCHAR(100),
    subsystem_code  VARCHAR(50),
    module          VARCHAR(50),
    action          VARCHAR(100) NOT NULL,
    description     TEXT,
    request_method  VARCHAR(10),
    request_url     VARCHAR(500),
    request_params  JSONB,
    request_body    JSONB,
    response_code   SMALLINT,
    response_body   JSONB,
    ip_address      INET,
    user_agent      VARCHAR(500),
    device_info     VARCHAR(255),
    duration_ms     INTEGER,
    error_message   TEXT,
    session_id      VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON sys_audit_log(user_id);
CREATE INDEX idx_audit_subsystem ON sys_audit_log(subsystem_code);
CREATE INDEX idx_audit_action ON sys_audit_log(action);
CREATE INDEX idx_audit_created ON sys_audit_log(created_at DESC);
-- 分区表策略: 按月分区 (PostgreSQL native partitioning)
CREATE TABLE sys_audit_log_2026_04 PARTITION OF sys_audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- ===============================================================
-- 11. Token 黑名单表 (用于强制登出)
-- ===============================================================
CREATE TABLE sys_token_blacklist (
    token_jti       VARCHAR(100) PRIMARY KEY,
    user_id         UUID NOT NULL,
    revoked_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_blacklist_expires ON sys_token_blacklist(expires_at);

-- ===============================================================
-- 12. 子系统菜单同步记录表
-- ===============================================================
CREATE TABLE sys_subsystem_menu_sync (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsystem_id    UUID NOT NULL REFERENCES sys_subsystem(id),
    menu_snapshot   JSONB NOT NULL,
    sync_version    BIGINT NOT NULL,
    synced_at       TIMESTAMPTZ DEFAULT NOW(),
    status          VARCHAR(20) DEFAULT 'success'
);

-- ===============================================================
-- 13. 用户会话表 (支持多设备登录管理)
-- ===============================================================
CREATE TABLE sys_user_session (
    session_id      VARCHAR(100) PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    refresh_token_jti VARCHAR(100) NOT NULL,
    device_info    VARCHAR(255),
    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_session_user ON sys_user_session(user_id);
CREATE INDEX idx_session_expires ON sys_user_session(expires_at);
```

### 6.3 索引策略

```sql
-- 复合索引优化
CREATE INDEX idx_user_role_composite ON sys_user_role(user_id, role_id);
CREATE INDEX idx_role_menu_composite ON sys_role_menu(role_id, menu_id);

-- 审计日志分区自动管理 (每月)
CREATE OR REPLACE FUNCTION create_audit_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    partition_name := 'sys_audit_log_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := partition_date;
    end_date := partition_date + INTERVAL '1 month';

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF sys_audit_log
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 7. API接口设计

### 7.1 接口规范

```
Base URL: https://idp.hosp.com/api/v1

认证头: Authorization: Bearer <access_token>
       X-App-Id: <子系统appId>
       X-Request-Id: <请求追踪ID>
       X-Timestamp: <Unix时间戳>
       X-Signature: <HMAC-SHA256签名>

响应格式:
{
  "code": 0,          // 0=成功，非0=错误码
  "message": "success",
  "data": {},
  "timestamp": 1712000000000,
  "requestId": "uuid"
}

分页格式:
{
  "code": 0,
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 7.2 核心接口清单

#### 认证模块 (`/api/v1/auth`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | `/auth/login` | 用户名密码登录 | 公开 |
| POST | `/auth/logout` | 登出 | 登录用户 |
| POST | `/auth/refresh` | 刷新Token | refresh_token |
| GET | `/auth/userinfo` | 获取当前用户信息 | 登录用户 |
| POST | `/auth/change-password` | 修改密码 | 登录用户 |
| POST | `/auth/sso/ticket` | 生成SSO Ticket（一次性） | 登录用户 |
| GET | `/auth/sso/exchange/{ticket}` | 交换Ticket获取子系统Token | 子系统回调 |
| GET | `/auth/sso/menu/{subsystemCode}` | 获取子系统菜单（带权限过滤） | 登录用户 |
| POST | `/auth/sso/validate` | 子系统验Token | 子系统内部调用 |
| POST | `/auth/sso/force-logout` | 主平台强制登出通知 | 主平台内部 |

#### 用户管理模块 (`/api/v1/users`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/users` | 分页查询用户列表 | platform:user:list |
| GET | `/users/{id}` | 获取用户详情 | platform:user:view |
| POST | `/users` | 创建用户 | platform:user:create |
| PUT | `/users/{id}` | 更新用户 | platform:user:update |
| DELETE | `/users/{id}` | 删除用户（软删除） | platform:user:delete |
| PUT | `/users/{id}/status` | 启用/禁用用户 | platform:user:update |
| GET | `/users/{id}/roles` | 获取用户角色列表 | platform:user:view |
| PUT | `/users/{id}/roles` | 分配用户角色 | platform:user:assign |
| GET | `/users/{id}/menus` | 获取用户菜单权限树 | 登录用户本人 |
| PUT | `/users/{id}/reset-password` | 重置密码 | platform:user:resetpwd |
| GET | `/users/{id}/sessions` | 查询用户登录会话 | platform:user:view |
| DELETE | `/sessions/{sessionId}` | 强制下线指定会话 | platform:user:logout |

#### 角色管理模块 (`/api/v1/roles`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/roles` | 查询角色列表 | platform:role:list |
| GET | `/roles/{id}` | 获取角色详情 | platform:role:view |
| POST | `/roles` | 创建角色 | platform:role:create |
| PUT | `/roles/{id}` | 更新角色 | platform:role:update |
| DELETE | `/roles/{id}` | 删除角色 | platform:role:delete |
| GET | `/roles/{id}/menus` | 获取角色菜单权限树 | platform:role:view |
| PUT | `/roles/{id}/menus` | 分配角色菜单权限 | platform:role:assign |
| GET | `/roles/{id}/users` | 获取角色下用户列表 | platform:role:view |
| GET | `/roles/{id}/data-permissions` | 获取角色数据权限 | platform:role:view |
| PUT | `/roles/{id}/data-permissions` | 配置角色数据权限 | platform:role:config |
| GET | `/roles/{id}/subsystems` | 获取角色子系统授权 | platform:role:view |
| PUT | `/roles/{id}/subsystems` | 分配角色子系统授权 | platform:role:assign |

#### 菜单管理模块 (`/api/v1/menus`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/menus` | 获取完整菜单树 | platform:menu:list |
| GET | `/menus/tree` | 获取菜单树（树形结构） | platform:menu:list |
| GET | `/menus/{id}` | 获取菜单详情 | platform:menu:view |
| POST | `/menus` | 创建菜单/按钮 | platform:menu:create |
| PUT | `/menus/{id}` | 更新菜单 | platform:menu:update |
| DELETE | `/menus/{id}` | 删除菜单 | platform:menu:delete |
| GET | `/menus/by-subsystem/{subsystemCode}` | 获取子系统菜单 | 登录用户 |

#### 子系统管理模块 (`/api/v1/subsystems`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/subsystems` | 查询子系统列表 | platform:subsystem:list |
| GET | `/subsystems/{id}` | 获取子系统详情 | platform:subsystem:view |
| POST | `/subsystems` | 注册子系统 | platform:subsystem:register |
| PUT | `/subsystems/{id}` | 更新子系统配置 | platform:subsystem:update |
| PUT | `/subsystems/{id}/status` | 启用/停用子系统 | platform:subsystem:manage |
| DELETE | `/subsystems/{id}` | 删除子系统注册 | platform:subsystem:delete |
| POST | `/subsystems/{id}/secret/rotate` | 轮换应用密钥 | platform:subsystem:manage |
| GET | `/subsystems/{id}/health` | 健康检查状态 | 公开 |
| GET | `/subsystems/{id}/menus` | 获取子系统菜单配置 | platform:subsystem:view |
| POST | `/subsystems/{id}/menus/sync` | 触发菜单同步 | 内部 |
| GET | `/subsystems/accessible` | 获取当前用户可访问子系统列表 | 登录用户 |
| POST | `/subsystems/{id}/webhook/menu` | 菜单变更Webhook推送 | 子系统回调 |

#### 审计日志模块 (`/api/v1/audit`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/audit/logs` | 分页查询审计日志 | platform:audit:list |
| GET | `/audit/logs/export` | 导出审计日志 | platform:audit:export |
| GET | `/audit/logs/{id}` | 查看日志详情 | platform:audit:view |
| GET | `/audit/stats` | 审计统计仪表盘 | platform:audit:view |
| GET | `/audit/login-history` | 登录历史 | platform:audit:view |

#### 组织架构模块 (`/api/v1/organizations`)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/organizations` | 查询组织树 | platform:org:list |
| GET | `/organizations/{id}` | 获取组织详情 | platform:org:view |
| POST | `/organizations` | 创建组织节点 | platform:org:create |
| PUT | `/organizations/{id}` | 更新组织节点 | platform:org:update |
| DELETE | `/organizations/{id}` | 删除组织节点 | platform:org:delete |
| GET | `/organizations/{id}/users` | 获取组织下用户 | platform:org:view |

### 7.3 关键接口详细设计

#### 7.3.1 登录接口

```typescript
// POST /api/v1/auth/login
// Request
{
  "username": "dr.zhang",
  "password": "EncryptedPassword",
  "captchaToken": "google-recaptcha-token",
  "deviceInfo": {
    "deviceId": "uuid",
    "deviceType": "web",
    "browser": "Chrome 120",
    "os": "Windows 11",
    "ip": "10.0.0.100"
  }
}

// Response
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "rt_xxxxx",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshExpiresIn": 604800,
    "user": {
      "id": "uuid",
      "username": "dr.zhang",
      "realName": "张医生",
      "email": "zhang@hospital.com",
      "phone": "13800138000",
      "orgId": "dept-uuid",
      "orgName": "心内科",
      "roles": [
        { "id": "role-uuid", "name": "主治医生", "code": "attending_physician" }
      ],
      "avatarUrl": "https://..."
    },
    "subsystems": [
      {
        "id": "subsys-uuid",
        "code": "HIS",
        "name": "医院信息系统",
        "domain": "https://his.hosp.com",
        "logo": "https://cdn.hosp.com/logos/his.svg",
        "ssoUrl": "https://his.hosp.com/sso/login?ticket=xxxx"
      },
      {
        "id": "subsys-uuid-2",
        "code": "LIS",
        "name": "检验信息系统",
        "domain": "https://lis.hosp.com",
        "logo": "https://cdn.hosp.com/logos/lis.svg",
        "ssoUrl": "https://lis.hosp.com/sso/login?ticket=xxxx"
      }
    ],
    "permissions": [
      "his:patient:view",
      "his:patient:create",
      "emr:record:view",
      "emr:record:edit"
    ]
  }
}
```

#### 7.3.2 子系统Token验证接口

```typescript
// POST /api/v1/auth/sso/validate
// Request (子系统后端调用，带签名)
{
  "token": "eyJhbGci...",
  "appId": "his-app-id",
  "timestamp": 1712000000000,
  "signature": "HMAC-SHA256(token+timestamp, appSecret)"
}

// Response
{
  "code": 0,
  "data": {
    "valid": true,
    "userId": "user-uuid",
    "username": "dr.zhang",
    "realName": "张医生",
    "orgId": "dept-uuid",
    "orgName": "心内科",
    "roleIds": ["role-uuid"],
    "permissions": ["his:patient:view", "his:patient:create"],
    "dataScope": 3,
    "subsystemCode": "HIS",
    "exp": 1712000900000,
    "dataRules": [
      {
        "entity": "patient",
        "field": "dept_id",
        "operator": "in",
        "value": ["dept-uuid", "dept-child-1", "dept-child-2"]
      }
    ]
  }
}
```

#### 7.3.3 获取用户菜单树接口

```typescript
// GET /api/v1/auth/sso/menu/{subsystemCode}
// Response
{
  "code": 0,
  "data": {
    "subsystemCode": "HIS",
    "subsystemName": "医院信息系统",
    "menuTree": [
      {
        "id": "menu-uuid-1",
        "name": "门诊管理",
        "path": "/outpatient",
        "icon": "stethoscope",
        "children": [
          {
            "id": "menu-uuid-2",
            "name": "患者列表",
            "path": "/outpatient/patients",
            "component": "/views/outpatient/patients/index.vue",
            "children": [
              {
                "id": "menu-uuid-3",
                "name": "新建患者",
                "path": null,
                "type": "button",
                "permission": "his:patient:create",
                "actionType": "primary"
              },
              {
                "id": "menu-uuid-4",
                "name": "编辑患者",
                "path": null,
                "type": "button",
                "permission": "his:patient:update",
                "actionType": "default"
              },
              {
                "id": "menu-uuid-5",
                "name": "删除患者",
                "path": null,
                "type": "button",
                "permission": "his:patient:delete",
                "actionType": "danger"
              }
            ]
          }
        ]
      }
    ],
    "permissions": ["his:patient:*"],
    "generatedAt": "2026-04-03T10:00:00Z"
  }
}
```

---

## 8. 前端架构设计

### 8.1 主平台前端架构

```
src/
├── api/                    # API 接口封装
│   ├── auth.ts             # 认证相关接口
│   ├── user.ts             # 用户管理接口
│   ├── role.ts             # 角色管理接口
│   ├── menu.ts             # 菜单管理接口
│   ├── subsystem.ts        # 子系统管理接口
│   └── audit.ts            # 审计日志接口
│
├── components/             # 通用组件库
│   ├── common/             # 基础组件
│   │   ├── AppHeader.vue   # 应用头部（含主题切换）
│   │   ├── AppSidebar.vue  # 侧边导航
│   │   ├── AppBreadcrumb.vue
│   │   └── AppFooter.vue
│   ├── permission/         # 权限相关组件
│   │   ├── PermissionButton.vue  # 权限按钮（自动隐藏无权限按钮）
│   │   ├── PermissionColumn.vue  # 数据列权限控制
│   │   └── PermissionGate.vue    # 权限门禁（条件渲染）
│   ├── theme/              # 主题切换
│   │   ├── ThemeToggle.vue
│   │   └── themeConfig.ts
│   ├── subsystem/         # 子系统展示
│   │   ├── SubsystemGrid.vue
│   │   └── SubsystemCard.vue
│   └── audit/              # 审计日志组件
│       ├── AuditLogTable.vue
│       └── AuditTimeline.vue
│
├── composables/            # 组合式函数
│   ├── usePermission.ts    # 权限判断逻辑
│   ├── useUser.ts          # 用户信息
│   ├── useSubsystem.ts     # 子系统列表
│   ├── useDataScope.ts     # 数据权限
│   ├── useTheme.ts         # 主题管理
│   └── useAudit.ts         # 审计日志写入
│
├── layouts/
│   ├── MainLayout.vue      # 主布局
│   ├── BlankLayout.vue     # 空白布局（登录页）
│   └── SubsystemLayout.vue # 子系统SSO入口布局
│
├── router/
│   ├── index.ts            # 路由实例
│   ├── guards.ts           # 路由守卫
│   └── routes/
│       ├── static.ts       # 静态路由（登录页等）
│       ├── dynamic.ts      # 动态路由（从后端加载）
│       └── permission.ts   # 权限路由（权限过滤）
│
├── stores/                 # Pinia 状态管理
│   ├── user.ts             # 用户状态
│   ├── permission.ts       # 权限状态（菜单树）
│   ├── subsystem.ts        # 子系统列表
│   ├── theme.ts            # 主题状态
│   └── audit.ts            # 审计缓冲
│
├── styles/
│   ├── variables.css       # CSS 变量（主题色、间距、字体）
│   ├── element-plus-overrides.css  # Element Plus 主题覆盖
│   ├── main.css            # 全局样式
│   └── animations.css      # 过渡动画
│
├── utils/
│   ├── request.ts          # Axios 封装（Token 注入/刷新/重试）
│   ├── storage.ts          # 存储工具（sessionStorage/safe-json-parse）
│   ├── validation.ts        # 表单验证规则
│   └── audit-client.ts     # 前端审计日志写入器
│
├── views/
│   ├── login/
│   │   └── index.vue       # 登录页
│   ├── dashboard/
│   │   └── index.vue       # 仪表盘
│   ├── system-management/  # 系统管理
│   │   ├── user/           # 用户管理
│   │   ├── role/           # 角色管理
│   │   ├── menu/           # 菜单管理
│   │   └── subsystem/      # 子系统管理
│   ├── audit/
│   │   ├── log-list.vue    # 日志列表
│   │   └── log-detail.vue  # 日志详情
│   └── subsystem-access/
│       └── index.vue       # 子系统访问入口页
│
├── App.vue
└── main.ts
```

### 8.2 动态路由加载流程

```
应用启动
   │
   ▼
┌──────────────────┐
│ 路由守卫: beforeEach
│ 验证 Token 有效性
└────────┬─────────┘
          │
    ┌─────┴─────┐
    │ Token有效  │ Token无效
    │           │
    ▼           ▼
┌──────────┐  ┌──────────┐
│ 从 Pinia  │  │ 跳转登录页 │
│ 读取菜单树 │  └──────────┘
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ 动态注册路由      │
│ 基于权限过滤菜单  │
│ 生成侧边栏菜单    │
└────────┬─────────┘
          │
          ▼
    渲染目标页面
```

### 8.3 Token 自动刷新机制

```typescript
// utils/request.ts 核心逻辑
const request = axios.create({ baseURL: '/api/v1', timeout: 15000 });

let isRefreshing = false;
let refreshSubscribers: Function[] = [];

// 订阅 Token 刷新后的请求
function subscribeTokenRefresh(callback: Function) {
  refreshSubscribers.push(callback);
}

// 通知所有等待的请求 Token 已刷新
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

request.interceptors.request.use(async (config) => {
  const token = getAccessToken();
  if (token && isTokenExpiringSoon(token)) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        onTokenRefreshed(newToken);
      } catch {
        refreshSubscribers = [];
        redirectToLogin();
      } finally {
        isRefreshing = false;
      }
    }
    // 队列当前请求，等待刷新完成后自动重试
    return new Promise(resolve => {
      subscribeTokenRefresh((newToken: string) => {
        config.headers.Authorization = `Bearer ${newToken}`;
        resolve(config);
      });
    });
  }
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 失效，强制跳转登录
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

### 8.4 权限指令与组合式函数

```typescript
// v-permission 指令：按钮级权限控制
// 使用方式: <el-button v-permission="'his:patient:create'">新建</el-button>

// composables/usePermission.ts
export function usePermission() {
  const permissionStore = usePermissionStore();

  // 检查是否有指定权限
  const hasPermission = (permission: string | string[]): boolean => {
    if (typeof permission === 'string') {
      return permissionStore.permissions.includes(permission);
    }
    // 数组：有一项即可
    return permission.some(p => permissionStore.permissions.includes(p));
  };

  // 检查是否拥有所有列出的权限
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => permissionStore.permissions.includes(p));
  };

  // 获取用户在指定子系统的菜单
  const getSubsystemMenus = (subsystemCode: string): MenuItem[] => {
    return permissionStore.menuTree
      .filter(m => m.subsystemCode === subsystemCode)
      .flatMap(m => flattenMenu(m));
  };

  return { hasPermission, hasAllPermissions, getSubsystemMenus };
}
```

### 8.5 子系统集成 SDK

```typescript
// 子系统使用方式（main.ts 入口）
import { createSSOApp } from '@hospital-platform/sso-sdk';

const app = createSSOApp({
  platformUrl: 'https://idp.hosp.com',
  appId: 'his-app-id',
  router,        // Vue Router 实例
  store,         // Pinia 实例
  permissionCode: 'his',  // 子系统编码
});

app.mount('#app');
```

SDK 自动完成：
1. Token 验证与刷新
2. 路由守卫（无Token重定向到子系统登录页或主平台）
3. 权限指令注册
4. 菜单数据预加载
5. 强制登出事件监听
6. 审计日志上报通道

---

## 9. 安全加固方案

### 9.1 医院场景安全合规对照

| 需求项 | 等保2.0 要求 | HIPAA 要求 | 我们的实现 |
|--------|------------|-----------|-----------|
| 身份鉴别 | 三权分立，多因素认证 | 唯一用户标识，访问控制 | MFA支持（可选），会话管理 |
| 访问控制 | 基于角色的访问控制，细粒度授权 | PHI最小必要原则 | RBAC+数据权限+按钮级控制 |
| 安全审计 | 操作日志全覆盖，不可篡改 | 访问记录保留6年 | PostgreSQL只写，审计日志分区 |
| 数据加密 | 传输加密（TLS1.2+），存储加密 | PHI加密传输存储 | TLS + AES/SM4可选 |
| 通信安全 | API签名，跨域控制 | API认证鉴权 | HMAC签名，请求追踪 |
| 应急响应 | 强制登出，安全事件告警 | 违规行为调查 | Token撤销，告警通知 |
| 数据脱敏 | 敏感信息脱敏展示 | PHI脱敏 | 字段级脱敏规则引擎 |

### 9.2 多因素认证（MFA）

```typescript
// 登录流程增强
interface MFAMethod {
  type: 'totp' | 'sms' | 'email' | 'wechat';
  enabled: boolean;
  priority: number;
}

// 高权限操作二次验证
const mfaRequirement = {
  // 修改核心权限需MFA
  'role:grant:admin': { requireMfa: true, mfaMethods: ['totp', 'sms'] },
  // 系统参数修改需MFA
  'system:config:update': { requireMfa: true, mfaMethods: ['totp'] },
  // 批量删除需MFA
  'user:batch:delete': { requireMfa: true, mfaMethods: ['totp', 'sms'] },
  // 审计日志导出需MFA（防止数据批量泄露）
  'audit:export': { requireMfa: true, mfaMethods: ['totp'] }
};
```

### 9.3 安全防护矩阵

```
┌─────────────────────────────────────────────────────────────┐
│                      安全防护层次                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1 网络层                                                   │
│  ├─ WAF (Web应用防火墙): 防护SQL注入/XSS/CSRF               │
│  ├─ API Gateway: 限流(100req/s/用户)/熔断/黑白名单           │
│  └─ VPC/安全组: 主平台与子系统网络隔离                       │
│                                                             │
│  L2 应用层                                                   │
│  ├─ HMAC 请求签名: 所有API必须带签名（防篡改）               │
│  ├─ 请求限流: 登录10次/分钟，敏感操作5次/分钟               │
│  ├─ 密码策略: 12位+大小写+数字+特殊字符，90天过期            │
│  ├─ 会话管理: 并发会话限制(5设备)，强制单点登出              │
│  └─ 敏感操作审批: 高危操作需二次审批（如批量授权）           │
│                                                             │
│  L3 数据层                                                   │
│  ├─ 字段级加密: 手机号、身份证、诊断结论等PHI字段加密存储     │
│  ├─ 数据脱敏: 列表页手机号138****1234，身份证脱敏显示        │
│  ├─ 审计日志只写: 无UPDATE/DELETE权限，由定时任务清理旧数据   │
│  └─ 数据库行级安全 (RLS): PostgreSQL Row-Level Security      │
│                                                             │
│  L4 传输层                                                   │
│  ├─ TLS 1.2+ 强制 (禁止 TLS 1.0/1.1)                       │
│  ├─ HSTS 头: Strict-Transport-Security: max-age=31536000    │
│  └─ CORS: 仅允许受信任域名跨域                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 审计日志完整性保证

```sql
-- 使用 PostgreSQL 触发器保证日志不可篡改
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- 禁止 UPDATE
CREATE TRIGGER no_audit_update
    BEFORE UPDATE ON sys_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 禁止 DELETE
CREATE TRIGGER no_audit_delete
    BEFORE DELETE ON sys_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 审计日志写入权限仅授予专用应用账号
-- 应用账号禁止手动执行 DML，强制通过存储过程/应用接口写入
REVOKE UPDATE, DELETE ON sys_audit_log FROM app_user;
GRANT INSERT ON sys_audit_log TO app_user;
```

### 9.5 数据脱敏规则

```typescript
// 敏感字段脱敏规则配置
const desensitizationRules = {
  phone: (v: string) => v ? v.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
  idCard: (v: string) => v ? v.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2') : '',
  email: (v: string) => v ? v.replace(/(.{2}).{0,}(@.{2,})/, '$1***$2') : '',
  name: (v: string) => v ? v.replace(/(.{1}).*/, '$1*') : '',
  address: (v: string) => v ? v.replace(/(.{6}).*/, '$1***') : '',
  diagnosis: (v: string) => v ? '[' + v.substring(0, 10) + '...]' : '',
};

// API 响应拦截器自动脱敏
// 仅当请求来自非医疗角色时，对 PHI 字段自动脱敏
```

---

## 10. 部署架构

### 10.1 Kubernetes 部署拓扑

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster (医院内网)                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Namespace: hospital-idp                      │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │            Deployment: idp-platform                  │  │   │
│  │  │  replicas: 3 (高可用)                                │  │   │
│  │  │  strategy: RollingUpdate (maxSurge: 1)               │  │   │
│  │  │                                                       │  │   │
│  │  │  Container: idp-platform                              │  │   │
│  │  │  image: registry.hosp.com/idp-platform:v1.0.0        │  │   │
│  │  │  resources:                                          │  │   │
│  │  │    requests: { cpu: 500m, memory: 512Mi }           │  │   │
│  │  │    limits: { cpu: 2000m, memory: 2Gi }              │  │   │
│  │  │  env:                                                │  │   │
│  │  │    NODE_ENV: production                              │  │   │
│  │  │    JWT_SECRET: ${JWT_SECRET} (from Vault)            │  │   │
│  │  │    DB_HOST: postgresql.hospital.svc.cluster.local   │  │   │
│  │  │    REDIS_HOST: redis.hospital.svc.cluster.local      │  │   │
│  │  │  livenessProbe: /health → HTTP GET :3000/health      │  │   │
│  │  │  readinessProbe: /health → HTTP GET :3000/health     │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                          │                               │   │
│  │  ┌────────────────────────▼────────────────────────────┐  │   │
│  │  │                 Service: idp-platform-svc           │  │   │
│  │  │  type: ClusterIP (内部) / NodePort (可选)           │  │   │
│  │  │  ports: 3000                                        │  │   │
│  │  └────────────────────────┬────────────────────────────┘  │   │
│  └───────────────────────────┼────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │            Ingress: idp-platform-ingress                   │  │
│  │  annotations:                                               │  │
│  │    nginx.ingress.kubernetes.io/ssl-redirect: "true"        │  │
│  │    nginx.ingress.kubernetes.io/proxy-body-size: "50m"       │  │
│  │    nginx.ingress.kubernetes.io/rate-limit: "100"             │  │
│  │  hosts:                                                     │  │
│  │    - idp.hosp.com → idp-platform-svc:3000                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  ConfigMap        │  │  Secret (Vault)   │  │  HPA              │ │
│  │  nginx.conf       │  │  DB credentials  │  │  replicas: 2-10   │ │
│  │  app-config.yaml  │  │  JWT secret       │  │  CPU>70% 扩容     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### 10.2 数据库与缓存部署

```
┌─────────────────────────────────────────────────────────────────┐
│                      数据持久层                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PostgreSQL 主从集群 (Patroni + etcd)                           │
│  ┌────────────┐                                                │
│  │  Primary   │  ← 写操作 (所有写请求)                          │
│  └──────┬─────┘                                                │
│         │ Streaming Replication                                │
│  ┌──────▼─────┐  ┌────────────┐  ┌────────────┐               │
│  │  Replica-1 │  │  Replica-2  │  │  Replica-N  │               │
│  │  (读分离)   │  │  (读分离)   │  │  (读分离)   │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Redis Cluster (3主3从)                                  │   │
│  │  · Token 存储 (TTL 自动过期)                             │   │
│  │  · 菜单权限缓存 (5分钟 TTL)                             │   │
│  │  · 分布式锁 (配置变更、菜单同步)                        │   │
│  │  · Session 存储 (可选，支持多设备管理)                  │   │
│  │  · 子系统健康检查结果缓存                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  MinIO (对象存储) │  │  Elasticsearch (审计日志搜索)         │ │
│  │  · 用户头像      │  │  · 近6个月日志全文检索                │ │
│  │  · 审计附件      │  │  · 操作趋势分析                      │ │
│  │  · 菜单图标      │  │  · 异常行为检测                      │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 子系统独立部署模式

每个子系统作为独立 K8s Deployment 部署在自己的 Namespace 中：

```
┌───────────────────────────────────────────────────────────────┐
│                Kubernetes Cluster                              │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Namespace:   │  │ Namespace:   │  │ Namespace:   │           │
│  │ hospital-his │  │ hospital-lis │  │ hospital-pacs│           │
│  │             │  │             │  │             │           │
│  │ Deployment:  │  │ Deployment:  │  │ Deployment:  │           │
│  │ his-backend  │  │ lis-backend  │  │ pacs-backend │           │
│  │ (3 replicas) │  │ (2 replicas) │  │ (3 replicas) │           │
│  │             │  │             │  │             │           │
│  │ Deployment:  │  │ Deployment:  │  │ Deployment:  │           │
│  │ his-frontend │  │ lis-frontend │  │ pacs-frontend│           │
│  │ (3 replicas) │  │ (2 replicas) │  │ (2 replicas) │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                   │
│         ▼                ▼                ▼                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ HIS DB     │  │ LIS DB     │  │ PACS DB    │              │
│  │ (Postgres) │  │ (Postgres) │  │ (Postgres) │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Cross-Namespace 访问                         │  │
│  │  子系统通过 Service Account + RBAC 访问主平台 API         │  │
│  │  主平台通过内部 DNS: http://his-backend.hospital-his     │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 10.4 CI/CD 流程

```
开发者提交代码
      │
      ▼
┌──────────────┐
│ GitHub Actions│
│ CI Pipeline   │
│              │
│ 1. 代码检查 (ESLint/Prettier)                               │
│ 2. 单元测试 (覆盖率 > 80%)                                   │
│ 3. 集成测试 (Testcontainers)                               │
│ 4. 安全扫描 (Snyk / Trivy)                                  │
│ 5. Docker 镜像构建 (BuildKit, 多阶段构建)                    │
│ 6. 镜像推送到 Harbor Registry                               │
│ 7. 生成 SBOM (软件物料清单)                                  │
└──────────────┘
      │
      │ 镜像构建成功，触发部署审批
      ▼
┌──────────────┐
│ ArgoCD / GitOps│
│ CD Pipeline   │
│               │
│ 1. 更新 K8s manifests (kustomize)                           │
│ 2. 自动部署到 Staging 环境                                   │
│ 3. 自动化 E2E 测试 (Playwright)                             │
│ 4. 人工审批 (生产环境)                                       │
│ 5. 滚动部署到 Production                                    │
│ 6. 蓝绿回滚策略 (保留上一版本镜像标签)                        │
└──────────────┘
```

### 10.5 容器资源配置

| 组件 | CPU Request | Memory Request | CPU Limit | Memory Limit | Replicas |
|------|-----------|---------------|----------|-------------|---------|
| IDP 主平台 Backend | 500m | 512Mi | 2000m | 2Gi | 3 |
| IDP 主平台 Frontend | 200m | 256Mi | 500m | 512Mi | 2 |
| 子系统 Backend (大型) | 500m | 512Mi | 2000m | 2Gi | 3 |
| 子系统 Backend (小型) | 200m | 256Mi | 1000m | 1Gi | 2 |
| 数据库 (PostgreSQL) | 1000m | 2Gi | 4000m | 8Gi | 1主+2从 |
| Redis | 500m | 1Gi | 2000m | 4Gi | 3主3从 |
| Elasticsearch | 1000m | 2Gi | 4000m | 8Gi | 3 |

---

## 附录: 实施里程碑

```
Phase 1: 基础平台 (8周)
├─ 主平台后端核心: 用户/角色/菜单 CRUD (2周)
├─ 主平台前端: 权限管理界面 (2周)
├─ 数据库设计与迁移 (1周)
├─ JWT 认证与 SSO 基础框架 (2周)
└─ 子系统注册机制 + SDK (1周)

Phase 2: SSO集成 (6周)
├─ 子系统 SSO 集成 (HIS/LIS 各1周)
├─ 菜单同步机制开发 (1周)
├─ Token 刷新与强制登出 (1周)
├─ 前端子系统入口页 (1周)
└─ 集成测试 + UAT (2周)

Phase 3: 高级权限 (6周)
├─ 数据权限引擎开发 (2周)
├─ 审计日志系统 (2周)
├─ RBAC 细粒度配置界面 (1周)
└─ 权限继承与覆盖逻辑 (1周)

Phase 4: 安全与合规 (4周)
├─ MFA 多因素认证 (1周)
├─ 数据脱敏模块 (1周)
├─ 安全审计与渗透测试 (1周)
├─ 等保/HIPAA 合规文档 (1周)
└─ 剩余子系统集成 (并行进行)
```

---

**文档结束**
