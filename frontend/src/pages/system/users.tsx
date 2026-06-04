import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, Select, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { userApi, roleApi } from '@/api';
import type { User } from '@/types';

/**
 * 用户管理页面
 */
export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userApi.list(keyword);
      setUsers(data);
    } catch { /* 忽略 */ } finally { setLoading(false); }
  };

  const loadRoles = async () => {
    try {
      const data = await roleApi.list();
      setRoles(data);
    } catch { /* 忽略 */ }
  };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      realName: user.realName,
      department: user.department,
      phone: user.phone,
      status: user.status,
      roleIds: user.roles?.map((r) => r.id) || [],
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, values);
        message.success('更新成功');
      } else {
        await userApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadUsers();
    } catch { /* 表单验证失败 */ }
  };

  const handleDelete = async (id: number) => {
    await userApi.remove(id);
    message.success('已禁用');
    loadUsers();
  };

  const handleResetPassword = (user: User) => {
    Modal.confirm({
      title: `重置密码`,
      content: `确定要重置用户 "${user.realName}" 的密码吗？默认密码为 123456`,
      onOk: async () => {
        await userApi.resetPassword(user.id, '123456');
        message.success('密码已重置为 123456');
      },
    });
  };

  const columns = [
    { title: '账号', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '角色', dataIndex: 'roles', key: 'roles',
      render: (roles: any[]) => roles?.map((r) => <Tag key={r.id}>{r.roleName}</Tag>),
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" icon={<KeyOutlined />} onClick={() => handleResetPassword(record)}>重置密码</Button>
          <Popconfirm title="确定禁用此用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>禁用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Input
            placeholder="搜索账号/姓名"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={loadUsers}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增用户</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} />

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editingUser && (
            <>
              <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
                <Input placeholder="登录账号" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="登录密码" />
              </Form.Item>
            </>
          )}
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="真实姓名" />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input placeholder="所属部门" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="手机号" />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" placeholder="选择角色" options={roles.map((r) => ({ value: r.id, label: r.roleName }))} />
          </Form.Item>
          {editingUser && (
            <Form.Item name="status" label="状态">
              <Select options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}