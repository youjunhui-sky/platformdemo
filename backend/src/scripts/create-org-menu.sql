-- 步骤1: 创建机构管理菜单及按钮权限
-- 在数据库中执行此 SQL

SET search_path TO base, public;

-- 1. 创建机构管理菜单 (父菜单)
INSERT INTO sys_menu (
    id, parent_id, subsystem_id, name, code, path, component,
    icon, sort_order, type, permission, is_visible, is_cache, is_frame,
    status, created_at, updated_at
)
SELECT
    uuid_generate_v4(), NULL, NULL, '机构管理', 'platform:organization',
    '/system-management/organization', 'system-management/organization/index',
    'office', 5, 'menu', NULL, true, false, false, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE code = 'platform:organization');

-- 2. 创建按钮权限
-- 新增机构按钮
INSERT INTO sys_menu (
    id, parent_id, subsystem_id, name, code, path, component,
    icon, sort_order, type, permission, is_visible, is_cache, is_frame,
    status, created_at, updated_at
)
SELECT
    uuid_generate_v4(),
    (SELECT id FROM sys_menu WHERE code = 'platform:organization'),
    NULL, '新增机构', 'platform:organization:create', '', '',
    NULL, 0, 'button', 'organization:create',
    true, false, false, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE code = 'platform:organization:create');

-- 编辑机构按钮
INSERT INTO sys_menu (
    id, parent_id, subsystem_id, name, code, path, component,
    icon, sort_order, type, permission, is_visible, is_cache, is_frame,
    status, created_at, updated_at
)
SELECT
    uuid_generate_v4(),
    (SELECT id FROM sys_menu WHERE code = 'platform:organization'),
    NULL, '编辑机构', 'platform:organization:update', '', '',
    NULL, 1, 'button', 'organization:update',
    true, false, false, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE code = 'platform:organization:update');

-- 删除机构按钮
INSERT INTO sys_menu (
    id, parent_id, subsystem_id, name, code, path, component,
    icon, sort_order, type, permission, is_visible, is_cache, is_frame,
    status, created_at, updated_at
)
SELECT
    uuid_generate_v4(),
    (SELECT id FROM sys_menu WHERE code = 'platform:organization'),
    NULL, '删除机构', 'platform:organization:delete', '', '',
    NULL, 2, 'button', 'organization:delete',
    true, false, false, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE code = 'platform:organization:delete');

-- 查看创建的菜单
SELECT id, parent_id, name, code, type, permission, sort_order
FROM sys_menu
WHERE code LIKE 'platform:organization%'
ORDER BY sort_order;