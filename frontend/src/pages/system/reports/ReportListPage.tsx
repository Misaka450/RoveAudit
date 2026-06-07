import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Switch, Tag, message, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { reportApi } from '@/api';
import type { ReportConfig } from '@/types';
import ReportColumnConfig from './ReportColumnConfig';
import ReportChartConfig from './ReportChartConfig';

const { TextArea } = Input;

export default function ReportConfigPage() {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportConfig | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [form] = Form.useForm();

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportApi.listAdmin(keyword);
      setReports(data);
    } catch { /* 忽略 */ } finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  const handleCreate = () => {
    setEditingReport(null);
    form.resetFields();
    form.setFieldsValue({ enableDownload: true, enableChart: false, status: 1, sortOrder: 0 });
    setActiveTab('basic');
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

      <Modal
        title={editingReport ? `编辑清单：${editingReport.reportName}` : '新增清单配置'}
        open={modalVisible}
        onOk={activeTab === 'basic' ? handleSubmitBasic : undefined}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={activeTab === 'basic' ? 700 : 900}
        okText={activeTab === 'basic' ? '保存' : '关闭'}
        footer={activeTab === 'basic' ? undefined : (
          <Button onClick={() => setModalVisible(false)}>关闭</Button>
        )}
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
                <Form.Item name="sqlContent" label="查询SQL" rules={[{ required: true, message: '请输入查询SQL' }]}
                  tooltip="支持 {{paramName}} 作为查询参数占位符，如 {{date}}、{{province}}">
                  <TextArea rows={6} placeholder="SELECT * FROM doris_table WHERE 1=1 {{date}} {{province}}" />
                </Form.Item>
                <Form.Item name="queryParams" label="查询参数配置（JSON）"
                  tooltip='配置查询参数自动生成筛选表单，格式：[{"key":"date","label":"月份","type":"month","required":true}]'>
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
            children: editingReport
              ? <ReportColumnConfig reportCode={editingReport.reportCode} visible={activeTab === 'columns'} />
              : <div style={{ color: '#ff4d4f', padding: 24, textAlign: 'center' }}>请先保存清单后再配置字段</div>,
          },
          {
            key: 'charts',
            label: '图表配置',
            disabled: !editingReport,
            children: editingReport
              ? <ReportChartConfig reportCode={editingReport.reportCode} visible={activeTab === 'charts'} />
              : <div style={{ color: '#ff4d4f', padding: 24, textAlign: 'center' }}>请先保存清单后再配置图表</div>,
          },
        ]} />
      </Modal>
    </Card>
  );
}
