import { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Typography, Empty, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { reportApi, reportChartApi } from '@/api';
import type { ReportConfig, ReportChartConfig } from '@/types';

const { Title } = Typography;

/**
 * 统计分析中心 - 动态加载清单图表配置自动渲染 ECharts
 */
export default function AnalysisPage() {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [charts, setCharts] = useState<ReportChartConfig[]>([]);
  const [chartData, setChartData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  // 加载可用的清单列表
  useEffect(() => {
    reportApi.list().then((list) => {
      const withCharts = list.filter((r) => r.enableChart);
      setReports(withCharts);
      if (withCharts.length > 0) {
        setSelectedReport(withCharts[0].reportCode);
      }
    }).catch(() => {});
  }, []);

  // 加载选定清单的图表配置和数据
  useEffect(() => {
    if (!selectedReport) return;
    setLoading(true);

    Promise.all([
      reportChartApi.list(selectedReport),
      // 模拟查询数据（实际项目中需要调用数据查询接口）
      fetchMockData(selectedReport),
    ]).then(([chartConfigs, mockData]) => {
      setCharts(chartConfigs);
      setChartData(mockData);
    }).catch(() => {
      setCharts([]);
      setChartData({});
    }).finally(() => {
      setLoading(false);
    });
  }, [selectedReport]);

  /** 根据图表配置生成 ECharts option */
  const buildChartOption = (chart: ReportChartConfig) => {
    const data = chartData[chart.dimensionColumn] || [];
    const metrics: string[] = JSON.parse(chart.metricColumns || '[]');
    const labels: Record<string, string> = JSON.parse(chart.metricLabels || '{}');

    // 维度值（X轴）
    const dimensions = [...new Set(data.map((d: any) => d[chart.dimensionColumn]))];

    if (chart.chartType === 'pie') {
      // 饼图/环形图 - 使用第一个指标列
      const metricKey = metrics[0];
      return {
        title: { text: chart.chartTitle, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: chart.isRing ? ['40%', '70%'] : '70%',
          data: dimensions.map((dim: any) => ({
            name: String(dim),
            value: data.filter((d: any) => d[chart.dimensionColumn] === dim)
              .reduce((sum: number, d: any) => sum + Number(d[metricKey] || 0), 0),
          })),
          label: { show: true, formatter: '{b}: {d}%' },
        }],
      };
    }

    // 折线图/柱状图/面积图
    const series = metrics.map((key) => ({
      name: labels[key] || key,
      type: chart.chartType as any,
      data: dimensions.map((dim: any) => {
        const match = data.find((d: any) => d[chart.dimensionColumn] === dim);
        return match ? Number(match[key] || 0) : 0;
      }),
      smooth: true,
      areaStyle: chart.chartType === 'area' ? {} : undefined,
    }));

    return {
      title: { text: chart.chartTitle, left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: metrics.map((k) => labels[k] || k), bottom: 0 },
      xAxis: { type: 'category', data: dimensions, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value' },
      grid: { bottom: 60 },
      series,
    };
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>统计分析中心</Title>

      {/* 选择清单 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>选择清单：</span>
            <Select
              value={selectedReport || undefined}
              onChange={setSelectedReport}
              style={{ width: 250 }}
              placeholder="请选择清单"
              options={reports.map((r) => ({
                value: r.reportCode,
                label: `${r.reportName} (${r.category})`,
              }))}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" tip="加载图表数据..." />
        </div>
      ) : charts.length === 0 ? (
        <Empty description={
          selectedReport
            ? '该清单尚未配置图表，请前往"系统设置 > 清单配置"添加'
            : '暂无支持图表的清单'
        } style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {charts.map((chart) => (
            <Col xs={24} md={chart.chartType === 'pie' ? 8 : 12} key={chart.id}>
              <Card>
                <ReactECharts option={buildChartOption(chart)} style={{ height: 360 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

/** 模拟数据（实际应调用后端数据查询接口） */
async function fetchMockData(reportCode: string): Promise<Record<string, any[]>> {
  // 模拟延迟
  await new Promise((r) => setTimeout(r, 300));

  // 根据不同的清单返回不同的模拟数据
  const mockDataMap: Record<string, any[]> = {
    'user_develop': [
      { month: '1月', user_count: 120, active_count: 800 },
      { month: '2月', user_count: 200, active_count: 900 },
      { month: '3月', user_count: 150, active_count: 950 },
      { month: '4月', user_count: 180, active_count: 1000 },
      { month: '5月', user_count: 220, active_count: 1100 },
      { month: '6月', user_count: 250, active_count: 1200 },
    ],
    'revenue_analysis': [
      { month: '1月', revenue: 5800, cost: 3200 },
      { month: '2月', revenue: 6200, cost: 3500 },
      { month: '3月', revenue: 7100, cost: 3800 },
      { month: '4月', revenue: 6900, cost: 3600 },
      { month: '5月', revenue: 8300, cost: 4100 },
      { month: '6月', revenue: 9800, cost: 4500 },
    ],
    'traffic_stats': [
      { province: '广东', traffic: 9800 },
      { province: '浙江', traffic: 8500 },
      { province: '江苏', traffic: 7800 },
      { province: '山东', traffic: 7200 },
      { province: '河南', traffic: 6800 },
      { province: '四川', traffic: 6200 },
    ],
    'channel_stats': [
      { channel: '线上渠道', ratio: 45 },
      { channel: '营业厅', ratio: 30 },
      { channel: '代理点', ratio: 15 },
      { channel: '其他', ratio: 10 },
    ],
    'audit_summary': [
      { month: '1月', pass_count: 560, fail_count: 12 },
      { month: '2月', pass_count: 590, fail_count: 8 },
      { month: '3月', pass_count: 620, fail_count: 15 },
      { month: '4月', pass_count: 580, fail_count: 10 },
      { month: '5月', pass_count: 640, fail_count: 6 },
      { month: '6月', pass_count: 610, fail_count: 9 },
    ],
  };

  return (mockDataMap[reportCode] || []) as any;
}