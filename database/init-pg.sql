-- ==========================================
-- 运营商数据门户平台 - PostgreSQL 初始化脚本
-- 数据库：data_portal
-- 说明：创建所有系统表并插入默认数据
-- ==========================================

-- ==========================================
-- 1. 用户表（sys_user）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_user (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(200) NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  status SMALLINT NOT NULL DEFAULT 1,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. 角色表（sys_role）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_role (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  role_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  status SMALLINT NOT NULL DEFAULT 1,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. 用户角色关联表（sys_user_role）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_user_role (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE
);
CREATE INDEX idx_user_role_role_id ON sys_user_role(role_id);

-- ==========================================
-- 4. 菜单表（sys_menu）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_menu (
  id SERIAL PRIMARY KEY,
  menu_name VARCHAR(50) NOT NULL,
  parent_id INT NOT NULL DEFAULT 0,
  path VARCHAR(200) DEFAULT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status SMALLINT NOT NULL DEFAULT 1,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. 操作权限表（sys_permission）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_permission (
  id SERIAL PRIMARY KEY,
  permission_name VARCHAR(50) NOT NULL,
  permission_key VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(200) DEFAULT NULL
);

-- ==========================================
-- 6. 角色菜单关联表（sys_role_menu）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_role_menu (
  role_id INT NOT NULL,
  menu_id INT NOT NULL,
  PRIMARY KEY (role_id, menu_id),
  CONSTRAINT fk_role_menu_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_menu_menu FOREIGN KEY (menu_id) REFERENCES sys_menu(id) ON DELETE CASCADE
);
CREATE INDEX idx_role_menu_menu_id ON sys_role_menu(menu_id);

-- ==========================================
-- 7. 角色权限关联表（sys_role_permission）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_role_permission (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_perm_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_perm_perm FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
);
CREATE INDEX idx_role_perm_perm_id ON sys_role_permission(permission_id);

-- ==========================================
-- 8. 清单配置表（sys_report）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_report (
  id SERIAL PRIMARY KEY,
  report_name VARCHAR(100) NOT NULL,
  report_code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT DEFAULT NULL,
  sql_content TEXT NOT NULL,
  query_params TEXT DEFAULT NULL,
  enable_download SMALLINT NOT NULL DEFAULT 1,
  enable_chart SMALLINT NOT NULL DEFAULT 0,
  status SMALLINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. 异常规则表（sys_warning_rule）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_warning_rule (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  sql_content TEXT NOT NULL,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
  enable_flag SMALLINT NOT NULL DEFAULT 1,
  last_run_time TIMESTAMP DEFAULT NULL,
  last_result_count INT NOT NULL DEFAULT 0,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 10. 下载日志表（sys_download_log）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_download_log (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  report_id INT NOT NULL,
  report_name VARCHAR(100) NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  data_count INT NOT NULL DEFAULT 0,
  ip VARCHAR(50) DEFAULT NULL,
  download_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_download_log_user_id ON sys_download_log(user_id);
CREATE INDEX idx_download_log_download_time ON sys_download_log(download_time);

-- ==========================================
-- 11. 操作日志表（sys_operation_log）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_operation_log (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(50) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  method VARCHAR(10) DEFAULT NULL,
  url VARCHAR(500) DEFAULT NULL,
  params TEXT DEFAULT NULL,
  ip VARCHAR(50) DEFAULT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_operation_log_user_id ON sys_operation_log(user_id);
CREATE INDEX idx_operation_log_create_time ON sys_operation_log(create_time);

-- ==========================================
-- ============ 初始数据插入 ===============
-- ==========================================

-- 插入默认菜单
INSERT INTO sys_menu (menu_name, parent_id, path, icon, sort_order) VALUES
('首页', 0, '/home', 'HomeOutlined', 1),
('清单中心', 0, '/report-center', 'TableOutlined', 2),
('统计分析', 0, '/analysis', 'BarChartOutlined', 3),
('异常分析', 0, '/warning-center', 'AlertOutlined', 4),
('系统管理', 0, '/system', 'SettingOutlined', 5),
('用户管理', 5, '/system/users', 'UserOutlined', 1),
('角色管理', 5, '/system/roles', 'TeamOutlined', 2),
('菜单管理', 5, '/system/menus', 'MenuOutlined', 3),
('清单配置', 5, '/system/reports', 'FileTextOutlined', 4),
('异常规则', 5, '/system/warning-rules', 'AlertOutlined', 5);

-- 插入默认操作权限
INSERT INTO sys_permission (permission_name, permission_key, description) VALUES
('查看', 'report:view', '查看清单数据'),
('下载', 'report:download', '下载清单数据'),
('导出', 'report:export', '导出清单数据');

-- 插入默认角色（超级管理员）
INSERT INTO sys_role (role_name, role_code, description) VALUES
('超级管理员', 'admin', '拥有所有权限，可管理整个系统');

-- 给超级管理员角色分配所有菜单
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu;

-- 给超级管理员角色分配所有权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission;

-- 插入默认用户（密码：admin123，bcrypt加密）
INSERT INTO sys_user (username, password, real_name, department, status) VALUES
('admin', '$2a$10$RuIC1LD7eRRNRGBTynwyDuLVK/HD81UuccevbrRuWN82f9k20SC.m', '系统管理员', '技术部', 1);

-- 给管理员用户分配超级管理员角色
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1);

-- 插入示例清单配置（需要先有 Doris 业务表才能查询）
INSERT INTO sys_report (report_name, report_code, category, description, sql_content, enable_download, enable_chart, sort_order) VALUES
('用户发展清单', 'user_develop', '用户类', '展示用户发展数据', 'SELECT * FROM business_data.user_develop WHERE 1=1 {{date}} {{province}}', 1, 1, 1),
('收入分析清单', 'income_analysis', '收入类', '展示收入分析数据', 'SELECT * FROM business_data.income_analysis WHERE 1=1 {{date}} {{region}}', 1, 1, 2),
('流量统计清单', 'traffic_stats', '流量类', '展示流量统计数据', 'SELECT * FROM business_data.traffic_stats WHERE 1=1 {{date}} {{province}}', 1, 1, 3),
('渠道统计清单', 'channel_stats', '渠道类', '展示渠道统计数据', 'SELECT * FROM business_data.channel_stats WHERE 1=1 {{date}} {{channel}}', 1, 0, 4),
('营业厅统计清单', 'shop_stats', '营业厅类', '展示营业厅统计数据', 'SELECT * FROM business_data.shop_stats WHERE 1=1 {{date}} {{city}}', 1, 0, 5),
('稽核清单', 'audit_data', '稽核类', '展示稽核数据', 'SELECT * FROM business_data.audit_data WHERE 1=1 {{date}} {{province}}', 1, 1, 6);

-- ==========================================
-- 完成！以下为操作提示
-- ==========================================
-- 默认管理员账号：admin
-- 默认管理员密码：admin123
-- 首次登录后请立即修改密码！
-- Doris 业务表需要自行创建，清单 SQL 中的表名请根据实际情况修改
-- ==========================================
