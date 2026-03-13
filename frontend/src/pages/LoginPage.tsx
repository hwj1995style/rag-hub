import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { App, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocaleSwitcher } from '../components/LocaleSwitcher';
import { useI18n } from '../i18n/useI18n';
import { login } from '../services/api/auth';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const setSession = useAuthStore((state) => state.setSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useI18n();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (payload) => {
      setSession(payload);
      void message.success(t('login.success'));
      const target = (location.state as { from?: string } | null)?.from || '/documents';
      navigate(target, { replace: true });
    },
    onError: (error: Error) => {
      void message.error(error.message || t('login.failed'));
    },
  });

  if (isAuthenticated) {
    navigate('/documents', { replace: true });
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Card className="page-card" style={{ width: '100%', maxWidth: 420 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {t('login.title')}
            </Typography.Title>
            <LocaleSwitcher />
          </Space>
          <Typography.Paragraph type="secondary">
            {t('login.subtitle')}
          </Typography.Paragraph>
          <Form
            layout="vertical"
            size="large"
            initialValues={{ username: 'dockeradmin', password: 'DockerAdmin123!' }}
            onFinish={(values) => mutation.mutate(values)}
          >
            <Form.Item label={t('login.username')} name="username" rules={[{ required: true, message: t('login.usernameRequired') }]}>
              <Input prefix={<UserOutlined />} placeholder={t('login.usernamePlaceholder')} />
            </Form.Item>
            <Form.Item label={t('login.password')} name="password" rules={[{ required: true, message: t('login.passwordRequired') }]}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('login.passwordPlaceholder')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
              {t('login.submit')}
            </Button>
          </Form>
        </Card>
      </div>
      <div className="auth-hero">
        <div>
          <Typography.Title style={{ color: '#fff', fontSize: 48, lineHeight: 1.1, marginTop: 0 }}>
            {t('login.heroTitle')}
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.86)', fontSize: 18, maxWidth: 520 }}>
            {t('login.heroDescription')}
          </Typography.Paragraph>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <Typography.Text type="secondary">{t('login.adminSeed')}</Typography.Text>
            <Typography.Title level={4}>dockeradmin / DockerAdmin123!</Typography.Title>
          </div>
          <div className="metric-card">
            <Typography.Text type="secondary">{t('login.viewerSeed')}</Typography.Text>
            <Typography.Title level={4}>viewer / viewer123</Typography.Title>
          </div>
        </div>
      </div>
    </div>
  );
}
