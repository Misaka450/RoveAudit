-- ==========================================
-- 运营商数据门户平台 - PostgreSQL 初始化脚本
-- 数据库：data_portal
-- 说明：创建所有系统表并插入默认数据
-- ==========================================

-- 连接到 postgres 数据库创建新库（如果不存在）
-- CREATE DATABASE IF NOT EXISTS data_portal; -- 需在外部执行
-- \c data_portal;

-- ==========================================
-- 1. 用户表（sys_user）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_user (
  id SERIAL PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) NOT NULL COMMENT '登录账号',
  password VARCHAR(200) NOT NULL COMMENT '加密密码',
  real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
  department VARCHAR(100) DEFAULT NULL COMMENT '所属部门',
  phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  status SMALLINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);
CREATE UNIQUE INDEX uk_username ON sys_user(username);
CREATE TRIGGER sys_user_update_time BEFORE UPDATE ON sys_user FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 2. 角色表（sys_role）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_role (
  id SERIAL PRIMARY KEY COMMENT '角色ID',
  role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
  role_code VARCHAR(50) NOT NULL COMMENT '角色编码',
  description TEXT DEFAULT NULL COMMENT '角色描述',
  status SMALLINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);
CREATE UNIQUE INDEX uk_role_code ON sys_role(role_code);
CREATE TRIGGER sys_role_update_time BEFORE UPDATE ON sys_role FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 3. 用户角色关联表（sys_user_role）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_user_role (
  user_id INTEGER NOT NULL COMMENT '用户ID',
  role_id INTEGER NOT NULL COMMENT '角色ID',
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE
);
CREATE INDEX idx_role_id ON sys_user_role(role_id);

-- ==========================================
-- 4. 菜单表（sys_menu）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_menu (
  id SERIAL PRIMARY KEY COMMENT '菜单ID',
  menu_name VARCHAR(50) NOT NULL COMMENT '菜单名称',
  parent_id INTEGER NOT NULL DEFAULT 0 COMMENT '父菜单ID（0表示顶级菜单）',
  path VARCHAR(200) DEFAULT NULL COMMENT '前端路由路径',
  icon VARCHAR(50) DEFAULT NULL COMMENT '菜单图标',
  sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序号',
  status SMALLINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);
CREATE TRIGGER sys_menu_update_time BEFORE UPDATE ON sys_menu FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 5. 操作权限表（sys_permission）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_permission (
  id SERIAL PRIMARY KEY COMMENT '权限ID',
  permission_name VARCHAR(50) NOT NULL COMMENT '权限名称',
  permission_key VARCHAR(100) NOT NULL COMMENT '权限标识',
  description VARCHAR(200) DEFAULT NULL COMMENT '权限描述'
);
CREATE UNIQUE INDEX uk_permission_key ON sys_permission(permission_key);

-- ==========================================
-- 6. 角色菜单关联表（sys_role_menu）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_role_menu (
  role_id INTEGER NOT NULL COMMENT '角色ID',
  menu_id INTEGER NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (role_id, menu_id),
  CONSTRAINT fk_role_menu_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_menu_menu FOREIGN KEY (menu_id) REFERENCES sys_menu(id) ON DELETE CASCADE
);
CREATE INDEX idx_menu_id ON sys_role_menu(menu_id);

-- ==========================================
-- 7. 角色权限关联表（sys_role_permission）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_role_permission (
  role_id INTEGER NOT NULL COMMENT '角色ID',
  permission_id INTEGER NOT NULL COMMENT '权限ID',
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_perm_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_perm_perm FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
);
CREATE INDEX idx_permission_id ON sys_role_permission(permission_id);

-- ==========================================
-- 8. 清单配置表（sys_report）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_report (
  id SERIAL PRIMARY KEY COMMENT '清单ID',
  report_name VARCHAR(100) NOT NULL COMMENT '清单名称',
  report_code VARCHAR(50) NOT NULL COMMENT '清单编码',
  category VARCHAR(50) NOT NULL COMMENT '清单分类',
  description TEXT DEFAULT NULL COMMENT '清单描述',
  sql_content TEXT NOT NULL COMMENT '查询SQL语句',
  query_params TEXT DEFAULT NULL COMMENT '查询参数配置（JSON格式）',
  enable_download SMALLINT NOT NULL DEFAULT 1 COMMENT '是否允许下载：1-允许 0-禁止',
  enable_chart SMALLINT NOT NULL DEFAULT 0 COMMENT '是否支持图表：1-支持 0-不支持',
  status SMALLINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
  sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序号',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);
CREATE UNIQUE INDEX uk_report_code ON sys_report(report_code);
CREATE TRIGGER sys_report_update_time BEFORE UPDATE ON sys_report FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 9. 异常规则表（sys_warning_rule）- 第二阶段
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_warning_rule (
  id SERIAL PRIMARY KEY COMMENT '规则ID',
  rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
  rule_type VARCHAR(50) NOT NULL COMMENT '规则类型',
  sql_content TEXT NOT NULL COMMENT '异常检测SQL',
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low' COMMENT '风险等级：high/medium/low',
  enable_flag SMALLINT NOT NULL DEFAULT 1 COMMENT '是否启用：1-启用 0-禁用',
  last_run_time TIMESTAMP DEFAULT NULL COMMENT '最后一次执行时间',
  last_result_count INTEGER NOT NULL DEFAULT 0 COMMENT '最后一次检测出的异常数量',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);
CREATE TRIGGER sys_warning_rule_update_time BEFORE UPDATE ON sys_warning_rule FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 10. 下载日志表（sys_download_log）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_download_log (
  id SERIAL PRIMARY KEY COMMENT '日志ID',
  user_id INTEGER NOT NULL COMMENT '下载用户ID',
  username VARCHAR(50) NOT NULL COMMENT '下载用户账号',
  report_id INTEGER NOT NULL COMMENT '下载的清单ID',
  report_name VARCHAR(100) NOT NULL COMMENT '下载的清单名称',
  file_name VARCHAR(200) NOT NULL COMMENT '下载文件名',
  file_type VARCHAR(10) NOT NULL COMMENT '文件类型：excel/csv',
  data_count INTEGER NOT NULL DEFAULT 0 COMMENT '下载数据条数',
  ip VARCHAR(50) DEFAULT NULL COMMENT '下载IP地址',
  download_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间'
);
CREATE INDEX idx_user_id_download ON sys_download_log(user_id);
CREATE INDEX idx_download_time ON sys_download_log(download_time);

-- ==========================================
-- 11. 操作日志表（sys_operation_log）
-- ==========================================
CREATE TABLE IF NOT EXISTS sys_operation_log (
  id SERIAL PRIMARY KEY COMMENT '日志ID',
  user_id INTEGER NOT NULL COMMENT '操作用户ID',
  username VARCHAR(50) NOT NULL COMMENT '操作用户账号',
  operation VARCHAR(100) NOT NULL COMMENT '操作类型',
  method VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
  url VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
  params TEXT DEFAULT NULL COMMENT '请求参数',
  ip VARCHAR(50) DEFAULT NULL COMMENT '操作IP',
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间'
);
CREATE INDEX idx_user_id_operation ON sys_operation_log(user_id);
CREATE INDEX idx_create_time_operation ON sys_operation_log(create_time);

-- ==========================================
-- 创建更新时间触发器函数
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.update_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ============ 初始数据插入 ================
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
-- 注意：以下是 bcrypt 加密后的密码，对应明文 "admin123"
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
