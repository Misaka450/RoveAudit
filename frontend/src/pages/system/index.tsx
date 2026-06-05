import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, Select, Tree, Tag, message, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { userApi, roleApi, menuApi } from '@/api';
import type { User, Role } from '@/types';

// ==================== 用户管理 ====================
function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await userApi.list(keyword)); } catch { /* */ } finally { setLoading(false); }
  };
  const loadRoles = async () => { try { setRoles(await roleApi.list()); } catch { /* */ } };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const handleCreate = () => { setEditingUser(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({ realName: user.realName, department: user.department, phone: user.phone, status: user.status, roleIds: user.roles?.map((r) => r.id) || [] });
    setModalVisible(true);
  };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingUser) { await userApi.update(editingUser.id, values); message.success('更新成功'); }
      else { await userApi.create(values); message.success('创建成功'); }
      setModalVisible(false); loadUsers();
    } catch { /* */ }
  };
  const handleDelete = async (id: number) => { await userApi.remove(id); message.success('已禁用'); loadUsers(); };
  const handleResetPassword = (user: User) => {
    Modal.confirm({
      title: '重置密码',
      content: `确定重置 "${user.realName}" 的密码为 123456？`,
      onOk: async () => { await userApi.resetPassword(user.id, '123456'); message.success('密码已重置'); },
    });
  };

  const columns = [
    { title: '账号', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag> },
    { title: '角色', dataIndex: 'roles', key: 'roles', render: (r: any[]) => r?.map((x) => <Tag key={x.id}>{x.roleName}</Tag>) },
    { title: '操作', key: 'action', render: (_: any, rec: User) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(rec)}>编辑</Button>
        <Button type="link" icon={<KeyOutlined />} onClick={() => handleResetPassword(rec)}>重置密码</Button>
        <Popconfirm title="确定禁用？" onConfirm={() => handleDelete(rec.id)}>
          <Button type="link" danger icon={<DeleteOutlined />}>禁用</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索账号/姓名" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={loadUsers} style={{ width: 200 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增用户</Button>
      </Space>
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} scroll={{ x: 800 }} />
      <Modal title={editingUser ? '编辑用户' : '新增用户'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          {!editingUser && (
            <>
              <Form.Item name="username" label="账号" rules={[{ required: true }]}><Input placeholder="登录账号" /></Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password placeholder="登录密码" /></Form.Item>
            </>
          )}
          <Form.Item name="realName" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label="部门"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="roleIds" label="角色"><Select mode="multiple" placeholder="选择角色" options={roles.map((r) => ({ value: r.id, label: r.roleName }))} /></Form.Item>
          {editingUser && <Form.Item name="status" label="状态"><Select options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} /></Form.Item>}
        </Form>
      </Modal>
    </>
  );
}

// ==================== 角色管理 ====================
function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const [form] = Form.useForm();

  const loadRoles = async () => { setLoading(true); try { setRoles(await roleApi.list()); } catch { /* */ } finally { setLoading(false); } };
  const loadMenus = async () => {
    try {
      const data = await menuApi.list();
      setMenuTree(data.filter((m: any) => m.parentId === 0).map((m: any) => ({
        title: m.menuName, key: m.id,
        children: data.filter((c: any) => c.parentId === m.id).map((c: any) => ({ title: c.menuName, key: c.id })),
      })));
    } catch { /* */ }
  };

  useEffect(() => { loadRoles(); loadMenus(); }, []);

  const handleCreate = () => { setEditingRole(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({ roleName: role.roleName, roleCode: role.roleCode, description: role.description, menuIds: role.menus?.map((m) => m.id) || [] });
    setModalVisible(true);
  };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingRole) { await roleApi.update(editingRole.id, values); message.success('更新成功'); }
      else { await roleApi.create(values); message.success('创建成功'); }
      setModalVisible(false); loadRoles();
    } catch { /* */ }
  };
  const handleDelete = async (id: number) => { await roleApi.remove(id); message.success('已删除'); loadRoles(); };

  const columns = [
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
    { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag> },
    { title: '操作', key: 'action', render: (_: any, rec: Role) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(rec)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(rec.id)}>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增角色</Button>
      </div>
      <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} scroll={{ x: 600 }} />
      <Modal title={editingRole ? '编辑角色' : '新增角色'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="roleCode" label="角色编码" rules={[{ required: true }]}><Input disabled={!!editingRole} /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="menuIds" label="菜单权限" valuePropName="checkedKeys" trigger="onCheck">
            <Tree checkable treeData={menuTree} defaultExpandAll />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ==================== 合并页面 ====================
export default function SystemManagement() {
  return (
    <Card title="系统管理">
      <Tabs items={[
        { key: 'users', label: '用户管理', children: <UserManagement /> },
        { key: 'roles', label: '角色管理', children: <RoleManagement /> },
      ]} />
    </Card>
  );
}
