import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Form, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
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
  const { t } = useI18n();
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
      title: t('queryLog.logId'),
      dataIndex: 'log_id',
      key: 'log_id',
      render: (value: string) => <Link to={`/query-logs/${value}`}>{value}</Link>,
    },
    {
      title: t('common.sessionId'),
      dataIndex: 'session_id',
      key: 'session_id',
      render: (value: string) => value || '-',
    },
    {
      title: t('common.question'),
      dataIndex: 'query_text',
      key: 'query_text',
      render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value || '-'}</Typography.Text>,
    },
    {
      title: t('common.latency'),
      dataIndex: 'latency_ms',
      key: 'latency_ms',
      render: (value: number) => (value ? `${value} ms` : '-'),
    },
    {
      title: t('common.retrieved'),
      dataIndex: 'retrieved_chunk_count',
      key: 'retrieved_chunk_count',
      render: (value: number) => <Tag>{value}</Tag>,
    },
    {
      title: t('common.citations'),
      dataIndex: 'citation_count',
      key: 'citation_count',
      render: (value: number) => <Tag color={value > 0 ? 'blue' : 'default'}>{value}</Tag>,
    },
    {
      title: t('common.createdAt'),
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
              {t('queryLogs.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('queryLogs.subtitle')}
            </Typography.Paragraph>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            {t('common.refresh')}
          </Button>
        </Space>
      </Card>

      <Card className="page-card" title={t('queryLogs.filters')}>
        <Form form={form} layout="inline" initialValues={{ sessionId: '', queryText: '' }} onFinish={handleApply}>
          <Form.Item name="sessionId" label={t('common.sessionId')}>
            <Input allowClear style={{ width: 260 }} placeholder="frontend-session-001" />
          </Form.Item>
          <Form.Item name="queryText" label={t('queryLogs.questionContains')}>
            <Input allowClear style={{ width: 320 }} placeholder={t('queryLogs.questionPlaceholder')} />
          </Form.Item>
          <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
            {t('common.apply')}
          </Button>
          <Button onClick={handleReset}>{t('common.reset')}</Button>
        </Form>
      </Card>

      <Card className="page-card" title={t('queryLogs.savedTraces')}>
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={t('queryLogs.loadFailed')}
            description={query.error instanceof Error ? query.error.message : t('common.loadingFailed')}
          />
        )}
        <Table<QueryLogListItem>
          rowKey="log_id"
          dataSource={query.data?.items ?? []}
          loading={query.isLoading}
          columns={columns}
          locale={{ emptyText: <Empty description={t('queryLogs.empty')} /> }}
          pagination={{
            current: query.data?.pageNo ?? pageNo,
            pageSize: query.data?.pageSize ?? pageSize,
            total: query.data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => t('queryLogs.totalCount', { value: total }),
          }}
          onChange={handlePaginationChange}
        />
      </Card>
    </div>
  );
}
