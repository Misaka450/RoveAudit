import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Row, Col, Statistic, Grid, Typography } from 'antd';
import { AlertOutlined, WarningOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { warningApi } from '@/api';

const { Text } = Typography;
const { useBreakpoint } = Grid;

/** 移动端异常规则卡片 */
const MobileRuleCard = ({ record }: { record: any }) => (
  <Card size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: '10px 12px' } }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
      <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>{record.ruleName}</span>
      <Tag color={record.riskLevel === 'high' ? 'red' : record.riskLevel === 'medium' ? 'orange' : 'green'} style={{ marginLeft: 8, flexShrink: 0 }}>
        {record.riskLevel === 'high' ? '高风险' : record.riskLevel === 'medium' ? '中风险' : '低风险'}
      </Tag>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
      <span>{record.ruleType}</span>
      <span style={{ color: record.lastResultCount > 100 ? '#ff4d4f' : record.lastResultCount > 50 ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
        异常 {record.lastResultCount} 条
      </span>
    </div>
    {record.lastRunTime && (
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>最后执行：{record.lastRunTime}</div>
    )}
  </Card>
);

/**
 * 异常分析中心 - 展示异常检测结果和图表
 * 移动端：统计卡片全宽，表格改卡片
 */
export default function WarningPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [trendData, setTrendData] = useState<{ dates: string[]; high: number[]; medium: number[]; low: number[] } | null>(null);
  const [distribution, setDistribution] = useState<{ name: string; value: number }[]>([]);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // 加载异常检测结果
  const loadResults = async () => {
    setLoading(true);
    try {
      const [resultsData, trend, dist] = await Promise.all([
        warningApi.getResults(),
        warningApi.getTrend(),
        warningApi.getDistribution(),
      ]);
      setResults(resultsData);
      setTrendData(trend);
      setDistribution(dist);
    } catch (e) {
      message.error('加载预警数据失败，请检查后端服务');
      console.error('加载预警数据失败:', e);
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
    } catch (e) {
      message.error('执行失败，请检查后端服务');
      console.error('执行检测失败:', e);
    } finally {
      setExecuting(false);
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['高风险', '中风险', '低风险'], bottom: 0, textStyle: { fontSize: isMobile ? 10 : 12 } },
    grid: { bottom: 50, left: isMobile ? 30 : 50, right: isMobile ? 5 : 10, top: 20 },
    xAxis: { type: 'category', data: trendData?.dates || [], axisLabel: { fontSize: isMobile ? 9 : 11, rotate: isMobile ? 45 : 0 } },
    yAxis: { type: 'value', name: '异常数量', axisLabel: { fontSize: isMobile ? 10 : 11 } },
    series: [
      { name: '高风险', type: 'line', data: trendData?.high || [], smooth: true, itemStyle: { color: '#ff4d4f' } },
      { name: '中风险', type: 'line', data: trendData?.medium || [], smooth: true, itemStyle: { color: '#faad14' } },
      { name: '低风险', type: 'line', data: trendData?.low || [], smooth: true, itemStyle: { color: '#52c41a' } },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { fontSize: isMobile ? 10 : 12 } },
    series: [{
      type: 'pie',
      radius: '60%',
      label: { show: !isMobile },
      data: distribution.length > 0 ? distribution : [{ name: '暂无数据', value: 1 }],
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 12 : 24, flexWrap: 'wrap', gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: isMobile ? 16 : 20 }}>异常分析中心</h4>
        <Space size="small">
          <Button icon={<ReloadOutlined />} onClick={loadResults} loading={loading} size="small">
            {!isMobile && '刷新'}
          </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleExecuteAll}
            loading={executing}
            danger
            size="small"
          >
            {isMobile ? '执行' : '执行全部检测'}
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 24 }}>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title="异常总数"
              value={totalAbnormal}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f', fontSize: isMobile ? 20 : 24 }}
              style={{ textAlign: isMobile ? 'center' : 'left' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title="高风险"
              value={highRiskCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f', fontSize: isMobile ? 20 : 24 }}
              style={{ textAlign: 'center' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            <Statistic
              title="中风险"
              value={mediumRiskCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#faad14', fontSize: isMobile ? 20 : 24 }}
              style={{ textAlign: 'center' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 12 : 24 }}>
        <Col xs={24} lg={14}>
          <Card title="异常趋势图" styles={{ body: { padding: isMobile ? 8 : 16 } }}>
            <ReactECharts option={trendOption} style={{ height: isMobile ? 220 : 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="异常类型占比" styles={{ body: { padding: isMobile ? 8 : 16 } }}>
            <ReactECharts option={pieOption} style={{ height: isMobile ? 220 : 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 异常检测结果 - 移动端卡片/桌面端表格 */}
      <Card title="异常检测结果" styles={{ body: { padding: isMobile ? 8 : 16 } }}>
        {isMobile ? (
          loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">加载中...</Text></div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">暂无数据</Text></div>
          ) : (
            results.map((record) => <MobileRuleCard key={record.id} record={record} />)
          )
        ) : (
          <Table
            columns={columns}
            dataSource={results}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </div>
  );
}
