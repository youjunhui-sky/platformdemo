-- 修复机构编码重复约束
-- 在数据库中执行此 SQL

SET search_path TO base, public;

-- 1. 删除旧的 unique 约束
ALTER TABLE sys_organization DROP CONSTRAINT IF EXISTS sys_organization_code_key;

-- 2. 创建新的复合唯一约束 (parent_id, code)
-- 注意：parent_id 为 NULL 时也会被包含在唯一约束中
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_parent_code ON sys_organization(parent_id, code);

-- 3. 删除旧的单列索引（如果存在）
DROP INDEX IF EXISTS idx_org_code;