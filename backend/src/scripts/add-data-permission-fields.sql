-- 在数据库中执行此 SQL 来添加缺失的字段
ALTER TABLE base.sys_data_permission_rule ADD COLUMN IF NOT EXISTS scope_type VARCHAR(20);
ALTER TABLE base.sys_data_permission_rule ADD COLUMN IF NOT EXISTS dept_ids TEXT;