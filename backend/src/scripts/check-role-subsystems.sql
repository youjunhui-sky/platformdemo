-- 检查角色子系统的关联数据
SELECT rs.role_id, rs.subsystem_id, rs.status, s.name as subsystem_name
FROM base.sys_role_subsystem rs
LEFT JOIN base.sys_subsystem s ON s.id = rs.subsystem_id
WHERE rs.role_id = '3a9d0af8-3fd8-4242-9c8d-0da60a2773df';