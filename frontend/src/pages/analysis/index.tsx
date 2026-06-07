import { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Typography, Empty, Spin, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import { reportApi, reportChartApi, dataQueryApi } from '@/api';
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

  // 加载选定清单的图表配置，并调用数据查询接口获取真实数据
  useEffect(() => {
    if (!selectedReport) return;
    setLoading(true);

    // 同时加载图表配置和清单数据（取全部数据用于图表渲染）
    Promise.all([
      reportChartApi.list(selectedReport),
      dataQueryApi.query(selectedReport, { pageSize: 10000 }).catch(() => null),
    ]).then(([chartConfigs, queryResult]) => {
      setCharts(chartConfigs);
      // 将查询结果转换为 chartData 格式：按维度列名分组存储
      if (queryResult && queryResult.list) {
        const dataMap: Record<string, any[]> = {};
        // 从图表配置中提取所有维度列
        const dimColumns = [...new Set(chartConfigs.map((c: ReportChartConfig) => c.dimensionColumn))];
        dimColumns.forEach((col) => {
          dataMap[col] = queryResult.list;
        });
        setChartData(dataMap);
      } else {
        setChartData({});
      }
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

