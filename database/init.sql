-- ============================================
-- RoveAudit 稽核系统 - PostgreSQL 完整初始化脚本
-- 数据库：data_portal
-- 说明：创建所有系统表并插入默认数据
-- 支持重复执行（IF NOT EXISTS / ON CONFLICT）
-- ============================================

-- ============================================
-- 1. 用户表（sys_user）
-- ============================================
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

-- ============================================
-- 2. 角色表（sys_role）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_role (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  role_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  status SMALLINT NOT NULL DEFAULT 1,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 用户角色关联表（sys_user_role）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_user_role (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON sys_user_role(role_id);

-- ============================================
-- 4. 菜单表（sys_menu）
-- ============================================
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

-- ============================================
-- 5. 操作权限表（sys_permission）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_permission (
  id SERIAL PRIMARY KEY,
  permission_name VARCHAR(50) NOT NULL,
  permission_key VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(200) DEFAULT NULL
);

-- ============================================
-- 6. 角色菜单关联表（sys_role_menu）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_role_menu (
  role_id INT NOT NULL,
  menu_id INT NOT NULL,
  PRIMARY KEY (role_id, menu_id)
);
CREATE INDEX IF NOT EXISTS idx_role_menu_menu_id ON sys_role_menu(menu_id);

-- ============================================
-- 7. 角色权限关联表（sys_role_permission）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_role_permission (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_perm_perm_id ON sys_role_permission(permission_id);

-- ============================================
-- 8. 清单配置表（sys_report）
-- ============================================
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

-- ============================================
-- 9. 清单字段配置表（sys_report_column）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_report_column (
  id SERIAL PRIMARY KEY,
  report_code VARCHAR(50) NOT NULL,
  column_name VARCHAR(100) NOT NULL,
  column_label VARCHAR(100) DEFAULT NULL,
  width INTEGER DEFAULT 150,
  align VARCHAR(20) DEFAULT 'left',
  sortable SMALLINT DEFAULT 1,
  filterable SMALLINT DEFAULT 1,
  visible SMALLINT DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_date SMALLINT DEFAULT 0,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_report_column_report_code ON sys_report_column(report_code);

-- ============================================
-- 10. 清单图表配置表（sys_report_chart）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_report_chart (
  id SERIAL PRIMARY KEY,
  report_code VARCHAR(50) NOT NULL,
  chart_title VARCHAR(100) NOT NULL,
  chart_type VARCHAR(50) NOT NULL,
  dimension_column VARCHAR(100) NOT NULL,
  metric_columns TEXT NOT NULL,
  metric_labels TEXT DEFAULT NULL,
  is_ring SMALLINT NOT NULL DEFAULT 0,
  status SMALLINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_report_chart_report_code ON sys_report_chart(report_code);

-- ============================================
-- 11. 异常规则表（sys_warning_rule）
-- ============================================
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

-- ============================================
-- 12. 异常检测结果表（sys_warning_result）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_warning_result (
  id SERIAL PRIMARY KEY,
  rule_id INT NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  result_count INT DEFAULT 0,
  result_data JSONB DEFAULT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_warning_result_rule_id ON sys_warning_result(rule_id);
CREATE INDEX IF NOT EXISTS idx_warning_result_create_time ON sys_warning_result(create_time);

-- ============================================
-- 13. 下载日志表（sys_download_log）
-- ============================================
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
CREATE INDEX IF NOT EXISTS idx_download_log_user_id ON sys_download_log(user_id);
CREATE INDEX IF NOT EXISTS idx_download_log_download_time ON sys_download_log(download_time);

-- ============================================
-- 14. 操作日志表（已废弃，由 sys_audit_log 替代）
-- ============================================
-- ⚠️ sys_operation_log 已删除，代码中使用 sys_audit_log（audit-log.entity.ts）
-- 如需保留历史数据，请手动迁移后再删除此段

-- ============================================
-- 15. 审计日志表（sys_audit_log）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  username VARCHAR(50) DEFAULT NULL,
  action VARCHAR(200) NOT NULL,
  module VARCHAR(100) DEFAULT NULL,
  method VARCHAR(100) DEFAULT NULL,
  path VARCHAR(500) DEFAULT NULL,
  params TEXT DEFAULT NULL,
  ip VARCHAR(50) DEFAULT NULL,
  status SMALLINT DEFAULT 1,
  error_msg TEXT DEFAULT NULL,
  duration INT DEFAULT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON sys_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_create_time ON sys_audit_log(create_time);

-- ============================================
-- ============ 初始数据插入 ===============
-- ============================================

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
('异常规则', 5, '/system/warning-rules', 'AlertOutlined', 5),
('下载日志', 5, '/system/download-logs', 'FileTextOutlined', 6)
ON CONFLICT DO NOTHING;

-- 插入默认操作权限
INSERT INTO sys_permission (permission_name, permission_key, description) VALUES
('查看', 'report:view', '查看清单数据'),
('下载', 'report:download', '下载清单数据'),
('导出', 'report:export', '导出清单数据')
ON CONFLICT DO NOTHING;

-- 插入默认角色（超级管理员）
INSERT INTO sys_role (role_name, role_code, description) VALUES
('超级管理员', 'admin', '拥有所有权限，可管理整个系统')
ON CONFLICT DO NOTHING;

-- 给超级管理员角色分配所有菜单
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu
ON CONFLICT DO NOTHING;

-- 给超级管理员角色分配所有权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission
ON CONFLICT DO NOTHING;

-- 插入默认用户（密码：123456，bcrypt加密）
INSERT INTO sys_user (username, password, real_name, department, status) VALUES
('admin', '$2a$10$RuIC1LD7eRRNRGBTynwyDuLVK/HD81UuccevbrRuWN82f9k20SC.m', '系统管理员', '技术部', 1)
ON CONFLICT DO NOTHING;

-- 给管理员用户分配超级管理员角色
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- 插入基于 Doris 实际表的清单配置
-- ============================================
INSERT INTO sys_report (report_name, report_code, category, description, sql_content, enable_download, enable_chart, sort_order) VALUES
('用户清单', 'user_list', '用户类', '所有用户基本信息', 'SELECT user_id, user_name, phone, id_card, unit_id, user_type, reg_date, status, channel FROM audit_db.fact_user WHERE 1=1', 1, 1, 1),
('订单清单', 'order_list', '用户类', '用户订购套餐订单记录', 'SELECT o.order_id, o.user_id, u.user_name, p.pkg_name, o.order_date, o.eff_date, o.exp_date, o.order_type, o.status, o.discount FROM audit_db.fact_order o LEFT JOIN audit_db.fact_user u ON o.user_id = u.user_id LEFT JOIN audit_db.dim_package p ON o.pkg_id = p.pkg_id WHERE 1=1', 1, 1, 2),
('装机清单', 'install_list', '用户类', '宽带装机工单记录', 'SELECT i.install_id, i.order_id, i.user_id, u.user_name, s.staff_name, i.install_date, i.install_addr, i.device_sn, i.device_type, i.is_on_time, i.satisfaction FROM audit_db.fact_install i LEFT JOIN audit_db.fact_user u ON i.user_id = u.user_id LEFT JOIN audit_db.dim_staff s ON i.staff_id = s.staff_id WHERE 1=1', 1, 1, 3),
('拆机清单', 'remove_list', '稽核类', '用户拆机记录（重点稽核）', 'SELECT r.remove_id, r.user_id, u.user_name, s.staff_name, r.remove_date, r.remove_type, r.refund_amt, r.reason, r.is_high_value FROM audit_db.fact_remove r LEFT JOIN audit_db.fact_user u ON r.user_id = u.user_id LEFT JOIN audit_db.dim_staff s ON r.staff_id = s.staff_id WHERE 1=1', 1, 1, 4),
('稽核日志清单', 'audit_log', '稽核类', '装机/拆机稽核结果记录', 'SELECT a.audit_id, a.user_id, u.user_name, s.staff_name, a.audit_type, a.audit_date, a.result, a.diff_amt, a.remark FROM audit_db.fact_audit_log a LEFT JOIN audit_db.fact_user u ON a.user_id = u.user_id LEFT JOIN audit_db.dim_staff s ON a.staff_id = s.staff_id WHERE 1=1', 1, 1, 5),
('通话详单', 'call_detail', '流量类', '用户通话/流量/短信详单', 'SELECT c.cdr_id, c.user_id, u.user_name, c.call_type, c.duration_s, c.data_mb, c.fee, c.call_date, c.is_roaming FROM audit_db.fact_call_detail c LEFT JOIN audit_db.fact_user u ON c.user_id = u.user_id WHERE 1=1', 1, 1, 6),
('缴费清单', 'payment_list', '收入类', '用户缴费记录', 'SELECT p.pay_id, p.user_id, u.user_name, p.pay_date, p.pay_amt, p.pay_type, p.period_from, p.period_to, p.is_overdue, p.late_fee FROM audit_db.fact_payment p LEFT JOIN audit_db.fact_user u ON p.user_id = u.user_id WHERE 1=1', 1, 1, 7),
('积分清单', 'points_list', '收入类', '拆机价值积分计算记录', 'SELECT p.points_id, p.unit_id, u.unit_name, p.pkg_name, p.points_amt, p.calc_date, p.period, p.source, p.is_settled FROM audit_db.fact_points p LEFT JOIN audit_db.dim_unit u ON p.unit_id = u.unit_id WHERE 1=1', 1, 1, 8),
('套餐维度', 'package_dim', '用户类', '套餐基础信息维度表', 'SELECT pkg_id, pkg_name, pkg_type, monthly_fee, bandwidth_mbps, voice_minutes, data_gb, base_points, status, launch_date FROM audit_db.dim_package WHERE 1=1', 1, 0, 9),
('员工维度', 'staff_dim', '用户类', '员工信息维度表', 'SELECT staff_id, staff_name, unit_id, role, phone, status, hire_date FROM audit_db.dim_staff WHERE 1=1', 1, 0, 10),
('单位维度', 'unit_dim', '用户类', '组织架构维度表', 'SELECT unit_id, unit_name, unit_type, parent_id, city, level, status FROM audit_db.dim_unit WHERE 1=1', 1, 0, 11)
ON CONFLICT (report_code) DO NOTHING;

-- ============================================
-- 补充索引（性能优化）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_download_log_report_id ON sys_download_log(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON sys_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_user_status ON sys_user(status);
CREATE INDEX IF NOT EXISTS idx_warning_result_rule_id_create_time ON sys_warning_result(rule_id, create_time);

-- ============================================
-- 完成！
-- ============================================
-- 默认管理员账号：admin
-- 默认管理员密码：123456
-- 首次登录后请立即修改密码！
-- ============================================
