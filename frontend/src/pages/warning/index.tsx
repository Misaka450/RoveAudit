import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Row, Col, Statistic } from 'antd';
import { AlertOutlined, WarningOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { warningApi } from '@/api';

/**
 * 异常分析中心 - 展示异常检测结果和图表
 */
export default function WarningPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // 加载异常检测结果
  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await warningApi.getResults();
      setResults(data);
    } catch {
      // 后端未启动时会走这里，使用模拟数据
      setResults([
        { id: 1, ruleName: '用户数据异常', ruleType: '数据波动', riskLevel: 'high', lastRunTime: '2024-06-01 10:00', lastResultCount: 156 },
        { id: 2, ruleName: '收入数据下降', ruleType: '趋势异常', riskLevel: 'medium', lastRunTime: '2024-06-01 10:00', lastResultCount: 89 },
        { id: 3, ruleName: '流量突增', ruleType: '流量异常', riskLevel: 'high', lastRunTime: '2024-06-01 10:00', lastResultCount: 432 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResults(); }, []);

  // 手动执行所有异常检测
  const handleExecuteAll = async () => {
    setExecuting(true);
    try {
      const data = await warningApi.executeAll();
      message.success(`检测完成，共发现 ${data.filter((r: any) => r.status === 'success').reduce((s: number, r: any) => s + r.count, 0)} 条异常`);
      loadResults();
    } catch {
      message.error('执行失败，请检查后端服务');
    } finally {
      setExecuting(false);
    }
  };

  // 异常趋势图（示例数据）
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['高风险', '中风险', '低风险'], bottom: 0 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: '异常数量' },
    series: [
      { name: '高风险', type: 'line', data: [15, 20, 18, 25, 22, 30], smooth: true, itemStyle: { color: '#ff4d4f' } },
      { name: '中风险', type: 'line', data: [45, 50, 42, 55, 48, 60], smooth: true, itemStyle: { color: '#faad14' } },
      { name: '低风险', type: 'line', data: [80, 90, 85, 100, 95, 110], smooth: true, itemStyle: { color: '#52c41a' } },
    ],
  };

  // 异常类型占比图
  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: 156, name: '数据波动' },
        { value: 89, name: '趋势异常' },
        { value: 432, name: '流量异常' },
        { value: 67, name: '其他异常' },
      ],
    }],
  };

  // 统计汇总
  const totalAbnormal = results.reduce((sum, r) => sum + r.lastResultCount, 0);
  const highRiskCount = results.filter((r) => r.riskLevel === 'high').length;
  const mediumRiskCount = results.filter((r) => r.riskLevel === 'medium').length;

  const columns = [
    { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
    { title: '异常类型', dataIndex: 'ruleType', key: 'ruleType' },
    {
      title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel',
      render: (level: string) => (
        <Tag color={level === 'high' ? 'red' : level === 'medium' ? 'orange' : 'green'}>
          {level === 'high' ? '高风险' : level === 'medium' ? '中风险' : '低风险'}
        </Tag>
      ),
    },
    {
      title: '异常数量', dataIndex: 'lastResultCount', key: 'lastResultCount',
      render: (count: number) => (
        <span style={{ color: count > 100 ? '#ff4d4f' : count > 50 ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
          {count}
        </span>
      ),
    },
    { title: '最后执行时间', dataIndex: 'lastRunTime', key: 'lastRunTime' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h4 style={{ margin: 0 }}>异常分析中心</h4>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadResults} loading={loading}>刷新</Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleExecuteAll}
            loading={executing}
            danger
          >
            执行全部检测
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="异常总数" value={totalAbnormal} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="高风险规则" value={highRiskCount} prefix={<AlertOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="中风险规则" value={mediumRiskCount} prefix={<AlertOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="异常趋势图">
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="异常类型占比">
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 异常检测结果表 */}
      <Card title="异常检测结果">
        <Table
          columns={columns}
          dataSource={results}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}