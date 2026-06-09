import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Card, Table, Button, Space, Input, DatePicker, Tag, message, Tooltip, Select, Row, Col, Form, Grid, Typography, Badge, Segmented,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, DownloadOutlined, FilterOutlined, EyeOutlined, TableOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { reportApi, dataQueryApi, downloadApi } from '@/api';
import type { ReportConfig, QueryParamConfig } from '@/types';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { useBreakpoint } = Grid;

/** 移动端行卡片渲染（替代传统表格行） */
const MobileDataCard = ({ record, columns }: { record: any; columns: any[] }) => (
  <Card
    size="small"
    style={{ marginBottom: 8 }}
    styles={{ body: { padding: '10px 12px' } }}
  >
    {columns.map((col) => {
      // 跳过太长的列（如原始 JSON）
      const val = record[col.dataIndex];
      if (val === null || val === undefined) return null;
      const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (strVal === '-' || strVal === '') return null;
      return (
        <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f5f5f5' }}>
          <span style={{ color: '#888', fontSize: 12, flexShrink: 0, marginRight: 8, maxWidth: '40%' }}>
            {col.title}
          </span>
          <span style={{ fontSize: 13, textAlign: 'right', wordBreak: 'break-all', color: '#333' }}>
            {col.render ? col.render(val, record, 0) : strVal}
          </span>
        </div>
      );
    })}
  </Card>
);

/**
 * 通用清单数据页 - 自动渲染查询条件 + 列筛选 + 下载 + 预览
 * 移动端：表格改为卡片列表，筛选条件垂直堆叠
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
  const [mobileView, setMobileView] = useState<'card' | 'table'>('card');

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // 解析 query_params 自动生成查询条件（useMemo 稳定引用，避免死循环）
  const queryParamsConfig: QueryParamConfig[] = useMemo(() => {
    if (!report?.queryParams) return [];
    try { return JSON.parse(report.queryParams); } catch { return []; }
  }, [report?.queryParams]);

  // 用 ref 存储最新值，避免 loadData 依赖频繁变化的状态
  const activeFiltersRef = useRef(activeFilters);
  activeFiltersRef.current = activeFilters;
  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;
  const queryParamsRef = useRef(queryParamsConfig);
  queryParamsRef.current = queryParamsConfig;

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

  // 从数据中提取列定义（不依赖 activeFilters，避免死循环）
  const buildColumns = useCallback((cols: string[], columnConfigs?: any[]) => {
    return cols.map((key) => {
      const config = columnConfigs?.find((c) => c.columnName === key);
      if (config && !config.visible) return null;
      return {
        title: config?.columnLabel || key,
        dataIndex: key,
        key,
        width: config?.width || 150,
        align: config?.align || 'left',
        ellipsis: true,
        filterDropdown: ({ confirm }: { confirm: () => void }) => (
          <div style={{ padding: 8, width: 200 }}>
            <Input.Search
              placeholder={`搜索 ${config?.columnLabel || key}`}
              defaultValue={activeFiltersRef.current[key] || ''}
              onSearch={(val) => {
                const newFilters = { ...activeFiltersRef.current };
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
                const newFilters = { ...activeFiltersRef.current };
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
  }, []);

  // 加载数据（通过 ref 读取频繁变化的值，避免依赖项不稳定导致死循环）
  const loadData = useCallback(async () => {
    if (!reportCode) return;
    setLoading(true);
    try {
      const filters = activeFiltersRef.current;
      const dr = dateRangeRef.current;
      const qpc = queryParamsRef.current;
      const params: any = { page, pageSize: previewMode ? 5 : pageSize, filters };
      if (dr) {
        params.startDate = dr[0]!;
        params.endDate = dr[1]!;
      }
      for (const qp of qpc) {
        if (filters[qp.key]) {
          params[qp.key] = filters[qp.key];
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
      // 静默失败，不弹提示避免死循环刷屏
    } finally {
      setLoading(false);
    }
  }, [reportCode, page, pageSize, previewMode, buildColumns]);

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
        <Row gutter={isMobile ? [8, 8] : [12, 12]}>
          {queryParamsConfig.map((param) => (
            <Col key={param.key} xs={24} sm={isMobile ? 24 : undefined}>
              <Space direction={isMobile ? 'horizontal' : 'horizontal'} style={{ width: '100%' }}>
                <span style={{ fontSize: 13, color: '#666', flexShrink: 0, minWidth: isMobile ? 60 : 'auto' }}>
                  {param.label || param.key}：
                </span>
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
          style={{ width: isMobile ? '100%' : 150, minWidth: isMobile ? '100%' : undefined }}
          size="small"
          popupMatchSelectWidth={!isMobile}
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
          style={{ width: isMobile ? '100%' : 130, minWidth: isMobile ? '100%' : undefined }}
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
        style={{ width: isMobile ? '100%' : 150, minWidth: isMobile ? '100%' : undefined }}
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
          <Space wrap size={isMobile ? 'small' : 'middle'}>
            <span style={{ fontSize: isMobile ? 15 : 18, fontWeight: 600 }}>{report?.reportName || '数据清单'}</span>
            {report?.category && <Tag color="blue">{report.category}</Tag>}
            {report?.enableDownload ? <Tag color="green">可下载</Tag> : <Tag>不可下载</Tag>}
            {activeFilterCount > 0 && <Tag color="orange">筛选中 ({activeFilterCount})</Tag>}
            {previewMode && <Tag color="purple">预览模式（前5条）</Tag>}
          </Space>
        }
        extra={
          <Space wrap size={isMobile ? 'small' : 'middle'}>
            {/* 移动端：视图切换 */}
            {isMobile && data.length > 0 && (
              <Segmented
                size="small"
                value={mobileView}
                onChange={(v) => setMobileView(v as 'card' | 'table')}
                options={[
                  { label: '卡片', value: 'card' },
                  { label: '表格', value: 'table' },
                ]}
              />
            )}
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
                size="small"
              >
                {!isMobile && (previewMode ? '完整列表' : '预览')}
              </Button>
            </Tooltip>
            <Button icon={<ReloadOutlined />} onClick={() => { setActiveFilters({}); setDateRange(null); setPage(1); }} size="small">
              {!isMobile && '重置'}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload('excel')} disabled={!report?.enableDownload} size="small">
              {isMobile ? 'XLS' : 'Excel'}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload('csv')} disabled={!report?.enableDownload} size="small">
              {isMobile ? 'CSV' : 'CSV'}
            </Button>
          </Space>
        }
        styles={{ header: { padding: isMobile ? '8px 12px' : undefined } }}
      >
        {report?.description && (
          <div style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>{report.description}</div>
        )}

        {/* 移动端卡片视图 / 桌面端表格视图 */}
        {isMobile && mobileView === 'card' ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">加载中...</Text></div>
            ) : data.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">暂无数据</Text></div>
            ) : (
              <>
                {data.map((record, index) => (
                  <MobileDataCard key={index} record={record} columns={columns} />
                ))}
                {!previewMode && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      上一页
                    </Button>
                    <span style={{ lineHeight: '32px', fontSize: 13 }}>
                      第 {page} 页 · 共 {total} 条
                    </span>
                    <Button
                      size="small"
                      disabled={page * pageSize >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey={(_, index) => String(index)}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={previewMode ? false : {
              current: page, pageSize, total,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              size: isMobile ? 'small' : 'default',
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
            size={isMobile ? 'small' : 'middle'}
          />
        )}

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
