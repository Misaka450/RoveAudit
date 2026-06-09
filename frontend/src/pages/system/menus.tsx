import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { menuApi } from '@/api';

/**
 * 菜单管理页面
 */
export default function MenuPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [form] = Form.useForm();

  const loadMenus = async () => {
    setLoading(true);
    try {
      const data = await menuApi.list();
      setMenus(data);
    } catch (e) { console.error('加载菜单失败:', e); } finally { setLoading(false); }
  };

  useEffect(() => { loadMenus(); }, []);

  const handleCreate = () => {
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ parentId: 0, sortOrder: 0, status: 1 });
    setModalVisible(true);
  };

  const handleEdit = (menu: any) => {
    setEditingMenu(menu);
    form.setFieldsValue(menu);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editingMenu) {
        await menuApi.update(editingMenu.id, values);
        message.success('更新成功');
      } else {
        await menuApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadMenus();
    } catch (e) { console.error('保存菜单失败:', e); }
  };

  const handleDelete = async (id: number) => {
    await menuApi.remove(id);
    message.success('已删除');
    loadMenus();
  };

  const columns = [
    { title: '菜单名称', dataIndex: 'menuName', key: 'menuName' },
    { title: '路由路径', dataIndex: 'path', key: 'path' },
    { title: '图标', dataIndex: 'icon', key: 'icon' },
    {
      title: '父级ID', dataIndex: 'parentId', key: 'parentId',
      render: (id: number) => id === 0 ? '顶级菜单' : id,
    },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="菜单管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增菜单</Button>}
    >
      <Table columns={columns} dataSource={menus} rowKey="id" loading={loading} />

      <Modal
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="menuName" label="菜单名称" rules={[{ required: true }]}>
            <Input placeholder="如：首页" />
          </Form.Item>
          <Form.Item name="path" label="路由路径">
            <Input placeholder="如：/home" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="Ant Design 图标名，如：HomeOutlined" />
          </Form.Item>
          <Form.Item name="parentId" label="父菜单ID">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0表示顶级菜单" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序号">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}