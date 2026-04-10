-- 检查 sys_menu 表是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'base'
AND table_name = 'sys_menu';

-- 如果不存在，先检查所有 schema
SELECT schema_name
FROM information_schema.schemata;

-- 检查 platform schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'platform'
AND table_name = 'sys_menu';
