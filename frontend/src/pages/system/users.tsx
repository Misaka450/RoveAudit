import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, Select, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UploadOutlined } from '@ant-design/icons';
import { userApi, roleApi } from '@/api';
import type { User } from '@/types';
import UserBatchImport from './UserBatchImport';

/**
 * 用户管理页面
 */
export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 批量导入弹窗
  const [importVisible, setImportVisible] = useState(false);

  // 重置密码弹窗
  // 修复：原代码用 Modal.confirm + 闭包变量 newPwd 收集密码
  //      会因 React 渲染导致闭包捕获旧值，异步 onOk 拿到的 newPwd 可能是空
  //      改用受控状态 + 独立 Modal
  const [resetModal, setResetModal] = useState<{ open: boolean; user: User | null; password: string }>({
    open: false, user: null, password: '',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.list(keyword, page, pageSize);
      // 兼容分页和非分页返回格式
      if (Array.isArray(res)) {
        setUsers(res);
        setTotal(res.length);
      } else {
        setUsers(res.list || []);
        setTotal(res.total || 0);
      }
    } catch (e) { console.error('加载用户失败:', e); } finally { setLoading(false); }
  };
  const loadRoles = async () => { try { setRoles(await roleApi.list()); } catch (e) { console.error('加载角色失败:', e); } };

  useEffect(() => { loadUsers(); loadRoles(); }, [page, pageSize]);

  const handleCreate = () => { setEditingUser(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      realName: user.realName, department: user.department, phone: user.phone,
      status: user.status, roleIds: user.roles?.map((r) => r.id) || [],
    });
    setModalVisible(true);
  };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingUser) { await userApi.update(editingUser.id, values); message.success('更新成功'); }
      else { await userApi.create(values); message.success('创建成功'); }
      setModalVisible(false); loadUsers();
    } catch (e) { console.error('保存用户失败:', e); }
  };
  const handleDelete = async (id: number) => { await userApi.remove(id); message.success('已禁用'); loadUsers(); };

  /** 重置密码（独立受控弹窗，避免闭包问题） */
  const handleResetPassword = (user: User) => {
    setResetModal({ open: true, user, password: '' });
  };
  const handleResetSubmit = async () => {
    if (!resetModal.user) return;
    // 同步后端密码规则：至少 8 位 + 大小写字母 + 数字
    if (!resetModal.password || resetModal.password.length < 8
        || !/[a-z]/.test(resetModal.password)
        || !/[A-Z]/.test(resetModal.password)
        || !/\d/.test(resetModal.password)) {
      message.error('密码至少 8 位，需包含大小写字母和数字');
      return;
    }
    try {
      await userApi.resetPassword(resetModal.user.id, resetModal.password);
      message.success('密码已重置');
      setResetModal({ open: false, user: null, password: '' });
    } catch (e) {
      // 错误已由 request 拦截器统一提示
    }
  };

  // 用户列表列
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
    <Card
      title="用户管理"
      extra={
        <Space>
          <Input placeholder="搜索账号/姓名" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => { setPage(1); loadUsers(); }} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增用户</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>批量导入</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} scroll={{ x: 800 }}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
      />

      {/* 新增/编辑用户弹窗 */}
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

      {/* 批量导入弹窗（拆分为独立组件） */}
      <UserBatchImport
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onSuccess={loadUsers}
      />

      {/* 重置密码弹窗（受控状态，避免闭包陷阱） */}
      <Modal
        title={`重置密码 - ${resetModal.user?.realName || ''}`}
        open={resetModal.open}
        onOk={handleResetSubmit}
        onCancel={() => setResetModal({ open: false, user: null, password: '' })}
        okText="确认重置"
        cancelText="取消"
      >
        <p>请输入新密码：</p>
        <Input.Password
          value={resetModal.password}
          onChange={(e) => setResetModal((s) => ({ ...s, password: e.target.value }))}
          placeholder="至少 8 位，含大小写字母和数字"
        />
      </Modal>
    </Card>
  );
}
