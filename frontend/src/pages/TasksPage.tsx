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
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') ?? undefined;
  const taskType = searchParams.get('taskType') ?? undefined;
  const documentId = searchParams.get('documentId') ?? undefined;
  const pageNo = toPositiveInt(searchParams.get('pageNo'), 1);
  const pageSize = toPositiveInt(searchParams.get('pageSize'), 20);
  const autoRefresh = searchParams.get('autoRefresh') === 'true';

  useEffect(() => {
    form.setFieldsValue({
      status,
      taskType,
      documentId: documentId ?? '',
      autoRefresh,
    });
  }, [autoRefresh, documentId, form, status, taskType]);

  const query = useQuery({
    queryKey: ['tasks', status, taskType, documentId, pageNo, pageSize],
    queryFn: () => listTasks({ status, taskType, documentId, pageNo, pageSize }),
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
      title: 'Task ID',
      dataIndex: 'taskId',
      key: 'taskId',
      render: (value: string) => <Link to={`/tasks/${value}`}>{value}</Link>,
    },
    {
      title: 'Type',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={getTaskStatusColor(value)}>{value}</Tag>,
    },
    {
      title: 'Step',
      dataIndex: 'step',
      key: 'step',
      render: (value: string) => value || '-',
    },
    {
      title: 'Document',
      dataIndex: 'documentId',
      key: 'documentId',
      render: (value: string) => (value ? <Link to={`/documents/${value}`}>{value}</Link> : '-'),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: 'Source URI',
      dataIndex: 'sourceUri',
      key: 'sourceUri',
      render: (value: string) => (
        <Typography.Text ellipsis={{ tooltip: value || '-' }} style={{ maxWidth: 240 }}>
          {value || '-'}
        </Typography.Text>
      ),
    },
    {
      title: 'Error',
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
        pageNo: 1,
        pageSize,
        autoRefresh,
        ...next,
      }),
    );
  };

  const handleApply = (values: { status?: string; taskType?: string; documentId?: string; autoRefresh?: boolean }) => {
    updateFilters({
      status: values.status,
      taskType: values.taskType,
      documentId: values.documentId?.trim(),
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
              Task Center
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Track ingest, batch-import, and reparse work from one place, then jump into the owning document or a focused task detail page.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Typography.Text type="secondary">Auto refresh</Typography.Text>
            <Switch
              checked={autoRefresh}
              onChange={(checked) => {
                form.setFieldValue('autoRefresh', checked);
                updateFilters({ autoRefresh: checked, pageNo, pageSize });
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      {autoRefresh && (
        <Alert
          type="info"
          showIcon
          message="Auto refresh is enabled"
          description="The task table refreshes every 10 seconds while you monitor active work."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title="Visible tasks" value={summary.total} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title="Active" value={summary.active} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title="Succeeded" value={summary.success} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="page-card"><Statistic title="Failed" value={summary.failed} /></Card>
        </Col>
      </Row>

      <Card className="page-card" title="Quick views">
        <Space wrap>
          <Button onClick={() => updateFilters({ status: undefined, taskType: undefined, documentId: undefined })}>All tasks</Button>
          <Button onClick={() => updateFilters({ status: 'failed' })}>Failed tasks</Button>
          <Button onClick={() => updateFilters({ status: 'running' })}>Running tasks</Button>
          <Button onClick={() => updateFilters({ taskType: 'batch_import' })}>Batch imports</Button>
          <Button onClick={() => updateFilters({ taskType: 'reparse' })}>Reparse tasks</Button>
          {documentId && <Button onClick={() => updateFilters({ documentId })}>Current document tasks</Button>}
        </Space>
      </Card>

      <Card className="page-card" title="Filters">
        <Form
          form={form}
          layout="inline"
          initialValues={{ status: undefined, taskType: undefined, documentId: '', autoRefresh }}
          onFinish={handleApply}
        >
          <Form.Item name="status" label="Status">
            <Select
              allowClear
              style={{ width: 160 }}
              options={[
                { label: 'pending', value: 'pending' },
                { label: 'running', value: 'running' },
                { label: 'success', value: 'success' },
                { label: 'failed', value: 'failed' },
              ]}
            />
          </Form.Item>
          <Form.Item name="taskType" label="Task type">
            <Select
              allowClear
              style={{ width: 180 }}
              options={[
                { label: 'ingest', value: 'ingest' },
                { label: 'reparse', value: 'reparse' },
                { label: 'batch_import', value: 'batch_import' },
              ]}
            />
          </Form.Item>
          <Form.Item name="documentId" label="Document ID">
            <Input allowClear style={{ width: 320 }} placeholder="11111111-1111-1111-1111-111111111111" />
          </Form.Item>
          <Form.Item name="autoRefresh" label="Auto refresh" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" icon={<FilterOutlined />} htmlType="submit">
            Apply
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </Form>
        {(documentId || status || taskType) && (
          <Space wrap style={{ marginTop: 16 }}>
            {documentId && <Link to={`/documents/${documentId}`}>Open document {documentId}</Link>}
            {status && <Tag color={getTaskStatusColor(status)}>{status}</Tag>}
            {taskType && <Tag>{taskType}</Tag>}
            <Link to="/tasks">Open full task feed</Link>
          </Space>
        )}
      </Card>

      <Card className="page-card" title="Recent tasks">
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message="Failed to load tasks"
            description={query.error instanceof Error ? query.error.message : 'Request failed'}
          />
        )}
        <Table<TaskResponse>
          rowKey="taskId"
          dataSource={items}
          loading={query.isLoading}
          columns={columns}
          locale={{
            emptyText: <Empty description="No tasks match the current filters." />,
          }}
          pagination={{
            current: query.data?.pageNo ?? pageNo,
            pageSize: query.data?.pageSize ?? pageSize,
            total: query.data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tasks`,
          }}
          onChange={handlePaginationChange}
        />
      </Card>
    </div>
  );
}
