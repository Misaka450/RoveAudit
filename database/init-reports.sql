-- 清空旧示例数据
DELETE FROM sys_report;

-- 插入基于 Doris 实际表的清单配置
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
('单位维度', 'unit_dim', '用户类', '组织架构维度表', 'SELECT unit_id, unit_name, unit_type, parent_id, city, level, status FROM audit_db.dim_unit WHERE 1=1', 1, 0, 11);
