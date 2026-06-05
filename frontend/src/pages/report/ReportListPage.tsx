import { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, DatePicker, Tag, message, Tooltip,
  Select, Dropdown,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, ExportOutlined, DownloadOutlined, FilterOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { reportApi, dataQueryApi, downloadApi } from '@/api';
import type { ReportConfig } from '@/types';

const { RangePicker } = DatePicker;

/**
 * 列筛选配置
 */
interface ColumnFilter {
  key: string;
  type: 'text' | 'select' | 'date';
  label: string;
  options?: { value: string; label: string }[]; // select 类型用
}

/**
 * 通用清单数据页 - 每列可筛选
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
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 加载清单配置
  useEffect(() => {
    if (!reportCode) return;
    reportApi.list().then((list) => {
      const found = list.find((r) => r.reportCode === reportCode);
      setReport(found || null);
    }).catch(() => {});
  }, [reportCode]);

  // 从数据中提取列筛选配置（枚举列 → select，其他 → text）
  const buildColumnFilters = useCallback((cols: string[], sampleData: any[]): ColumnFilter[] => {
    if (!sampleData.length) return [];
    return cols.map((key) => {
      // 日期列
      if (key.includes('_date') || key.includes('date')) {
        return { key, type: 'date' as const, label: key };
      }
      // 枚举列：唯一值少于 10 个的用 select
      const uniqueValues = [...new Set(sampleData.map((row) => row[key]))].filter((v) => v != null);
      if (uniqueValues.length > 0 && uniqueValues.length <= 10) {
        return {
          key,
          type: 'select' as const,
          label: key,
          options: uniqueValues.map((v) => ({ value: String(v), label: String(v) })),
        };
      }
      // 默认文本搜索
      return { key, type: 'text' as const, label: key };
    });
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!reportCode) return;
    setLoading(true);
    try {
      const params: any = { page, pageSize, filters: activeFilters };
      if (dateRange) {
        params.startDate = dateRange[0]!;
        params.endDate = dateRange[1]!;
      }
      const result = await dataQueryApi.query(reportCode, params);
      setData(result.list);
      setTotal(result.total);

      if (result.list.length > 0) {
        const cols = Object.keys(result.list[0]);
        const tableCols = cols.map((key) => ({
          title: key,
          dataIndex: key,
          key,
          width: 150,
          ellipsis: true,
          filterIcon: <FilterOutlined />,
          filterDropdown: ({ confirm }: { confirm: () => void }) => (
            <ColumnFilterDropdown
              column={key}
              type={columnFilters.find((f) => f.key === key)?.type || 'text'}
              options={columnFilters.find((f) => f.key === key)?.options}
              value={activeFilters[key]}
              onApply={(val: any) => {
                const newFilters = { ...activeFilters };
                if (val === '' || val === null || val === undefined) {
                  delete newFilters[key];
                } else {
                  newFilters[key] = val;
                }
                setActiveFilters(newFilters);
                setPage(1);
                confirm();
              }}
              onClear={() => {
                const newFilters = { ...activeFilters };
                delete newFilters[key];
                setActiveFilters(newFilters);
                setPage(1);
                confirm();
              }}
            />
          ),
          render: (val: any) => {
            if (val === null || val === undefined) return '-';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
          },
        }));
        setColumns(tableCols);

        // 构建筛选配置（仅首次）
        if (columnFilters.length === 0) {
          setColumnFilters(buildColumnFilters(cols, result.list));
        }
      } else {
        setColumns([]);
      }
    } catch {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [reportCode, page, pageSize, activeFilters, dateRange, columnFilters, buildColumnFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = (type: 'excel' | 'csv') => {
    if (!report) return;
    if (!report.enableDownload) { message.warning('该清单不允许下载'); return; }
    const extraParams: any = { ...activeFilters };
    if (dateRange) { extraParams.startDate = dateRange[0]; extraParams.endDate = dateRange[1]; }
    if (type === 'excel') downloadApi.excel(reportCode, extraParams);
    else downloadApi.csv(reportCode, extraParams);
  };

  const activeFilterCount = Object.keys(activeFilters).length + (dateRange ? 1 : 0);

  return (
    <Card
      title={
        <Space>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{report?.reportName || '数据清单'}</span>
          {report?.category && <Tag color="blue">{report.category}</Tag>}
          {report?.enableDownload ? <Tag color="green">可下载</Tag> : <Tag>不可下载</Tag>}
          {activeFilterCount > 0 && <Tag color="orange">筛选中 ({activeFilterCount})</Tag>}
        </Space>
      }
      extra={
        <Space wrap>
          <RangePicker
            onChange={(dates, dateStrings) => {
              if (dates) setDateRange([dateStrings[0], dateStrings[1]]);
              else setDateRange(null);
              setPage(1);
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => { setActiveFilters({}); setDateRange(null); setPage(1); }}>
            重置筛选
          </Button>
          <Tooltip title="下载 Excel">
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload('excel')} disabled={!report?.enableDownload}>Excel</Button>
          </Tooltip>
          <Tooltip title="下载 CSV">
            <Button icon={<ExportOutlined />} onClick={() => handleDownload('csv')} disabled={!report?.enableDownload}>CSV</Button>
          </Tooltip>
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
        pagination={{
          current: page, pageSize, total,
          showSizeChanger: true, showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </Card>
  );
}

// ==================== 列筛选下拉组件 ====================
function ColumnFilterDropdown({
  column,
  type,
  options,
  value,
  onApply,
  onClear,
}: {
  column: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  value: any;
  onApply: (val: any) => void;
  onClear: () => void;
}) {
  if (type === 'select' && options) {
    return (
      <div style={{ padding: 8, minWidth: 160 }}>
        <Select
          placeholder={`选择 ${column}`}
          value={value || null}
          onChange={(val) => onApply(val)}
          options={options}
          allowClear
          style={{ width: '100%', marginBottom: 8 }}
          size="small"
        />
        <div style={{ textAlign: 'right' }}>
          <Button size="small" onClick={onClear}>重置</Button>
        </div>
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div style={{ padding: 8, width: 240 }}>
        <RangePicker
          size="small"
          onChange={(_, dateStrings) => {
            if (dateStrings[0] && dateStrings[1]) {
              onApply(`${dateStrings[0]}~${dateStrings[1]}`);
            } else {
              onClear();
            }
          }}
          style={{ marginBottom: 8 }}
        />
        <div style={{ textAlign: 'right' }}>
          <Button size="small" onClick={onClear}>重置</Button>
        </div>
      </div>
    );
  }

  // text
  return (
    <div style={{ padding: 8, width: 200 }}>
      <Input.Search
        placeholder={`搜索 ${column}`}
        defaultValue={value || ''}
        onSearch={(val) => onApply(val)}
        allowClear
        size="small"
        style={{ marginBottom: 8 }}
      />
      <div style={{ textAlign: 'right' }}>
        <Button size="small" onClick={onClear}>重置</Button>
      </div>
    </div>
  );
}
