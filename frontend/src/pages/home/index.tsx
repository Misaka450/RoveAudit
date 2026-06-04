import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Tag } from 'antd';
import {
  FileTextOutlined,
  SyncOutlined,
  DownloadOutlined,
  TeamOutlined,
  StarOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 首页 - 数据概览 + 快捷入口
 */
export default function HomePage() {
  const [stats, setStats] = useState({
    reportCount: 0,
    todayUpdate: 0,
    monthDownload: 0,
    onlineUsers: 0,
    recentVisits: [] as string[],
    favorites: [] as string[],
    hotReports: [] as string[],
  });

  useEffect(() => {
    // 模拟加载首页数据（实际项目中需要调用后端接口）
    setStats({
      reportCount: 6,
      todayUpdate: 3,
      monthDownload: 128,
      onlineUsers: 12,
      recentVisits: ['用户发展清单', '收入分析清单', '稽核清单'],
      favorites: ['用户发展清单', '流量统计清单'],
      hotReports: ['用户发展清单', '收入分析清单', '稽核清单', '流量统计清单'],
    });
  }, []);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>数据概览</Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="可访问清单数"
              value={stats.reportCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日更新清单"
              value={stats.todayUpdate}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月下载次数"
              value={stats.monthDownload}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="在线用户数"
              value={stats.onlineUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card
            title={<><ClockCircleOutlined /> 最近访问</>}
            variant="borderless"
          >
            <List
              dataSource={stats.recentVisits}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无访问记录' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={<><StarOutlined /> 收藏清单</>}
            variant="borderless"
          >
            <List
              dataSource={stats.favorites}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无收藏' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={<><FireOutlined style={{ color: '#ff4d4f' }} /> 热门清单</>}
            variant="borderless"
          >
            <List
              dataSource={stats.hotReports}
              renderItem={(item, index) => (
                <List.Item>
                  <Tag color={index === 0 ? 'red' : index === 1 ? 'orange' : 'blue'}>
                    {index + 1}
                  </Tag>
                  <Text>{item}</Text>
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