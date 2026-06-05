import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Tree, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { roleApi, menuApi } from '@/api';
import type { Role } from '@/types';

/**
 * 角色管理页面 - 管理角色、分配菜单权限
 */
export default function RolePage() {
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
    <Card title="角色管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增角色</Button>}>
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
    </Card>
  );
}
