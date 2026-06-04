import { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Tabs, Typography, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';

const { Title } = Typography;

/**
 * 统计分析中心 - 使用 ECharts 展示图表
 */
export default function AnalysisPage() {
  const [chartType, setChartType] = useState('line'); // 图表类型
  const [dataType, setDataType] = useState('trend'); // 数据类型

  // 示例趋势数据
  const trendOption = {
    title: { text: '用户发展趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增用户', '活跃用户'], bottom: 0 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [
      { name: '新增用户', type: chartType, data: [120, 200, 150, 180, 220, 250], smooth: true },
      { name: '活跃用户', type: chartType, data: [800, 900, 950, 1000, 1100, 1200], smooth: true },
    ],
  };

  // 示例排名数据
  const rankOption = {
    title: { text: '省份排名', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: ['广东', '浙江', '江苏', '山东', '河南', '四川'] },
    yAxis: { type: 'value' },
    series: [{ name: '排名', type: 'bar', data: [9800, 8500, 7800, 7200, 6800, 6200] }],
  };

  // 示例占比数据
  const pieOption = {
    title: { text: '业务占比', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'], // 环形图
      data: [
        { value: 335, name: '用户发展' },
        { value: 310, name: '收入分析' },
        { value: 234, name: '流量统计' },
        { value: 135, name: '渠道统计' },
        { value: 548, name: '营业厅' },
      ],
    }],
  };

  const getOption = () => {
    if (dataType === 'trend') return trendOption;
    if (dataType === 'rank') return rankOption;
    return pieOption;
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>统计分析中心</Title>

      {/* 工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span>数据类型：</span>
            <Select
              value={dataType}
              onChange={setDataType}
              style={{ width: 150 }}
              options={[
                { value: 'trend', label: '趋势分析' },
                { value: 'rank', label: '排名分析' },
                { value: 'pie', label: '占比分析' },
              ]}
            />
          </Col>
          <Col>
            <span>图表类型：</span>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 150 }}
              options={[
                { value: 'line', label: '折线图' },
                { value: 'bar', label: '柱状图' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <ReactECharts option={getOption()} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="对比分析">
            <ReactECharts option={rankOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="占比分析">
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}