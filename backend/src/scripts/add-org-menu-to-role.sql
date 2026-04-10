-- 步骤2: 将机构管理菜单添加到角色
-- 在数据库中执行此 SQL (步骤1执行后再执行)

SET search_path TO base, public;

-- 1. 查看创建的菜单ID
SELECT id, name, code, type FROM sys_menu WHERE code LIKE 'platform:organization%';

-- 2. 查看所有角色
SELECT id, name, code FROM sys_role;

-- 3. 为指定角色添加菜单权限
-- 将 '角色ID' 替换为实际的系统管理员角色ID
-- INSERT INTO sys_role_menu (id, role_id, menu_id, permission_type, created_at)
-- SELECT uuid_generate_v4(), '角色ID', id, 'visible', NOW()
-- FROM sys_menu
-- WHERE code LIKE 'platform:organization%'
-- AND NOT EXISTS (
--     SELECT 1 FROM sys_role_menu WHERE role_id = '角色ID' AND menu_id = sys_menu.id
-- );

-- 4. 自动为所有管理员角色添加
INSERT INTO sys_role_menu (id, role_id, menu_id, permission_type, created_at)
SELECT uuid_generate_v4(), r.id, m.id, 'visible', NOW()
FROM sys_menu m
CROSS JOIN (
    SELECT id FROM sys_role
    WHERE name LIKE '%管理员%' OR code = 'admin'
    LIMIT 1
) r
WHERE m.code LIKE 'platform:organization%'
AND NOT EXISTS (
    SELECT 1 FROM sys_role_menu
    WHERE role_id = r.id AND menu_id = m.id
);

-- 5. 验证结果
SELECT r.name as role_name, m.name as menu_name, m.code, m.type, m.permission
FROM sys_role_menu rm
JOIN sys_role r ON r.id = rm.role_id
JOIN sys_menu m ON m.id = rm.menu_id
WHERE m.code LIKE 'platform:organization%'
ORDER BY r.name, m.sort_order;