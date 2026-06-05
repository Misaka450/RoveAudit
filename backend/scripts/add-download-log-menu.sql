-- 添加"下载日志"菜单项到系统管理下
-- 假设系统管理的 parentId 为 1（需要根据实际数据库调整）

-- 先查询系统管理的 ID
-- SELECT id FROM sys_menu WHERE menu_name = '系统管理' OR path = '/system';

-- 插入下载日志菜单（假设系统管理 parentId=1）
INSERT INTO sys_menu (menu_name, parent_id, path, icon, sort_order, status)
VALUES ('下载日志', 1, '/system/download-logs', 'FileTextOutlined', 4, 1)
ON CONFLICT DO NOTHING;

-- 如果上面的 ON CONFLICT 不支持，使用以下语句：
-- INSERT INTO sys_menu (menu_name, parent_id, path, icon, sort_order, status)
-- SELECT '下载日志', 1, '/system/download-logs', 'FileTextOutlined', 4, 1
-- WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = '/system/download-logs');
