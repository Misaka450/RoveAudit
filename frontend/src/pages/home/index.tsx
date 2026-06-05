import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Tag } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { reportApi, downloadLogApi } from '@/api';
import type { ReportConfig } from '@/types';

const { Title, Text } = Typography;

/**
 * 首页 - 数据概览 + 快捷入口
 * 统计数据和最近访问均从后端/本地存储获取
 */
export default function HomePage() {
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [recentVisits, setRecentVisits] = useState<string[]>([]);
  const [stats, setStats] = useState({ todayCount: 0, monthCount: 0, totalDownloads: 0 });

  useEffect(() => {
    // 加载所有清单
    reportApi.list().then(setReports).catch(() => {});

    // 加载下载统计
    downloadLogApi.stats().then((data) => {
      setStats({
        todayCount: data.todayCount,
        monthCount: data.monthCount,
        totalDownloads: data.monthCount, // 用月下载量近似展示
      });
    }).catch(() => {});

    // 从 localStorage 读取最近访问记录
    try {
      const visits = JSON.parse(localStorage.getItem('recentVisits') || '[]') as string[];
      setRecentVisits(visits);
    } catch {
      setRecentVisits([]);
    }
  }, []);

  /** 将 reportCode 转换为 reportName */
  const getReportName = (code: string) => {
    const r = reports.find((r) => r.reportCode === code);
    return r ? r.reportName : code;
  };

  // 最近访问的清单名称
  const recentNames = recentVisits.map(getReportName).filter(Boolean);

  // 热门清单（按 sortOrder 排序取前5）
  const hotReports = [...reports]
    .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99))
    .slice(0, 5);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>数据概览</Title>

      {/* 统计卡片 - 使用真实数据 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="可访问清单数"
              value={reports.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="今日下载次数"
              value={stats.todayCount}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="本月下载次数"
              value={stats.monthCount}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={<><ClockCircleOutlined /> 最近访问</>}
            variant="borderless"
          >
            <List
              dataSource={recentNames}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无访问记录' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={<><FireOutlined style={{ color: '#ff4d4f' }} /> 热门清单</>}
            variant="borderless"
          >
            <List
              dataSource={hotReports}
              renderItem={(item, index) => (
                <List.Item>
                  <Tag color={index === 0 ? 'red' : index === 1 ? 'orange' : 'blue'}>
                    {index + 1}
                  </Tag>
                  <Text>{item.reportName}</Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无数据' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}