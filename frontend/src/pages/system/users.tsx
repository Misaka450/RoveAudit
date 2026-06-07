import { useEffect, useState, useRef } from 'react';
import { Card, Table, Button, Space, Input, Modal, Form, Select, Tag, message, Popconfirm, Upload, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { read, utils, write } from 'xlsx';
import { userApi, roleApi } from '@/api';
import type { User } from '@/types';

/**
 * 用户管理页面 - 支持 Excel 批量导入
 */
export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 批量导入相关
  const [importVisible, setImportVisible] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await userApi.list(keyword)); } catch { /* */ } finally { setLoading(false); }
  };
  const loadRoles = async () => { try { setRoles(await roleApi.list()); } catch { /* */ } };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

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
    } catch { /* */ }
  };
  const handleDelete = async (id: number) => { await userApi.remove(id); message.success('已禁用'); loadUsers(); };
  const handleResetPassword = (user: User) => {
    Modal.confirm({
      title: '重置密码', content: `确定重置 "${user.realName}" 的密码为 123456？`,
      onOk: async () => { await userApi.resetPassword(user.id, '123456'); message.success('密码已重置'); },
    });
  };

  // ==================== Excel 批量导入 ====================
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.warning('Excel 文件为空');
          return;
        }

        // 列名映射（支持中英文列名）
        const columnMap: Record<string, string> = {
          '账号': 'username', '用户名': 'username', 'username': 'username',
          '姓名': 'realName', 'realName': 'realName', 'real_name': 'realName',
          '部门': 'department', 'department': 'department',
          '手机号': 'phone', '电话': 'phone', 'phone': 'phone',
          '角色': 'roleNames', '角色名': 'roleNames', 'roleNames': 'roleNames', 'role_names': 'roleNames',
          '密码': 'password', 'password': 'password',
        };

        const mapped = jsonData.map((row: any) => {
          const mappedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            const mappedKey = columnMap[key as string] || key;
            mappedRow[mappedKey] = value;
          }
          return mappedRow;
        });

        setImportData(mapped);
        setImportStep('preview');
      } catch {
        message.error('Excel 文件解析失败，请检查格式');
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // 阻止默认上传
  };

  const handleImport = async () => {
    if (importData.length === 0) { message.warning('没有数据可导入'); return; }
    setImportLoading(true);
    try {
      const result = await userApi.batchImport(importData);
      setImportResult(result);
      setImportStep('result');
      loadUsers();
    } catch {
      message.error('导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      { username: 'zhangsan', realName: '张三', department: '技术部', phone: '13800001001', roleNames: '普通用户', password: '123456' },
      { username: 'lisi', realName: '李四', department: '市场部', phone: '13800001002', roleNames: '普通用户', password: '123456' },
    ];
    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, '用户导入模板');
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
    ];
    // 生成二进制并下载
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '用户导入模板.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    message.success('模板已下载');
  };

  const handleCloseImport = () => {
    setImportVisible(false);
    setImportData([]);
    setImportStep('upload');
    setImportResult(null);
  };

  // 批量导入预览表格列
  const previewColumns = [
    { title: '账号', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '角色', dataIndex: 'roleNames', key: 'roleNames' },
    {
      title: '状态', key: 'status',
      render: (_: any, rec: any) => {
        if (!rec.username || !rec.realName || !rec.password) {
          return <Tag color="red">缺少必填字段</Tag>;
        }
        return <Tag color="green">正常</Tag>;
      },
    },
  ];

  // ==================== 用户列表列 ====================
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
          <Input placeholder="搜索账号/姓名" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={loadUsers} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增用户</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>批量导入</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} scroll={{ x: 800 }} />

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

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入用户"
        open={importVisible}
        onCancel={handleCloseImport}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Tabs
          activeKey={importStep}
          items={[
            {
              key: 'upload',
              label: '1. 上传 Excel',
              children: (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <FileExcelOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                  <div style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                      下载导入模板
                    </Button>
                  </div>
                  <div style={{ color: '#999', marginBottom: 24 }}>
                    请先下载模板，按格式填写后上传。必填字段：账号、姓名、密码
                  </div>
                  <Upload.Dragger
                    accept=".xlsx,.xls"
                    beforeUpload={handleFileUpload as any}
                    showUploadList={false}
                    style={{ maxWidth: 500, margin: '0 auto' }}
                  >
                    <p style={{ fontSize: 48 }}>📄</p>
                    <p style={{ fontSize: 16 }}>点击或拖拽 Excel 文件到此处上传</p>
                    <p style={{ color: '#999' }}>支持 .xlsx、.xls 格式</p>
                  </Upload.Dragger>
                </div>
              ),
            },
            {
              key: 'preview',
              label: `2. 预览数据 (${importData.length} 条)`,
              disabled: importStep === 'upload',
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      共 {importData.length} 条数据
                      {importData.filter((r) => !r.username || !r.realName || !r.password).length > 0 && (
                        <span style={{ color: '#ff4d4f', fontSize: 14, marginLeft: 16 }}>
                          ⚠️ {importData.filter((r) => !r.username || !r.realName || !r.password).length} 条数据不完整
                        </span>
                      )}
                    </span>
                    <Space>
                      <Button onClick={() => setImportStep('upload')}>重新上传</Button>
                      <Button type="primary" icon={<UploadOutlined />} onClick={handleImport} loading={importLoading}>
                        确认导入
                      </Button>
                    </Space>
                  </div>
                  <Table
                    columns={previewColumns}
                    dataSource={importData}
                    rowKey={(_, index) => String(index)}
                    size="small"
                    scroll={{ x: 700 }}
                    pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
                  />
                </div>
              ),
            },
            {
              key: 'result',
              label: '3. 导入结果',
              disabled: importStep !== 'result',
              children: (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  {importResult && (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>
                        {importResult.success > 0 ? '✅' : '❌'}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
                        导入完成
                      </div>
                      <div style={{ fontSize: 16, marginBottom: 24 }}>
                        <span style={{ color: '#52c41a' }}>成功 {importResult.success} 条</span>
                        {importResult.failed > 0 && (
                          <span style={{ color: '#ff4d4f', marginLeft: 24 }}>失败 {importResult.failed} 条</span>
                        )}
                      </div>
                      {importResult.errors?.length > 0 && (
                        <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto 24px' }}>
                          <div style={{ fontWeight: 600, marginBottom: 8, color: '#ff4d4f' }}>失败详情：</div>
                          <div style={{ maxHeight: 200, overflow: 'auto', background: '#fff2f0', padding: 12, borderRadius: 6, fontSize: 13 }}>
                            {importResult.errors.map((err: string, i: number) => (
                              <div key={i} style={{ marginBottom: 4 }}>{err}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button type="primary" onClick={handleCloseImport}>完成</Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  );
}
