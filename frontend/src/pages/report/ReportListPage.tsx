import { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, DatePicker, Tag, message, Tooltip, Select, Row, Col, Form,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, DownloadOutlined, FilterOutlined, EyeOutlined, TableOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { reportApi, dataQueryApi, downloadApi } from '@/api';
import type { ReportConfig, QueryParamConfig } from '@/types';

const { RangePicker } = DatePicker;

/**
 * 通用清单数据页 - 自动渲染查询条件 + 列筛选 + 下载 + 预览
 */
export default function ReportListPage() {
  const { reportCode } = useParams<{ reportCode: string }>();
  const [report, setReport] = useState<ReportConfig | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [columns, setColumns] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // 解析 query_params 自动生成查询条件
  const queryParamsConfig: QueryParamConfig[] = (() => {
    if (!report?.queryParams) return [];
    try { return JSON.parse(report.queryParams); } catch { return []; }
  })();

  // 加载清单配置
  useEffect(() => {
    if (!reportCode) return;
    const abortController = new AbortController();
    reportApi.list().then((list) => {
      const found = list.find((r) => r.reportCode === reportCode);
      setReport(found || null);
    }).catch(() => {});
    // 记录最近访问（localStorage 持久化）
    try {
      const visits = JSON.parse(localStorage.getItem('recentVisits') || '[]') as string[];
      const updated = [reportCode, ...visits.filter((v) => v !== reportCode)].slice(0, 10);
      localStorage.setItem('recentVisits', JSON.stringify(updated));
    } catch { /* */ }
    return () => abortController.abort();
  }, [reportCode]);

  // 从数据中提取列定义
  const buildColumns = useCallback((cols: string[], columnConfigs?: any[]) => {
    return cols.map((key) => {
      // 查找字段配置
      const config = columnConfigs?.find((c) => c.columnName === key);

      // 如果配置了不显示，跳过
      if (config && !config.visible) return null;

      const isFiltered = activeFilters[key] !== undefined && activeFilters[key] !== '';

      return {
        title: config?.columnLabel || key,
        dataIndex: key,
        key,
        width: config?.width || 150,
        align: config?.align || 'left',
        ellipsis: true,
        filterIcon: <FilterOutlined style={{ color: isFiltered ? '#1677ff' : undefined }} />,
        filterDropdown: ({ confirm }: { confirm: () => void }) => (
          <div style={{ padding: 8, width: 200 }}>
            <Input.Search
              placeholder={`搜索 ${config?.columnLabel || key}`}
              defaultValue={isFiltered ? activeFilters[key] : ''}
              onSearch={(val) => {
                const newFilters = { ...activeFilters };
                if (val) newFilters[key] = val;
                else delete newFilters[key];
                setActiveFilters(newFilters);
                setPage(1);
                confirm();
              }}
              allowClear
              size="small"
            />
            <div style={{ textAlign: 'right', marginTop: 4 }}>
              <Button size="small" onClick={() => {
                const newFilters = { ...activeFilters };
                delete newFilters[key];
                setActiveFilters(newFilters);
                setPage(1);
                confirm();
              }}>重置</Button>
            </div>
          </div>
        ),
        render: (val: any) => {
          if (val === null || val === undefined) return '-';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        },
      };
    }).filter(Boolean);
  }, [activeFilters]);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!reportCode) return;
    setLoading(true);
    try {
      const params: any = { page, pageSize: previewMode ? 5 : pageSize, filters: activeFilters };
      if (dateRange) {
        params.startDate = dateRange[0]!;
        params.endDate = dateRange[1]!;
      }
      // 解析自动生成的查询条件参数
      for (const qp of queryParamsConfig) {
        if (activeFilters[qp.key]) {
          params[qp.key] = activeFilters[qp.key];
        }
      }
      const result = await dataQueryApi.query(reportCode, params);
      setData(result.list);
      setTotal(previewMode ? Math.min(result.total, 5) : result.total);

      if (result.list.length > 0) {
        const cols = Object.keys(result.list[0]);
        const tableCols = buildColumns(cols);
        setColumns(tableCols);
      } else {
        setColumns([]);
      }
    } catch {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [reportCode, page, pageSize, activeFilters, dateRange, previewMode, queryParamsConfig, buildColumns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = (type: 'excel' | 'csv') => {
    if (!report || !reportCode) return;
    if (!report.enableDownload) { message.warning('该清单不允许下载'); return; }
    const extraParams: any = { ...activeFilters };
    if (dateRange) { extraParams.startDate = dateRange[0]!; extraParams.endDate = dateRange[1]!; }
    for (const qp of queryParamsConfig) {
      if (activeFilters[qp.key]) {
        extraParams[qp.key] = activeFilters[qp.key];
      }
    }
    downloadApi[type](reportCode, extraParams);
  };

  const activeFilterCount = Object.keys(activeFilters).length + (dateRange ? 1 : 0);

  // 渲染自动生成的查询条件表单
  const renderAutoFilters = () => {
    if (queryParamsConfig.length === 0) return null;

    return (
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Row gutter={[12, 12]}>
          {queryParamsConfig.map((param) => (
            <Col key={param.key}>
              <Space>
                <span style={{ fontSize: 13, color: '#666' }}>{param.label || param.key}：</span>
                {renderParamInput(param)}
              </Space>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderParamInput = (param: QueryParamConfig) => {
    const value = activeFilters[param.key];

    if (param.type === 'select' && param.options) {
      return (
        <Select
          placeholder={`选择${param.label}`}
          value={value || null}
          onChange={(val) => {
            const newFilters = { ...activeFilters };
            if (val) newFilters[param.key] = val;
            else delete newFilters[param.key];
            setActiveFilters(newFilters);
            setPage(1);
          }}
          options={param.options}
          allowClear
          style={{ width: 150 }}
          size="small"
        />
      );
    }

    if (param.type === 'month') {
      return (
        <Input
          placeholder="YYYY-MM"
          value={value || ''}
          onChange={(e) => {
            const newFilters = { ...activeFilters };
            if (e.target.value) newFilters[param.key] = e.target.value;
            else delete newFilters[param.key];
            setActiveFilters(newFilters);
            setPage(1);
          }}
          style={{ width: 130 }}
          size="small"
        />
      );
    }

    if (param.type === 'date' || param.type === 'dateRange') {
      return null; // 使用外部的日期范围选择器
    }

    // 默认 text
    return (
      <Input
        placeholder={`输入${param.label}`}
        value={value || ''}
        onChange={(e) => {
          const newFilters = { ...activeFilters };
          if (e.target.value) newFilters[param.key] = e.target.value;
          else delete newFilters[param.key];
          setActiveFilters(newFilters);
          setPage(1);
        }}
        style={{ width: 150 }}
        size="small"
      />
    );
  };

  return (
    <div>
      {/* 自动生成的查询条件 */}
      {renderAutoFilters()}

      <Card
        title={
          <Space>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{report?.reportName || '数据清单'}</span>
            {report?.category && <Tag color="blue">{report.category}</Tag>}
            {report?.enableDownload ? <Tag color="green">可下载</Tag> : <Tag>不可下载</Tag>}
            {activeFilterCount > 0 && <Tag color="orange">筛选中 ({activeFilterCount})</Tag>}
            {previewMode && <Tag color="purple">预览模式（前5条）</Tag>}
          </Space>
        }
        extra={
          <Space wrap>
            <RangePicker
              size="small"
              onChange={(dates, dateStrings) => {
                if (dates) setDateRange([dateStrings[0], dateStrings[1]]);
                else setDateRange(null);
                setPage(1);
              }}
            />
            <Tooltip title={previewMode ? '切换为完整列表模式' : '切换为预览模式（仅前5条）'}>
              <Button
                icon={previewMode ? <TableOutlined /> : <EyeOutlined />}
                onClick={() => setPreviewMode(!previewMode)}
                type={previewMode ? 'primary' : 'default'}
              >
                {previewMode ? '完整列表' : '预览'}
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={() => { setActiveFilters({}); setDateRange(null); setPage(1); }}>
              重置筛选
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload('excel')} disabled={!report?.enableDownload}>Excel</Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload('csv')} disabled={!report?.enableDownload}>CSV</Button>
          </Space>
        }
      >
        {report?.description && (
          <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>{report.description}</div>
        )}
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(_, index) => String(index)}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={previewMode ? false : {
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
        {previewMode && total > 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => setPreviewMode(false)}>
              查看全部 {total} 条数据
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}