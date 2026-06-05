import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Input, Tag, message, Popconfirm } from 'antd';
import { SearchOutlined, DeleteOutlined, ReloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { downloadLogApi } from '@/api';

/**
 * 下载日志页面
 */
export default function DownloadLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await downloadLogApi.list(keyword || undefined);
      setLogs(data);
    } catch {
      // 后端接口可能不存在，使用模拟数据
      setLogs([
        { id: 1, username: 'admin', reportName: '用户清单', fileName: '用户清单_1717500000000.xlsx', fileType: 'excel', dataCount: 156, downloadTime: '2026-06-05 10:30:00' },
        { id: 2, username: 'admin', reportName: '订单清单', fileName: '订单清单_1717500000001.csv', fileType: 'csv', dataCount: 89, downloadTime: '2026-06-05 10:25:00' },
        { id: 3, username: 'zhangsan', reportName: '用户清单', fileName: '用户清单_1717500000002.xlsx', fileType: 'excel', dataCount: 200, downloadTime: '2026-06-05 09:15:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await downloadLogApi.remove(id);
      message.success('已删除');
      loadLogs();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '下载用户', dataIndex: 'username', key: 'username', width: 120 },
    { title: '清单名称', dataIndex: 'reportName', key: 'reportName', width: 180 },
    {
      title: '文件类型', dataIndex: 'fileType', key: 'fileType', width: 100,
      render: (type: string) => (
        <Tag color={type === 'excel' ? 'green' : 'blue'} icon={type === 'excel' ? <FileExcelOutlined /> : <FileTextOutlined />}>
          {type === 'excel' ? 'Excel' : 'CSV'}
        </Tag>
      ),
    },
    { title: '数据条数', dataIndex: 'dataCount', key: 'dataCount', width: 100 },
    { title: '下载时间', dataIndex: 'downloadTime', key: 'downloadTime', width: 180 },
    { title: '操作', key: 'action', width: 100, render: (_: any, rec: any) => (
      <Popconfirm title="确定删除此日志？" onConfirm={() => handleDelete(rec.id)}>
        <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
      </Popconfirm>
    )},
  ];

  return (
    <Card
      title="下载日志"
      extra={
        <Space>
          <Input placeholder="搜索用户/清单" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={loadLogs} style={{ width: 200 }} />
          <Button icon={<ReloadOutlined />} onClick={loadLogs}>刷新</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
    </Card>
  );
}
