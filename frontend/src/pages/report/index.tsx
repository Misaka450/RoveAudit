import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Tag, Row, Col, Button, Space, Empty, Input, message } from 'antd';
import { TableOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { reportApi } from '@/api';
import type { ReportConfig } from '@/types';

const { Search } = Input;

/**
 * 清单中心 - 清单入口（点击卡片跳转到对应清单详情页）
 * 支持按分类筛选 + 关键词搜索 + 最近使用记录
 */
export default function ReportCenter() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    reportApi.categories().then(setCategories).catch((err) => console.error('加载分类失败:', err));
    reportApi.list().then(setReports).catch((err) => console.error('加载清单列表失败:', err));
  }, []);

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key === 'all' ? '' : key);
    reportApi.list(key === 'all' ? undefined : key).then(setReports).catch(() => {});
  };

  const filteredReports = keyword
    ? reports.filter((r) =>
        r.reportName.includes(keyword) || r.reportCode.includes(keyword)
      )
    : reports;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Tabs
            activeKey={activeCategory || 'all'}
            onChange={handleCategoryChange}
            items={[
              { key: 'all', label: '全部' },
              ...categories.map((cat) => ({ key: cat, label: cat })),
            ]}
            style={{ marginBottom: 0 }}
          />
          <Space>
            <Search
              placeholder="搜索清单名称/编码"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => window.location.href = '/system/reports'}>
              新增清单
            </Button>
          </Space>
        </div>
      </Card>

      {/* 快捷入口卡片 */}
      <Row gutter={[16, 16]}>
        {filteredReports.map((report) => (
          <Col xs={24} sm={12} lg={8} key={report.id}>
            <Card
              hoverable
              onClick={() => navigate(`/report-list/${report.reportCode}`)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Meta
                title={
                  <Space>
                    {report.reportName}
                    <Tag color={report.enableDownload ? 'green' : 'default'}>
                      {report.enableDownload ? '可下载' : '不可下载'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag>{report.category}</Tag>
                      {report.enableChart ? <Tag color="blue">支持图表</Tag> : null}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {report.description || '点击查看详情'}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {filteredReports.length === 0 && (
        <Empty description="暂无清单数据" style={{ marginTop: 60 }} />
      )}
    </div>
  );
}