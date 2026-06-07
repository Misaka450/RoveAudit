import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, message, Popconfirm } from 'antd';
import { ReloadOutlined, DeleteOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { downloadLogApi } from '@/api';

export default function DownloadLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await downloadLogApi.list(page, pageSize);
      setLogs(data.list || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [page, pageSize]);

  const handleDelete = async (id: number) => {
    try {
      await downloadLogApi.remove(id);
      message.success('已删除');
      loadLogs();
    } catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '下载用户', dataIndex: 'username', key: 'username', width: 120 },
    { title: '清单名称', dataIndex: 'reportName', key: 'reportName', width: 180 },
    {
      title: '文件类型', dataIndex: 'fileType', key: 'fileType', width: 100,
      render: (type: string) => (
        <Tag color={type === 'excel' ? 'green' : 'blue'}
          icon={type === 'excel' ? <FileExcelOutlined /> : <FileTextOutlined />}>
          {type === 'excel' ? 'Excel' : 'CSV'}
        </Tag>
      ),
    },
    { title: '数据条数', dataIndex: 'dataCount', key: 'dataCount', width: 100 },
    { title: '下载时间', dataIndex: 'downloadTime', key: 'downloadTime', width: 180 },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, rec: any) => (
        <Popconfirm title="确定删除此日志？" onConfirm={() => handleDelete(rec.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title="下载日志"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadLogs}>刷新</Button>
          <span style={{ color: '#999' }}>共 {total} 条</span>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{
          current: page, pageSize, total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </Card>
  );
}
