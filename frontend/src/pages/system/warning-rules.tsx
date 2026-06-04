import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select, Switch, Tag, message, Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { warningApi } from '@/api';

const { TextArea } = Input;

/**
 * 异常规则管理页面 - 配置异常检测规则
 */
export default function WarningRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form] = Form.useForm();

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await warningApi.listRules();
      setRules(data);
    } catch { /* 忽略 */ } finally { setLoading(false); }
  };

  useEffect(() => { loadRules(); }, []);

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ riskLevel: 'low', enableFlag: 1 });
    setModalVisible(true);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    form.setFieldsValue({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      sqlContent: rule.sqlContent,
      riskLevel: rule.riskLevel,
      enableFlag: !!rule.enableFlag,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      enableFlag: values.enableFlag ? 1 : 0,
    };
    try {
      if (editingRule) {
        await warningApi.updateRule(editingRule.id, payload);
        message.success('更新成功');
      } else {
        await warningApi.createRule(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadRules();
    } catch { /* 忽略 */ }
  };

  const handleDelete = async (id: number) => {
    await warningApi.removeRule(id);
    message.success('已删除');
    loadRules();
  };

  const handleExecute = async (id: number) => {
    try {
      const result = await warningApi.executeRule(id);
      message.success(`执行完成，发现 ${result.count} 条异常`);
      loadRules();
    } catch {
      message.error('执行失败');
    }
  };

  const columns = [
    { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 150 },
    { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 100 },
    {
      title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 100,
      render: (level: string) => (
        <Tag color={level === 'high' ? 'red' : level === 'medium' ? 'orange' : 'green'}>
          {level === 'high' ? '高' : level === 'medium' ? '中' : '低'}
        </Tag>
      ),
    },
    {
      title: '启用', dataIndex: 'enableFlag', key: 'enableFlag', width: 70,
      render: (v: number) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '上次检测数', dataIndex: 'lastResultCount', key: 'lastResultCount', width: 100,
      render: (count: number) => (
        <span style={{ color: count > 100 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
          {count || 0}
        </span>
      ),
    },
    { title: '最后执行时间', dataIndex: 'lastRunTime', key: 'lastRunTime', width: 160 },
    {
      title: '操作', key: 'action', width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" icon={<ThunderboltOutlined />} onClick={() => handleExecute(record.id)}>执行</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="异常规则管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增规则</Button>}
    >
      <Table columns={columns} dataSource={rules} rowKey="id" loading={loading} scroll={{ x: 900 }} />

      <Modal
        title={editingRule ? '编辑异常规则' : '新增异常规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={650}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="ruleName" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="如：用户数据异常检测" />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
            <Select placeholder="选择类型" options={[
              { value: '数据波动', label: '数据波动' },
              { value: '趋势异常', label: '趋势异常' },
              { value: '流量异常', label: '流量异常' },
              { value: '业务异常', label: '业务异常' },
              { value: '其他异常', label: '其他异常' },
            ]} />
          </Form.Item>
          <Form.Item name="riskLevel" label="风险等级" rules={[{ required: true }]}>
            <Select options={[
              { value: 'high', label: '高风险' },
              { value: 'medium', label: '中风险' },
              { value: 'low', label: '低风险' },
            ]} />
          </Form.Item>
          <Form.Item
            name="sqlContent"
            label="检测SQL"
            rules={[{ required: true, message: '请输入检测SQL' }]}
            tooltip="编写 SELECT 查询，查询结果即为异常数据"
          >
            <TextArea rows={6} placeholder="SELECT * FROM audit_data WHERE abnormal_count > 100" />
          </Form.Item>
          <Form.Item name="enableFlag" label="启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}