import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Statistic, Row, Col } from 'antd';
import { FireOutlined, ReloadOutlined } from '@ant-design/icons';
import { warningApi } from '@/api';

export default function WarningResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await warningApi.getResults();
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalHigh = results.filter(r => r.riskLevel === 'high').length;
  const totalMedium = results.filter(r => r.riskLevel === 'medium').length;
  const totalLow = results.filter(r => r.riskLevel === 'low').length;
  const totalCount = results.reduce((sum, r) => sum + (r.lastResultCount || 0), 0);

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'red';
    if (level === 'medium') return 'orange';
    return 'blue';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 160 },
    { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 120 },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (v: string) => <Tag color={getRiskColor(v)}>{v === 'high' ? '高' : v === 'medium' ? '中' : '低'}</Tag>,
    },
    { title: '异常数量', dataIndex: 'lastResultCount', key: 'lastResultCount', width: 100 },
    {
      title: '最后执行',
      dataIndex: 'lastRunTime',
      key: 'lastRunTime',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
  ];

  return (
    <Card title="异常检测结果">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="高风险规则" value={totalHigh} valueStyle={{ color: '#cf1322' }} prefix={<FireOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="中风险规则" value={totalMedium} valueStyle={{ color: '#d46b08' }} />
        </Col>
        <Col span={6}>
          <Statistic title="低风险规则" value={totalLow} valueStyle={{ color: '#096dd9' }} />
        </Col>
        <Col span={6}>
          <Statistic title="累计异常数" value={totalCount} />
        </Col>
      </Row>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={results}
        rowKey="id"
        loading={loading}
        pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
    </Card>
  );
}
