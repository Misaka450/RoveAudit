import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Image } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;

/** 验证码触发阈值：连续失败 2 次后显示 */
const CAPTCHA_THRESHOLD = 2;

/**
 * 登录页面 - 已登录用户自动跳转首页
 * 安全策略：连续输错密码 2 次后，需填写图片验证码
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  /** 连续失败次数 */
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
      setAuth(res.token, res.userInfo);
      message.success('登录成功');
      navigate('/home', { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.message || '登录失败';
      message.error(msg);

      // 更新失败次数
      const newCount = failCount + 1;
      setFailCount(newCount);

      // 如果刚达到阈值，验证码会自动通过 useEffect 加载
      // 如果已经需要验证码，刷新一张新的
      if (newCount > CAPTCHA_THRESHOLD) {
        loadCaptcha();
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
    }}>
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>数据门户平台</Title>
          <Text type="secondary">运营商内部数据管理系统</Text>
        </div>

        <Form onFinish={handleLogin} size="large" autoComplete="off">
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
