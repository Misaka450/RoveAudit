import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Input, Tag, message, Popconfirm, Select } from 'antd';
import { SearchOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { auditLogApi } from '@/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogApi.list(keyword || undefined, page, pageSize);
      setLogs(data.list || []);
      setTotal(data.total || 0);
    } catch (e) {
      setLogs([]);
      console.error('加载审计日志失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [page, pageSize]);

  const handleSearch = () => { setPage(1); };

  const handleDelete = async (id: number) => {
    try {
      await auditLogApi.remove(id);
      message.success('删除成功');
      loadLogs();
    } catch (e) { message.error('删除失败'); console.error('删除审计日志失败:', e); }
  };

  const handleClean = async () => {
    try {
      await auditLogApi.clean(30);
      message.success('清理完成');
      loadLogs();
    } catch (e) { message.error('清理失败'); console.error('清理审计日志失败:', e); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户', dataIndex: 'username', key: 'username', width: 100 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 200, ellipsis: true },
    { title: '模块', dataIndex: 'module', key: 'module', width: 100 },
    { title: '方法', dataIndex: 'method', key: 'method', width: 80 },
    { title: '路径', dataIndex: 'path', key: 'path', width: 200, ellipsis: true },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120 },
    { title: '耗时', dataIndex: 'duration', key: 'duration', width: 80, render: (v: number) => v ? `${v}ms` : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: number) => v === 1 ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => (
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="审计日志">
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索用户名/操作..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 260 }}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={loadLogs}>刷新</Button>
        <Popconfirm title="清理30天前的日志？" onConfirm={handleClean}>
          <Button danger>清理日志</Button>
        </Popconfirm>
        <span style={{ color: '#999' }}>共 {total} 条记录</span>
      </Space>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </Card>
  );
}
