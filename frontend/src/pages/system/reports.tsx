import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Switch, Tag, message, Popconfirm, Tabs,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SettingOutlined, BarChartOutlined } from '@ant-design/icons';
import { reportApi, reportColumnApi, reportChartApi } from '@/api';
import type { ReportConfig, ReportColumnConfig, ReportChartConfig } from '@/types';

const { TextArea } = Input;

/**
 * 清单配置管理页面 - 配置化清单的核心
 * 支持字段元数据配置 + 图表配置
 */
export default function ReportConfigPage() {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportConfig | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [form] = Form.useForm();

  // 字段配置状态
  const [columns, setColumns] = useState<ReportColumnConfig[]>([]);
  const [columnLoading, setColumnLoading] = useState(false);

  // 图表配置状态
  const [charts, setCharts] = useState<ReportChartConfig[]>([]);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [editingChart, setEditingChart] = useState<ReportChartConfig | null>(null);
  const [chartForm] = Form.useForm();

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportApi.listAdmin(keyword);
      setReports(data);
    } catch { /* 忽略 */ } finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  /** 加载字段配置 */
  const loadColumns = async (reportCode: string) => {
    setColumnLoading(true);
    try {
      const data = await reportColumnApi.get(reportCode);
      setColumns(data.length > 0 ? data : []);
    } catch {
      // 接口不存在时自动生成默认配置
      setColumns([]);
    } finally {
      setColumnLoading(false);
    }
  };

  /** 加载图表配置 */
  const loadCharts = async (reportCode: string) => {
    try {
      const data = await reportChartApi.list(reportCode);
      setCharts(data);
    } catch {
      setCharts([]);
    }
  };

  // ==================== 基础配置 ====================
  const handleCreate = () => {
    setEditingReport(null);
    form.resetFields();
    form.setFieldsValue({ enableDownload: true, enableChart: false, status: 1, sortOrder: 0 });
    setActiveTab('basic');
    setColumns([]);
    setCharts([]);
    setModalVisible(true);
  };

  const handleEdit = async (report: ReportConfig) => {
    setEditingReport(report);
    form.setFieldsValue({
      ...report,
      enableDownload: !!report.enableDownload,
      enableChart: !!report.enableChart,
    });
    setActiveTab('basic');
    setModalVisible(true);
    // 异步加载字段配置和图表配置
    loadColumns(report.reportCode);
    loadCharts(report.reportCode);
  };

  const handleSubmitBasic = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      enableDownload: values.enableDownload ? 1 : 0,
      enableChart: values.enableChart ? 1 : 0,
    };
    try {
      if (editingReport) {
        await reportApi.update(editingReport.id, payload);
        message.success('更新成功');
      } else {
        await reportApi.create(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadReports();
    } catch { /* 忽略 */ }
  };

  const handleDelete = async (id: number) => {
    await reportApi.remove(id);
    message.success('已删除');
    loadReports();
  };

  // ==================== 字段配置 ====================
  /** 新增字段 */
  const handleAddColumn = () => {
    setColumns([...columns, {
      reportCode: editingReport?.reportCode || '',
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

  /** 删除字段 */
  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  /** 更新字段值 */
  const handleColumnChange = (index: number, field: string, value: any) => {
    const newColumns = [...columns];
    (newColumns[index] as any)[field] = value;
    setColumns(newColumns);
  };

  /** 保存字段配置 */
  const handleSaveColumns = async () => {
    if (!editingReport) return;
    try {
      await reportColumnApi.save(editingReport.reportCode, columns);
      message.success('字段配置已保存');
    } catch {
      message.error('保存失败');
    }
  };

  // ==================== 图表配置 ====================
  const handleAddChart = () => {
    setEditingChart(null);
    chartForm.resetFields();
    chartForm.setFieldsValue({ chartType: 'bar', isRing: 0, sortOrder: 0 });
    setChartModalVisible(true);
  };

  const handleEditChart = (chart: ReportChartConfig) => {
    setEditingChart(chart);
    chartForm.setFieldsValue(chart);
    setChartModalVisible(true);
  };

  const handleSaveChart = async () => {
    if (!editingReport) return;
    const values = await chartForm.validateFields();
    try {
      if (editingChart) {
        await reportChartApi.update(editingChart.id!, { ...values });
        message.success('图表配置已更新');
      } else {
        await reportChartApi.create({ ...values, reportCode: editingReport.reportCode });
        message.success('图表配置已创建');
      }
      setChartModalVisible(false);
      loadCharts(editingReport.reportCode);
    } catch { /* 忽略 */ }
  };

  const handleDeleteChart = async (id: number) => {
    try {
      await reportChartApi.update(id, { status: 0 });
      message.success('已禁用');
      if (editingReport) loadCharts(editingReport.reportCode);
    } catch {
      message.error('操作失败');
    }
  };

  // ==================== 表格列定义 ====================
  const columnsDef = [
    { title: '清单名称', dataIndex: 'reportName', key: 'reportName', width: 150 },
    { title: '编码', dataIndex: 'reportCode', key: 'reportCode', width: 120 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    {
      title: '下载', dataIndex: 'enableDownload', key: 'enableDownload', width: 80,
      render: (v: number) => <Tag color={v ? 'green' : 'default'}>{v ? '允许' : '禁止'}</Tag>,
    },
    {
      title: '图表', dataIndex: 'enableChart', key: 'enableChart', width: 80,
      render: (v: number) => <Tag color={v ? 'blue' : 'default'}>{v ? '支持' : '不支持'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: number) => <Tag color={s === 1 ? 'green' : 'red'}>{s === 1 ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: any, record: ReportConfig) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 字段配置表格列
  const columnTableColumns = [
    { title: '字段名', dataIndex: 'columnName', key: 'columnName', width: 140,
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={columns[index]?.columnName} onChange={(e) => handleColumnChange(index, 'columnName', e.target.value)} placeholder="user_count" />
      ),
    },
    { title: '中文名', dataIndex: 'columnLabel', key: 'columnLabel', width: 140,
      render: (_: any, __: any, index: number) => (
        <Input size="small" value={columns[index]?.columnLabel} onChange={(e) => handleColumnChange(index, 'columnLabel', e.target.value)} placeholder="用户数" />
      ),
    },
    { title: '列宽', dataIndex: 'width', key: 'width', width: 80,
      render: (_: any, __: any, index: number) => (
        <InputNumber size="small" min={50} max={500} value={columns[index]?.width} onChange={(v) => handleColumnChange(index, 'width', v)} style={{ width: 70 }} />
      ),
    },
    { title: '对齐', dataIndex: 'align', key: 'align', width: 80,
      render: (_: any, __: any, index: number) => (
        <Select size="small" value={columns[index]?.align} onChange={(v) => handleColumnChange(index, 'align', v)} options={[{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }]} style={{ width: 70 }} />
      ),
    },
    { title: '可排序', dataIndex: 'sortable', key: 'sortable', width: 70, render: (_: any, __: any, index: number) => <Switch size="small" checked={!!columns[index]?.sortable} onChange={(v) => handleColumnChange(index, 'sortable', v ? 1 : 0)} /> },
    { title: '可筛选', dataIndex: 'filterable', key: 'filterable', width: 70, render: (_: any, __: any, index: number) => <Switch size="small" checked={!!columns[index]?.filterable} onChange={(v) => handleColumnChange(index, 'filterable', v ? 1 : 0)} /> },
    { title: '显示', dataIndex: 'visible', key: 'visible', width: 60, render: (_: any, __: any, index: number) => <Switch size="small" checked={!!columns[index]?.visible} onChange={(v) => handleColumnChange(index, 'visible', v ? 1 : 0)} /> },
    { title: '操作', key: 'action', width: 60,
      render: (_: any, __: any, index: number) => (
        <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveColumn(index)} />
      ),
    },
  ];

  // 图表配置表格列
  const chartTableColumns = [
    { title: '图表标题', dataIndex: 'chartTitle', key: 'chartTitle' },
    { title: '图表类型', dataIndex: 'chartType', key: 'chartType', render: (t: string) => ({ line: '折线图', bar: '柱状图', pie: '饼图', area: '面积图' }[t] || t) },
    { title: '维度列', dataIndex: 'dimensionColumn', key: 'dimensionColumn' },
    { title: '指标列', dataIndex: 'metricColumns', key: 'metricColumns', ellipsis: true },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 60 },
    { title: '操作', key: 'action', width: 120,
      render: (_: any, record: ReportChartConfig) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditChart(record)}>编辑</Button>
          <Popconfirm title="确定禁用此图表？" onConfirm={() => handleDeleteChart(record.id!)}>
            <Button type="link" danger size="small">禁用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="清单配置管理"
      extra={
        <Space>
          <Input
            placeholder="搜索清单名称/编码"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={loadReports}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增清单</Button>
        </Space>
      }
    >
      <Table columns={columnsDef} dataSource={reports} rowKey="id" loading={loading} scroll={{ x: 800 }} />

      {/* 编辑弹窗：基础配置 + 字段配置 + 图表配置 */}
      <Modal
        title={editingReport ? `编辑清单：${editingReport.reportName}` : '新增清单配置'}
        open={modalVisible}
        onOk={activeTab === 'basic' ? handleSubmitBasic : (activeTab === 'columns' ? handleSaveColumns : undefined)}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={activeTab === 'basic' ? 700 : 900}
        okText={activeTab === 'basic' ? '保存' : (activeTab === 'columns' ? '保存字段配置' : '关闭')}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'basic',
            label: '基础配置',
            children: (
              <Form form={form} layout="vertical">
                <Form.Item name="reportName" label="清单名称" rules={[{ required: true, message: '请输入清单名称' }]}>
                  <Input placeholder="如：用户发展清单" />
                </Form.Item>
                <Form.Item name="reportCode" label="清单编码" rules={[{ required: true, message: '请输入清单编码' }]}>
                  <Input placeholder="如：user_develop（英文+下划线）" disabled={!!editingReport} />
                </Form.Item>
                <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                  <Select placeholder="选择分类" options={[
                    { value: '用户类', label: '用户类' },
                    { value: '收入类', label: '收入类' },
                    { value: '流量类', label: '流量类' },
                    { value: '渠道类', label: '渠道类' },
                    { value: '营业厅类', label: '营业厅类' },
                    { value: '稽核类', label: '稽核类' },
                    { value: '其他类', label: '其他类' },
                  ]} />
                </Form.Item>
                <Form.Item name="description" label="描述">
                  <Input.TextArea rows={2} placeholder="清单描述" />
                </Form.Item>
                <Form.Item
                  name="sqlContent"
                  label="查询SQL"
                  rules={[{ required: true, message: '请输入查询SQL' }]}
                  tooltip="支持 {{paramName}} 作为查询参数占位符，如 {{date}}、{{province}}"
                >
                  <TextArea rows={6} placeholder="SELECT * FROM doris_table WHERE 1=1 {{date}} {{province}}" />
                </Form.Item>
                <Form.Item
                  name="queryParams"
                  label="查询参数配置（JSON）"
                  tooltip='配置查询参数自动生成筛选表单，格式：[{"key":"date","label":"月份","type":"month","required":true}]'
                >
                  <TextArea rows={3} placeholder='[{"key":"date","label":"月份","type":"month"},{"key":"province","label":"省份","type":"select","options":[{"value":"广东","label":"广东"}]}]' />
                </Form.Item>
                <Space style={{ width: '100%' }} size="large">
                  <Form.Item name="enableDownload" label="允许下载" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="enableChart" label="支持图表" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="status" label="启用">
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                  <Form.Item name="sortOrder" label="排序">
                    <InputNumber min={0} />
                  </Form.Item>
                </Space>
              </Form>
            ),
          },
          {
            key: 'columns',
            label: '字段配置',
            disabled: !editingReport,
            children: (
              <div>
                <div style={{ marginBottom: 12, color: '#666' }}>
                  配置清单每列的中文名、宽度、对齐方式等。稽核人员配置后，前端自动按此渲染。
                  {!editingReport && <span style={{ color: '#ff4d4f' }}> 请先保存清单后再配置字段</span>}
                </div>
                <Table
                  columns={columnTableColumns}
                  dataSource={columns.map((c, i) => ({ ...c, _key: i }))}
                  rowKey="_key"
                  loading={columnLoading}
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                  footer={() => (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddColumn} size="small">
                      新增字段
                    </Button>
                  )}
                />
              </div>
            ),
          },
          {
            key: 'charts',
            label: '图表配置',
            disabled: !editingReport,
            children: (
              <div>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>配置清单的图表分析，支持折线图、柱状图、饼图等。</span>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddChart} size="small">新增图表</Button>
                </div>
                <Table
                  columns={chartTableColumns}
                  dataSource={charts}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  locale={{ emptyText: '暂无图表配置，点击"新增图表"添加' }}
                />
              </div>
            ),
          },
        ]} />
      </Modal>

      {/* 图表配置编辑弹窗 */}
      <Modal
        title={editingChart ? '编辑图表配置' : '新增图表配置'}
        open={chartModalVisible}
        onOk={handleSaveChart}
        onCancel={() => setChartModalVisible(false)}
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
    </Card>
  );
}