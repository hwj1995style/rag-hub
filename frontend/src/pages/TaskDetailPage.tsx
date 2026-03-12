import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Space, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTask } from '../services/api/tasks';
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

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId = '' } = useParams();
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
  });

  const statusTag = useMemo(() => {
    if (!query.data?.status) {
      return <Tag>unknown</Tag>;
    }
    return <Tag color={getTaskStatusColor(query.data.status)}>{query.data.status}</Tag>;
  }, [query.data?.status]);

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              Task Detail
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Inspect ingest, batch-import, or reparse tasks, then jump back to the owning document when one exists.
            </Typography.Paragraph>
          </div>
          <Space>
            <Link to="/tasks">Back to task center</Link>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      <Card className="page-card" title="Lookup another task">
        <Form
          form={form}
          layout="inline"
          initialValues={{ taskId }}
          onFinish={(values: { taskId: string }) => {
            if (values.taskId?.trim()) {
              navigate(`/tasks/${values.taskId.trim()}`);
            }
          }}
        >
          <Form.Item name="taskId" label="Task ID" rules={[{ required: true, message: 'Please enter a task ID' }]}>
            <Input style={{ width: 360 }} placeholder="44444444-4444-4444-4444-444444444444" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            Open
          </Button>
          <Button onClick={() => navigate('/tasks/44444444-4444-4444-4444-444444444444')}>Use sample task</Button>
        </Form>
      </Card>

      <Card className="page-card" title="Task state" loading={query.isLoading}>
        <Typography.Paragraph type="secondary">Task ID: {taskId || '-'}</Typography.Paragraph>
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message="Failed to load task"
            description={query.error instanceof Error ? query.error.message : 'Request failed'}
          />
        )}
        {query.data && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Task type">{query.data.taskType}</Descriptions.Item>
            <Descriptions.Item label="Status">{statusTag}</Descriptions.Item>
            <Descriptions.Item label="Current step">{query.data.step || '-'}</Descriptions.Item>
            <Descriptions.Item label="Retry count">{query.data.retryCount}</Descriptions.Item>
            <Descriptions.Item label="Source URI">{query.data.sourceUri || '-'}</Descriptions.Item>
            <Descriptions.Item label="Document">
              {query.data.documentId ? <Link to={`/documents/${query.data.documentId}`}>{query.data.documentId}</Link> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Version ID">{query.data.versionId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Created at">{formatDateTime(query.data.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Started at">{formatDateTime(query.data.startedAt)}</Descriptions.Item>
            <Descriptions.Item label="Finished at">{formatDateTime(query.data.finishedAt)}</Descriptions.Item>
            <Descriptions.Item label="Error message">{query.data.errorMessage || '-'}</Descriptions.Item>
          </Descriptions>
        )}

        {query.data?.errorMessage && (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="Task reported an error"
            description={query.data.errorMessage}
          />
        )}
      </Card>
    </div>
  );
}