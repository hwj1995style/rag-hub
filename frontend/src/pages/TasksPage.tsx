import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { listTasks } from '../services/api/tasks';
import type { TaskResponse } from '../types/api';
import { formatDateTime } from '../utils/format';

const ACTIVE_TASK_STATUSES = new Set(['pending', 'running', 'processing']);

function getTaskStatusColor(status?: string): string {
  switch (status) {
    case 'success':
      return 'green';
    case 'running':
    case 'processing':
      return 'blue';
    case 'pending':
      return 'gold';
    case 'failed':
      return 'red';
    default:
      return 'default';
  }
}

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildSearchParams(next: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === false) {
      return;
    }
    params.set(key, String(value));
  });
  return params;
}

export function TasksPage() {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') ?? undefined;
  const taskType = searchParams.get('taskType') ?? undefined;
  const documentId = searchParams.get('documentId') ?? undefined;
  const sourceKeyword = searchParams.get('sourceKeyword') ?? undefined;
  const pageNo = toPositiveInt(searchParams.get('pageNo'), 1);
  const pageSize = toPositiveInt(searchParams.get('pageSize'), 20);
  const autoRefresh = searchParams.get('autoRefresh') === 'true';

  useEffect(() => {
    form.setFieldsValue({
      status,
      taskType,
      documentId: documentId ?? '',
      sourceKeyword: sourceKeyword ?? '',
      autoRefresh,
    });
  }, [autoRefresh, documentId, form, sourceKeyword, status, taskType]);

  const query = useQuery({
    queryKey: ['tasks', status, taskType, documentId, sourceKeyword, pageNo, pageSize],
    queryFn: () => listTasks({ status, taskType, documentId, sourceKeyword, pageNo, pageSize }),
    refetchInterval: autoRefresh ? 10_000 : false,
  });

  const items = query.data?.items ?? [];
  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (ACTIVE_TASK_STATUSES.has(item.status)) {
          acc.active += 1;
        }
        if (item.status === 'success') {
          acc.success += 1;
        }
        if (item.status === 'failed') {
          acc.failed += 1;
        }
        return acc;
      },
      { total: 0, active: 0, success: 0, failed: 0 },
    );
  }, [items]);

  const columns: ColumnsType<TaskResponse> = [
    {
      title: t('taskDetail.taskId'),
      dataIndex: 'taskId',
      key: 'taskId',
      render: (value: string) => <Link to={`/tasks/${value}`}>{value}</Link>,
    },
    {
      title: t('common.type'),
      dataIndex: 'taskType',
      key: 'taskType',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={getTaskStatusColor(value)}>{value}</Tag>,
    },
    {
      title: t('common.step'),
      dataIndex: 'step',
      key: 'step',
      render: (value: string) => value || '-',
    },
    {
      title: t('common.document'),
      dataIndex: 'documentId',
      key: 'documentId',
      render: (value: string) => (value ? <Link to={`/documents/${value}`}>{value}</Link> : '-'),
    },
    {
      title: t('common.updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: t('common.sourceUri'),
      dataIndex: 'sourceUri',
      key: 'sourceUri',
      render: (value: string) => (
        <Typography.Text ellipsis={{ tooltip: value || '-' }} style={{ maxWidth: 240 }}>
          {value || '-'}
        </Typography.Text>
      ),
    },
    {
      title: t('common.error'),
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (value: string | null) => (
        <Typography.Text ellipsis={{ tooltip: value || '-' }} type={value ? 'danger' : undefined} style={{ maxWidth: 220 }}>
          {value || '-'}
        </Typography.Text>
      ),
    },
  ];

  const updateFilters = (next: Record<string, string | number | boolean | undefined>) => {
    setSearchParams(
      buildSearchParams({
        status,
        taskType,
        documentId,
        sourceKeyword,
        pageNo: 1,
        pageSize,
        autoRefresh,
        ...next,
      }),
    );
  };

  const handleApply = (values: { status?: string; taskType?: string; documentId?: string; sourceKeyword?: string; autoRefresh?: boolean }) => {
    updateFilters({
      status: values.status,
      taskType: values.taskType,
      documentId: values.documentId?.trim(),
      sourceKeyword: values.sourceKeyword?.trim(),
      autoRefresh: values.autoRefresh,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setSearchParams(buildSearchParams({ pageNo: 1, pageSize }));
  };

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setSearchParams(
      buildSearchParams({
        status,
        taskType,
        documentId,
        sourceKeyword,
        autoRefresh,
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
              {t('tasks.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('tasks.subtitle')}
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Typography.Text type="secondary">{t('common.autoRefresh')}</Typography.Text>
            <Switch
              checked={autoRefresh}
              onChange={(checked) => {
                form.setFieldValue('autoRefresh', checked);
                updateFilters({ autoRefresh: checked, pageNo, pageSize });
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              {t('common.refresh')}
            </Button>
          </Space>
        </Space>
      </Card>

      {autoRefresh && (
        <Alert
          type="info"
          showIcon
          message={t('tasks.autoRefreshEnabled')}
          description={t('tasks.autoRefreshDescription')}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title={t('tasks.visibleTasks')} value={summary.total} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title={t('common.active')} value={summary.active} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title={t('tasks.succeeded')} value={summary.success} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title={t('tasks.failed')} value={summary.failed} /></Card>
        </Col>
      </Row>

      <Card className="page-card" title={t('tasks.quickViews')}>
        <Space wrap>
          <Button onClick={() => updateFilters({ status: undefined, taskType: undefined, documentId: undefined })}>{t('tasks.allTasks')}</Button>
          <Button onClick={() => updateFilters({ status: 'failed' })}>{t('tasks.failedTasks')}</Button>
          <Button onClick={() => updateFilters({ status: 'running' })}>{t('tasks.runningTasks')}</Button>
          <Button onClick={() => updateFilters({ taskType: 'batch_import' })}>{t('tasks.batchImports')}</Button>
          <Button onClick={() => updateFilters({ taskType: 'reparse' })}>{t('tasks.reparseTasks')}</Button>
          {documentId && <Button onClick={() => updateFilters({ documentId })}>{t('tasks.currentDocumentTasks')}</Button>}
        </Space>
      </Card>

      <Card className="page-card" title={t('tasks.filters')}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ status: undefined, taskType: undefined, documentId: '', sourceKeyword: '', autoRefresh }}
          onFinish={handleApply}
        >
          <Form.Item name="status" label={t('common.status')}>
            <Select
              allowClear
              style={{ width: 160 }}
              options={[
                { label: t('tasks.statusPending'), value: 'pending' },
                { label: t('tasks.statusRunning'), value: 'running' },
                { label: t('tasks.statusSuccess'), value: 'success' },
                { label: t('tasks.statusFailed'), value: 'failed' },
              ]}
            />
          </Form.Item>
          <Form.Item name="taskType" label={t('tasks.taskType')}>
            <Select
              allowClear
              style={{ width: 180 }}
              options={[
                { label: t('tasks.typeIngest'), value: 'ingest' },
                { label: t('tasks.typeReparse'), value: 'reparse' },
                { label: t('tasks.typeBatchImport'), value: 'batch_import' },
              ]}
            />
          </Form.Item>
          <Form.Item name="documentId" label={t('tasks.documentId')}>
            <Input allowClear style={{ width: 320 }} placeholder={t('tasks.documentPlaceholder')} />
          </Form.Item>
          <Form.Item name="sourceKeyword" label={t('tasks.sourceKeyword')}>
            <Input allowClear style={{ width: 320 }} placeholder={t('tasks.sourcePlaceholder')} />
          </Form.Item>
          <Form.Item name="autoRefresh" label={t('common.autoRefresh')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
            {t('common.apply')}
          </Button>
          <Button onClick={handleReset}>{t('common.reset')}</Button>
        </Form>
        {(documentId || status || taskType || sourceKeyword) && (
          <Space wrap style={{ marginTop: 16 }}>
            {documentId && <Link to={`/documents/${documentId}`}>{t('documents.openDocument')}</Link>}
            {status && <Tag color={getTaskStatusColor(status)}>{status}</Tag>}
            {taskType && <Tag>{taskType}</Tag>}
            {sourceKeyword && <Tag color="blue">{sourceKeyword}</Tag>}
            <Link to="/tasks">{t('tasks.openFullFeed')}</Link>
          </Space>
        )}
      </Card>

      <Card className="page-card" title={t('tasks.recentTasks')}>
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={t('tasks.loadFailed')}
            description={query.error instanceof Error ? query.error.message : t('common.loadingFailed')}
          />
        )}
        <Table<TaskResponse>
          rowKey="taskId"
          dataSource={items}
          loading={query.isLoading}
          columns={columns}
          locale={{
            emptyText: <Empty description={t('tasks.empty')} />,
          }}
          pagination={{
            current: query.data?.pageNo ?? pageNo,
            pageSize: query.data?.pageSize ?? pageSize,
            total: query.data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => t('tasks.totalCount', { value: total }),
          }}
          onChange={handlePaginationChange}
        />
      </Card>
    </div>
  );
}
