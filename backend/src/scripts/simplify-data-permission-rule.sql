-- 简化 sys_data_permission_rule 表，只保留需要的字段
-- 在数据库中执行

-- 1. 重命名旧表
ALTER TABLE base.sys_data_permission_rule RENAME TO sys_data_permission_rule_old;

-- 2. 创建新表，只保留需要的字段
CREATE TABLE base.sys_data_permission_rule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES base.sys_role(id) ON DELETE CASCADE,
    scope_type VARCHAR(20) NOT NULL DEFAULT 'all',
    dept_ids TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 从旧表复制数据到新表
INSERT INTO base.sys_data_permission_rule (id, role_id, scope_type, dept_ids, created_at)
SELECT id, role_id, COALESCE(scope_type, 'all'), dept_ids, created_at
FROM base.sys_data_permission_rule_old;

-- 4. 删除旧表
DROP TABLE base.sys_data_permission_rule_old;