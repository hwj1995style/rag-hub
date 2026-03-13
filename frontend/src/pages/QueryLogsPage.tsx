import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Form, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listQueryLogs } from '../services/api/qa';
import type { QueryLogListItem } from '../types/api';
import { formatDateTime } from '../utils/format';

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildSearchParams(next: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }
    params.set(key, String(value));
  });
  return params;
}

export function QueryLogsPage() {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();

  const sessionId = searchParams.get('sessionId') ?? undefined;
  const queryText = searchParams.get('queryText') ?? undefined;
  const pageNo = toPositiveInt(searchParams.get('pageNo'), 1);
  const pageSize = toPositiveInt(searchParams.get('pageSize'), 20);

  useEffect(() => {
    form.setFieldsValue({
      sessionId: sessionId ?? '',
      queryText: queryText ?? '',
    });
  }, [form, queryText, sessionId]);

  const query = useQuery({
    queryKey: ['queryLogs', sessionId, queryText, pageNo, pageSize],
    queryFn: () => listQueryLogs({ sessionId, queryText, pageNo, pageSize }),
  });

  const columns: ColumnsType<QueryLogListItem> = [
    {
      title: 'Log ID',
      dataIndex: 'log_id',
      key: 'log_id',
      render: (value: string) => <Link to={`/query-logs/${value}`}>{value}</Link>,
    },
    {
      title: 'Session ID',
      dataIndex: 'session_id',
      key: 'session_id',
      render: (value: string) => value || '-',
    },
    {
      title: 'Question',
      dataIndex: 'query_text',
      key: 'query_text',
      render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value || '-'}</Typography.Text>,
    },
    {
      title: 'Latency',
      dataIndex: 'latency_ms',
      key: 'latency_ms',
      render: (value: number) => (value ? `${value} ms` : '-'),
    },
    {
      title: 'Retrieved',
      dataIndex: 'retrieved_chunk_count',
      key: 'retrieved_chunk_count',
      render: (value: number) => <Tag>{value}</Tag>,
    },
    {
      title: 'Citations',
      dataIndex: 'citation_count',
      key: 'citation_count',
      render: (value: number) => <Tag color={value > 0 ? 'blue' : 'default'}>{value}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDateTime(value),
    },
  ];

  const handleApply = (values: { sessionId?: string; queryText?: string }) => {
    setSearchParams(
      buildSearchParams({
        sessionId: values.sessionId?.trim(),
        queryText: values.queryText?.trim(),
        pageNo: 1,
        pageSize,
      }),
    );
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams(buildSearchParams({ pageNo: 1, pageSize }));
  };

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setSearchParams(
      buildSearchParams({
        sessionId,
        queryText,
        pageNo: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? pageSize,
      }),
    );
  };

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              Query Logs
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Browse saved QA traces by session and question text before drilling into a single log detail record.
            </Typography.Paragraph>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Refresh
          </Button>
        </Space>
      </Card>

      <Card className="page-card" title="Filters">
        <Form form={form} layout="inline" initialValues={{ sessionId: '', queryText: '' }} onFinish={handleApply}>
          <Form.Item name="sessionId" label="Session ID">
            <Input allowClear style={{ width: 260 }} placeholder="frontend-session-001" />
          </Form.Item>
          <Form.Item name="queryText" label="Question contains">
            <Input allowClear style={{ width: 320 }} placeholder="business license" />
          </Form.Item>
          <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
            Apply
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </Form>
      </Card>

      <Card className="page-card" title="Saved traces">
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message="Failed to load query logs"
            description={query.error instanceof Error ? query.error.message : 'Request failed'}
          />
        )}
        <Table<QueryLogListItem>
          rowKey="log_id"
          dataSource={query.data?.items ?? []}
          loading={query.isLoading}
          columns={columns}
          locale={{ emptyText: <Empty description="No query logs match the current filters." /> }}
          pagination={{
            current: query.data?.pageNo ?? pageNo,
            pageSize: query.data?.pageSize ?? pageSize,
            total: query.data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} query logs`,
          }}
          onChange={handlePaginationChange}
        />
      </Card>
    </div>
  );
}
