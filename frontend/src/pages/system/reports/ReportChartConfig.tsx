import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, Switch, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { reportChartApi } from '@/api';
import type { ReportChartConfig } from '@/types';

interface Props {
  reportCode: string;
  visible: boolean;
}

export default function ReportChartConfig({ reportCode, visible }: Props) {
  const [charts, setCharts] = useState<ReportChartConfig[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChart, setEditingChart] = useState<ReportChartConfig | null>(null);
  const [chartForm] = Form.useForm();

  useEffect(() => {
    if (!visible || !reportCode) return;
    reportChartApi.list(reportCode)
      .then(setCharts)
      .catch(() => setCharts([]));
  }, [reportCode, visible]);

  const openAdd = () => {
    setEditingChart(null);
    chartForm.resetFields();
    chartForm.setFieldsValue({ chartType: 'bar', isRing: 0, sortOrder: 0 });
    setModalVisible(true);
  };

  const openEdit = (chart: ReportChartConfig) => {
    setEditingChart(chart);
    chartForm.setFieldsValue(chart);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = await chartForm.validateFields();
    try {
      if (editingChart) {
        await reportChartApi.update(editingChart.id!, { ...values });
        message.success('图表配置已更新');
      } else {
        await reportChartApi.create({ ...values, reportCode });
        message.success('图表配置已创建');
      }
      setModalVisible(false);
      // reload
      reportChartApi.list(reportCode).then(setCharts).catch((e) => console.error('刷新图表列表失败:', e));
    } catch (e) {
      message.error('操作失败');
      console.error('保存图表配置失败:', e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reportChartApi.remove(id);
      message.success('图表已删除');
      reportChartApi.list(reportCode).then(setCharts).catch((e) => console.error('刷新图表列表失败:', e));
    } catch (e) {
      message.error('操作失败');
      console.error('删除图表配置失败:', e);
    }
  };

  const chartTypeMap: Record<string, string> = { line: '折线图', bar: '柱状图', pie: '饼图', area: '面积图' };

  const tableColumns = [
    { title: '图表标题', dataIndex: 'chartTitle', key: 'chartTitle' },
    { title: '图表类型', dataIndex: 'chartType', key: 'chartType',
      render: (t: string) => chartTypeMap[t] || t,
    },
    { title: '维度列', dataIndex: 'dimensionColumn', key: 'dimensionColumn' },
    { title: '指标列', dataIndex: 'metricColumns', key: 'metricColumns', ellipsis: true },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 60 },
    { title: '操作', key: 'action', width: 120,
      render: (_: any, record: ReportChartConfig) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此图表？" onConfirm={() => handleDelete(record.id!)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#666' }}>配置清单的图表分析，支持折线图、柱状图、饼图等。</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} size="small">新增图表</Button>
      </div>
      <Table
        columns={tableColumns}
        dataSource={charts}
        rowKey="id"
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无图表配置，点击"新增图表"添加' }}
      />

      <Modal
        title={editingChart ? '编辑图表配置' : '新增图表配置'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={500}
      >
        <Form form={chartForm} layout="vertical">
          <Form.Item name="chartTitle" label="图表标题" rules={[{ required: true }]}>
            <Input placeholder="如：用户发展趋势" />
          </Form.Item>
          <Form.Item name="chartType" label="图表类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'line', label: '折线图' },
              { value: 'bar', label: '柱状图' },
              { value: 'pie', label: '饼图' },
              { value: 'area', label: '面积图' },
            ]} />
          </Form.Item>
          <Form.Item name="dimensionColumn" label="维度列（X轴字段名）" rules={[{ required: true }]} tooltip="如：month（用于分类轴/维度）">
            <Input placeholder="month" />
          </Form.Item>
          <Form.Item name="metricColumns" label="指标列（JSON数组）" rules={[{ required: true }]} tooltip='如：["user_count","active_count"]'>
            <Input placeholder='["user_count"]' />
          </Form.Item>
          <Form.Item name="metricLabels" label="指标中文名（JSON对象）" tooltip='如：{"user_count":"用户数","active_count":"活跃数"}'>
            <Input placeholder='{"user_count":"用户数"}' />
          </Form.Item>
          <Space size="large">
            <Form.Item name="isRing" label="环形图（仅饼图）" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序">
              <InputNumber min={0} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
