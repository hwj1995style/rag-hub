import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listTasks } from '../services/api/tasks';
import type { TaskResponse } from '../types/api';
import { formatDateTime } from '../utils/format';

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

export function TasksPage() {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const status = Form.useWatch('status', form);
  const taskType = Form.useWatch('taskType', form);
  const documentId = Form.useWatch('documentId', form);

  useEffect(() => {
    form.setFieldsValue({
      status: searchParams.get('status') ?? undefined,
      taskType: searchParams.get('taskType') ?? undefined,
      documentId: searchParams.get('documentId') ?? '',
    });
  }, [form, searchParams]);

  const query = useQuery({
    queryKey: ['tasks', status, taskType, documentId],
    queryFn: () => listTasks({ status, taskType, documentId, pageNo: 1, pageSize: 20 }),
  });

  const columns = [
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string | null) => formatDateTime(value),
    },
  ];

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              Task Center
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Review ingest, batch-import, and reparse tasks in one place before jumping into document or task detail pages.
            </Typography.Paragraph>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
            Refresh
          </Button>
        </Space>
      </Card>

      <Card className="page-card" title="Filters">
        <Form form={form} layout="inline" initialValues={{ status: undefined, taskType: undefined, documentId: '' }}>
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
          <Button icon={<FilterOutlined />} onClick={() => void query.refetch()}>
            Apply
          </Button>
        </Form>
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
          dataSource={query.data?.items ?? []}
          loading={query.isLoading}
          pagination={false}
          columns={columns}
        />
      </Card>
    </div>
  );
}