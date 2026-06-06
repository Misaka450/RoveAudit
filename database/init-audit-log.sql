-- ============================================
-- 审计日志表 - sys_audit_log
-- 记录用户关键操作（登录、查询、下载、修改配置等）
-- ============================================
CREATE TABLE IF NOT EXISTS sys_audit_log (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER,
    username        VARCHAR(50),
    action          VARCHAR(200) NOT NULL,
    module          VARCHAR(100),
    method          VARCHAR(100),
    path            VARCHAR(500),
    params          TEXT,
    ip              VARCHAR(50),
    status          SMALLINT DEFAULT 1,  -- 1:成功  0:失败
    error_msg       TEXT,
    duration        INTEGER,  -- 耗时（毫秒）
    create_time     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按时间查询
CREATE INDEX IF NOT EXISTS idx_audit_log_create_time ON sys_audit_log(create_time);
-- 索引：按用户查询
CREATE INDEX IF NOT EXISTS idx_audit_log_username ON sys_audit_log(username);
