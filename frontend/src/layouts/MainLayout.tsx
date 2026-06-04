import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import {
  HomeOutlined,
  TableOutlined,
  BarChartOutlined,
  AlertOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { menuApi } from '@/api';
import type { MenuItem } from '@/types';

const { Header, Sider, Content } = Layout;

/**
 * 图标映射表 - 将菜单中的图标字符串映射为 Ant Design 图标组件
 */
const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  TableOutlined: <TableOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  AlertOutlined: <AlertOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  FileTextOutlined: <FileTextOutlined />,
};

/**
 * 主布局组件 - 包含侧边栏、顶部导航、内容区域
 */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false); // 侧边栏折叠状态
  const [menuItems, setMenuItems] = useState<any[]>([]); // 动态菜单项
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  // 加载菜单数据
  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const data = await menuApi.tree();
      const items = buildMenuItems(data);
      setMenuItems(items);
    } catch {
      // 如果菜单加载失败，使用默认菜单
      setMenuItems([
        { key: '/home', icon: <HomeOutlined />, label: '首页' },
        { key: '/report-center', icon: <TableOutlined />, label: '清单中心' },
        { key: '/analysis', icon: <BarChartOutlined />, label: '统计分析' },
        { key: '/warning-center', icon: <AlertOutlined />, label: '异常分析' },
        {
          key: '/system',
          icon: <SettingOutlined />,
          label: '系统管理',
          children: [
            { key: '/system/users', icon: <UserOutlined />, label: '用户管理' },
            { key: '/system/roles', icon: <TeamOutlined />, label: '角色管理' },
            { key: '/system/menus', icon: <MenuOutlined />, label: '菜单管理' },
            { key: '/system/reports', icon: <FileTextOutlined />, label: '清单配置' },
            { key: '/system/warning-rules', icon: <AlertOutlined />, label: '异常规则' },
          ],
        },
      ]);
    }
  };

  /**
   * 递归构建 Ant Design Menu 组件所需的菜单项
   */
  const buildMenuItems = (menus: MenuItem[]): any[] => {
    return menus.map((menu) => {
      const item: any = {
        key: menu.path,
        icon: iconMap[menu.icon] || null,
        label: menu.menuName,
      };
      if (menu.children && menu.children.length > 0) {
        item.children = buildMenuItems(menu.children);
      }
      return item;
    });
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 找到当前路径对应的菜单展开项
  const getOpenKeys = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length > 2) {
      return [`/${pathParts[1]}`];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
      >
        {/* Logo 区域 */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {collapsed ? 'DP' : '数据门户平台'}
        </div>

        {/* 动态菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* 右侧内容区域 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{
          background: themeToken.colorBgContainer,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          {/* 左侧：折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />

          {/* 右侧：用户信息下拉菜单 */}
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
              ],
            }}
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: themeToken.colorPrimary }} />
              <span>{userInfo?.realName || '用户'}</span>
            </div>
          </Dropdown>
        </Header>

        {/* 内容区域 */}
        <Content style={{ margin: 24, padding: 24, background: themeToken.colorBgContainer, borderRadius: 8 }}>
          <Outlet /> {/* 子路由内容在此渲染 */}
        </Content>
      </Layout>
    </Layout>
  );
}