import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Image, Grid } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/** 验证码触发阈值：连续失败 2 次后显示 */
const CAPTCHA_THRESHOLD = 2;

/**
 * 登录页面 - 已登录用户自动跳转首页
 * 安全策略：连续输错密码 2 次后，需填写图片验证码
 * 失败次数以后端为准，刷新页面后自动同步
 * 移动端：卡片全宽适配
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  /** 连续失败次数（以后端返回为准） */
  const [failCount, setFailCount] = useState(0);
  /** 验证码图片 URL */
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null);
  /** 验证码 ID */
  const [captchaId, setCaptchaId] = useState<string | null>(null);

  // 已登录则自动跳转
  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/home', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  /**
   * 加载验证码
   */
  const loadCaptcha = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/captcha', { credentials: 'include' });
      const id = res.headers.get('X-Captcha-Id');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // 释放旧 URL
      if (captchaUrl) {
        URL.revokeObjectURL(captchaUrl);
      }
      setCaptchaId(id);
      setCaptchaUrl(url);
    } catch {
      message.error('验证码加载失败');
    }
  }, [captchaUrl]);

  // 需要验证码时自动加载
  useEffect(() => {
    if (failCount >= CAPTCHA_THRESHOLD) {
      loadCaptcha();
    }
  }, [failCount, loadCaptcha]);

  /**
   * 查询后端失败次数（用于页面刷新后同步）
   */
  const syncFailCount = useCallback(async (username: string) => {
    if (!username) return;
    try {
      const res = await fetch(`/api/auth/fail-count?username=${encodeURIComponent(username)}`, {
        credentials: 'include',
      });
      const body = await res.json();
      if (body?.data?.failCount !== undefined) {
        setFailCount(body.data.failCount);
      }
    } catch {
      // 查询失败不影响登录流程，静默处理
    }
  }, []);

  /**
   * 当账号变化时重置状态并从后端同步
   */
  const handleValuesChange = useCallback(
    (changedValues: any) => {
      if (changedValues.username !== undefined) {
        // 账号变了 → 重置失败计数和验证码
        setFailCount(0);
        setCaptchaUrl(null);
        setCaptchaId(null);
        // 异步查询后端该账号的失败次数
        syncFailCount(changedValues.username);
      }
    },
    [syncFailCount],
  );

  const handleLogin = async (values: { username: string; password: string; captcha?: string }) => {
    setLoading(true);
    try {
      const loginParams: any = { username: values.username, password: values.password };
      // 如果需要验证码，带上 captchaId 和 captcha
      if (failCount >= CAPTCHA_THRESHOLD && captchaId) {
        loginParams.captchaId = captchaId;
        loginParams.captcha = values.captcha || '';
      }
      const res = await authApi.login(loginParams);
      // 登录成功 → 重置失败计数
      setFailCount(0);
      setAuth(res.userInfo);
      message.success('登录成功');
      navigate('/home', { replace: true });
    } catch (error: any) {
      const responseData = error.response?.data;
      const msg = responseData?.message || '登录失败';
      message.error(msg);

      // 优先使用后端返回的 failCount（保证前后端同步）
      const backendFailCount = responseData?.data?.failCount;
      if (backendFailCount !== undefined) {
        setFailCount(backendFailCount);
      } else {
        // 降级：本地计数（后端未返回时兜底）
        setFailCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? 16 : 24,
    }}>
      <Card
        style={{
          width: 400,
          maxWidth: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        styles={{ body: { padding: isMobile ? 24 : 36 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={isMobile ? 4 : 3} style={{ marginBottom: 4 }}>数据门户平台</Title>
          <Text type="secondary">运营商内部数据管理系统</Text>
        </div>

        <Form form={form} onFinish={handleLogin} onValuesChange={handleValuesChange} size={isMobile ? 'middle' : 'large'} autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          {/* 验证码区域：连续失败 2 次后显示 */}
          {failCount >= CAPTCHA_THRESHOLD && (
            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="验证码"
                  style={{ flex: 1 }}
                />
                <div
                  onClick={loadCaptcha}
                  style={{ cursor: 'pointer', flexShrink: 0, border: '1px solid #d9d9d9', borderRadius: 6 }}
                  title="点击刷新验证码"
                >
                  {captchaUrl ? (
                    <Image
                      src={captchaUrl}
                      alt="验证码"
                      width={120}
                      height={40}
                      preview={false}
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 120, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontSize: 12, color: '#999' }}>
                      加载中...
                    </div>
                  )}
                </div>
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
