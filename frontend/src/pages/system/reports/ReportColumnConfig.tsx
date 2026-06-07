import { useState, useEffect } from 'react';
import { Table, Button, Input, InputNumber, Select, Switch, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { reportColumnApi } from '@/api';
import type { ReportColumnConfig as ReportColumnConfigType } from '@/types';

interface Props {
  reportCode: string;
  visible: boolean;
}

export default function ReportColumnConfig({ reportCode, visible }: Props) {
  const [columns, setColumns] = useState<ReportColumnConfigType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !reportCode) return;
    setLoading(true);
    reportColumnApi.get(reportCode)
      .then((data) => setColumns(data.length > 0 ? data : []))
      .catch(() => setColumns([]))
      .finally(() => setLoading(false));
  }, [reportCode, visible]);

  const handleAdd = () => {
    setColumns([...columns, {
      reportCode,
      columnName: '',
      columnLabel: '',
      width: 150,
      align: 'left',
      sortable: 1,
      filterable: 1,
      visible: 1,
      sortOrder: columns.length,
      isDate: 0,
    }]);
  };

  const handleRemove = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const next = [...columns];
    (next[index] as any)[field] = value;
    setColumns(next);
  };

  const handleSave = async () => {
    try {
      await reportColumnApi.save(reportCode, columns);
      message.success('字段配置已保存');
    } catch {
      message.error('保存失败');
    }
  };

  const tableColumns = [
    { title: '字段名', dataIndex: 'columnName', key: 'columnName', width: 140,
      render: (_: any, __: any, i: number) => (
        <Input size="small" value={columns[i]?.columnName}
          onChange={(e) => handleChange(i, 'columnName', e.target.value)} placeholder="user_count" />
      ),
    },
    { title: '中文名', dataIndex: 'columnLabel', key: 'columnLabel', width: 140,
      render: (_: any, __: any, i: number) => (
        <Input size="small" value={columns[i]?.columnLabel}
          onChange={(e) => handleChange(i, 'columnLabel', e.target.value)} placeholder="用户数" />
      ),
    },
    { title: '列宽', dataIndex: 'width', key: 'width', width: 80,
      render: (_: any, __: any, i: number) => (
        <InputNumber size="small" min={50} max={500} value={columns[i]?.width}
          onChange={(v) => handleChange(i, 'width', v)} style={{ width: 70 }} />
      ),
    },
    { title: '对齐', dataIndex: 'align', key: 'align', width: 80,
      render: (_: any, __: any, i: number) => (
        <Select size="small" value={columns[i]?.align}
          onChange={(v) => handleChange(i, 'align', v)}
          options={[{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }]}
          style={{ width: 70 }} />
      ),
    },
    { title: '可排序', dataIndex: 'sortable', key: 'sortable', width: 70,
      render: (_: any, __: any, i: number) => (
        <Switch size="small" checked={!!columns[i]?.sortable}
          onChange={(v) => handleChange(i, 'sortable', v ? 1 : 0)} />
      ),
    },
    { title: '可筛选', dataIndex: 'filterable', key: 'filterable', width: 70,
      render: (_: any, __: any, i: number) => (
        <Switch size="small" checked={!!columns[i]?.filterable}
          onChange={(v) => handleChange(i, 'filterable', v ? 1 : 0)} />
      ),
    },
    { title: '显示', dataIndex: 'visible', key: 'visible', width: 60,
      render: (_: any, __: any, i: number) => (
        <Switch size="small" checked={!!columns[i]?.visible}
          onChange={(v) => handleChange(i, 'visible', v ? 1 : 0)} />
      ),
    },
    { title: '操作', key: 'action', width: 60,
      render: (_: any, __: any, i: number) => (
        <Button type="link" danger size="small" icon={<DeleteOutlined />}
          onClick={() => handleRemove(i)} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, color: '#666' }}>
        配置清单每列的中文名、宽度、对齐方式等。稽核人员配置后，前端自动按此渲染。
      </div>
      <Table
        columns={tableColumns}
        dataSource={columns.map((c, i) => ({ ...c, _key: i }))}
        rowKey="_key"
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        footer={() => (
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd} size="small">
            新增字段
          </Button>
        )}
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={handleSave} disabled={!reportCode}>保存字段配置</Button>
      </div>
    </div>
  );
}
