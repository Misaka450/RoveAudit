import { useEffect, useState, useCallback } from 'react';
import {
  Tabs, Card, Table, Button, Space, Input, DatePicker,
  Tag, message, Modal, Tooltip, Row, Col,
} from 'antd';
import {
  DownloadOutlined, EyeOutlined, StarOutlined,
  SearchOutlined, ReloadOutlined, ExportOutlined,
} from '@ant-design/icons';
import { reportApi, dataQueryApi, downloadApi } from '@/api';
import type { ReportConfig } from '@/types';

const { RangePicker } = DatePicker;

/**
 * 清单中心 - 数据清单展示与查询
 */
export default function ReportCenter() {
  const [categories, setCategories] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);

  // 加载分类和清单列表
  useEffect(() => {
    loadCategories();
    loadReports();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await reportApi.categories();
      setCategories(data);
    } catch { /* 忽略错误 */ }
  };

  const loadReports = async (category?: string) => {
    try {
      const data = await reportApi.list(category);
      setReports(data);
    } catch { /* 忽略错误 */ }
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    loadReports(key === 'all' ? undefined : key);
    setSelectedReport(null);
  };

  return (
    <div>
      {/* 清单分类标签页 */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeCategory || 'all'}
          onChange={handleCategoryChange}
          items={[
            { key: 'all', label: '全部' },
            ...categories.map((cat) => ({ key: cat, label: cat })),
          ]}
        />
      </Card>

      {/* 清单列表 */}
      <Row gutter={[16, 16]}>
        {reports.map((report) => (
          <Col xs={24} sm={12} lg={8} key={report.id}>
            <Card
              hoverable
              onClick={() => setSelectedReport(report)}
              style={{
                borderColor: selectedReport?.id === report.id ? '#1677ff' : undefined,
              }}
              actions={[
                <Tooltip title="查看数据">
                  <EyeOutlined key="view" onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }} />
                </Tooltip>,
                <Tooltip title="下载">
                  <DownloadOutlined key="download" onClick={(e) => {
                    e.stopPropagation();
                    if (report.enableDownload) {
                      downloadApi.excel(report.reportCode);
                    } else {
                      message.warning('该清单不允许下载');
                    }
                  }} />
                </Tooltip>,
                <Tooltip title="收藏">
                  <StarOutlined key="star" onClick={(e) => { e.stopPropagation(); message.success('已收藏'); }} />
                </Tooltip>,
              ]}
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
                      更新时间：{report.updateTime}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 数据查看弹窗 */}
      <ReportDataModal
        report={selectedReport}
        visible={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

/**
 * 数据查看弹窗 - 展示清单的具体数据
 */
function ReportDataModal({
  report,
  visible,
  onClose,
}: {
  report: ReportConfig | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [columns, setColumns] = useState<any[]>([]);
  const [params, setParams] = useState<Record<string, any>>({});

  const loadData = useCallback(async () => {
    if (!report) return;
    setLoading(true);
    try {
      const result = await dataQueryApi.query(report.reportCode, {
        ...params,
        page,
        pageSize,
      });
      setData(result.list);
      setTotal(result.total);

      // 动态生成表格列
      if (result.list.length > 0) {
        const cols = Object.keys(result.list[0]).map((key) => ({
          title: key,
          dataIndex: key,
          key,
          width: 150,
          ellipsis: true,
        }));
        setColumns(cols);
      }
    } catch {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [report, page, pageSize, params]);

  useEffect(() => {
    if (visible && report) {
      loadData();
    }
  }, [visible, report, loadData]);

  const handleDownload = (type: 'excel' | 'csv') => {
    if (!report) return;
    if (type === 'excel') {
      downloadApi.excel(report.reportCode, params);
    } else {
      downloadApi.csv(report.reportCode, params);
    }
  };

  return (
    <Modal
      title={report?.reportName}
      open={visible}
      onCancel={onClose}
      width="90%"
      footer={null}
      destroyOnClose
    >
      {/* 查询条件区域 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="关键字搜索"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 200 }}
          onPressEnter={(e) => {
            setParams({ ...params, keyword: (e.target as any).value });
            setPage(1);
          }}
        />
        <RangePicker
          onChange={(_, dateStrings) => {
            setParams({ ...params, startDate: dateStrings[0], endDate: dateStrings[1] });
            setPage(1);
          }}
        />
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        <Button
          icon={<ExportOutlined />}
          onClick={() => handleDownload('excel')}
          disabled={!report?.enableDownload}
        >
          Excel
        </Button>
        <Button
          icon={<ExportOutlined />}
          onClick={() => handleDownload('csv')}
          disabled={!report?.enableDownload}
        >
          CSV
        </Button>
      </Space>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(_, index) => String(index)}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </Modal>
  );
}