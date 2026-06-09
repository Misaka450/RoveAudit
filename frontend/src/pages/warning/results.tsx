import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Statistic, Row, Col, Grid, Typography } from 'antd';
import { FireOutlined, ReloadOutlined } from '@ant-design/icons';
import { warningApi } from '@/api';

const { Text } = Typography;
const { useBreakpoint } = Grid;

/** 移动端规则结果卡片 */
const MobileResultCard = ({ record }: { record: any }) => {
  const getRiskColor = (level: string) => {
    if (level === 'high') return 'red';
    if (level === 'medium') return 'orange';
    return 'blue';
  };
  return (
    <Card size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: '10px 12px' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{record.ruleName}</span>
        <Tag color={getRiskColor(record.riskLevel)} style={{ marginLeft: 8, flexShrink: 0 }}>
          {record.riskLevel === 'high' ? '高' : record.riskLevel === 'medium' ? '中' : '低'}
        </Tag>
      </div>
      <div style={{ fontSize: 12, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
        <span>{record.ruleType}</span>
        <span>异常 {record.lastResultCount || 0} 条</span>
      </div>
      {record.lastRunTime && (
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
          {new Date(record.lastRunTime).toLocaleString()}
        </div>
      )}
    </Card>
  );
};

export default function WarningResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await warningApi.getResults();
      setResults(data || []);
    } catch (e) {
      setResults([]);
      console.error('加载预警结果失败:', e);
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
    <Card
      title="异常检测结果"
      extra={
        <Button icon={<ReloadOutlined />} onClick={loadData} size="small">
          {!isMobile && '刷新'}
        </Button>
      }
    >
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Statistic title="高风险" value={totalHigh} valueStyle={{ color: '#cf1322', fontSize: isMobile ? 18 : 24 }} prefix={<FireOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="中风险" value={totalMedium} valueStyle={{ color: '#d46b08', fontSize: isMobile ? 18 : 24 }} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="低风险" value={totalLow} valueStyle={{ color: '#096dd9', fontSize: isMobile ? 18 : 24 }} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="累计异常" value={totalCount} valueStyle={{ fontSize: isMobile ? 18 : 24 }} />
        </Col>
      </Row>

      {isMobile ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">加载中...</Text></div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">暂无数据</Text></div>
        ) : (
          results.map((record) => <MobileResultCard key={record.id} record={record} />)
        )
      ) : (
        <Table
          columns={columns}
          dataSource={results}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      )}
    </Card>
  );
}
