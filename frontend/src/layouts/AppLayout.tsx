import {
  BookOutlined,
  FileSearchOutlined,
  LoginOutlined,
  SafetyOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isAdmin } from '../utils/format';

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const items = useMemo(() => {
    const base = [
      { key: '/documents', icon: <BookOutlined />, label: 'Documents' },
      { key: '/search', icon: <SearchOutlined />, label: 'Search' },
      { key: '/qa', icon: <FileSearchOutlined />, label: 'QA' },
      { key: '/tasks', icon: <UnorderedListOutlined />, label: 'Tasks' },
      {
        key: '/query-logs/66666666-6666-6666-6666-666666666666',
        icon: <FileSearchOutlined />,
        label: 'Query Log',
      },
    ];

    if (isAdmin(user?.roleCode)) {
      base.splice(4, 0, { key: '/permissions', icon: <SafetyOutlined />, label: 'Permissions' });
    }

    return base;
  }, [user?.roleCode]);

  const selectedKey =
    items.find((item) => {
      if (item.key === '/tasks') {
        return location.pathname.startsWith('/tasks');
      }
      return location.pathname.startsWith(item.key.split('/:')[0]);
    })?.key ?? '/documents';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={260} theme="light" style={{ borderRight: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <div style={{ padding: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            rag-hub
          </Typography.Title>
          <Typography.Text type="secondary">Admin Console</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: 'transparent', padding: '20px 24px 0' }}>
          <div className="hero-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
                Separated Frontend Admin
              </Typography.Title>
              <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
                Phase 4 adds task center workflows, batch-import follow-up, and tighter operational handoff between admin pages.
              </Typography.Paragraph>
            </div>
            <Space size="middle">
              <Tag color="gold">{user?.roleCode ?? 'visitor'}</Tag>
              <Typography.Text style={{ color: '#fff' }}>{user?.displayName ?? '-'}</Typography.Text>
              <Button
                type="primary"
                ghost
                icon={<LoginOutlined />}
                onClick={() => {
                  clearSession();
                  navigate('/login', { replace: true });
                }}
              >
                Logout
              </Button>
            </Space>
          </div>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}