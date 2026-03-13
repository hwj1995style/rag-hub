import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Space, Switch, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTask } from '../services/api/tasks';
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

export function TaskDetailPage() {
  const navigate = useNavigate();
  const { taskId = '' } = useParams();
  const [form] = Form.useForm();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const query = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
    refetchInterval: autoRefresh ? 10_000 : false,
  });

  useEffect(() => {
    form.setFieldsValue({ taskId });
  }, [form, taskId]);

  useEffect(() => {
    if (!query.data?.status) {
      return;
    }
    setAutoRefresh(ACTIVE_TASK_STATUSES.has(query.data.status));
  }, [query.data?.status]);

  const task = query.data;
  const isActive = Boolean(task?.status && ACTIVE_TASK_STATUSES.has(task.status));
  const isFailed = task?.status === 'failed';
  const isBatchImport = task?.taskType === 'batch_import';

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              Task Detail
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Inspect ingest, batch-import, or reparse work, keep active tasks refreshing, and jump back to the owning document or filtered task list.
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Link to="/tasks">Back to task center</Link>
            <Typography.Text type="secondary">Auto refresh</Typography.Text>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} />
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      {isActive && (
        <Alert
          type="info"
          showIcon
          message="This task is still active"
          description="Auto refresh stays enabled while the task is pending or running so you can watch status changes without leaving the page."
        />
      )}

      {isFailed && task?.documentId && (
        <Alert
          type="warning"
          showIcon
          message="Task needs follow-up"
          description={
            <Space wrap>
              <Typography.Text>{task.errorMessage || 'The task finished with an error.'}</Typography.Text>
              <Link to={`/documents/${task.documentId}`}>Open document</Link>
              <Link to={`/tasks?documentId=${task.documentId}&status=failed`}>Open failed tasks for this document</Link>
            </Space>
          }
        />
      )}

      {isBatchImport && task?.sourceUri && (
        <Alert
          type="info"
          showIcon
          message="Batch import follow-up"
          description={
            <Space wrap>
              <Typography.Text>Track other tasks from the same source:</Typography.Text>
              <Link to={`/tasks?taskType=batch_import&sourceKeyword=${encodeURIComponent(task.sourceUri)}`}>
                Open same-source batch tasks
              </Link>
            </Space>
          }
        />
      )}

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
          <Button onClick={() => navigate('/tasks')}>Open task center</Button>
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
        {task && (
          <>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color={getTaskStatusColor(task.status)}>{task.status || 'unknown'}</Tag>
              <Tag>{task.taskType || 'unknown'}</Tag>
              {task.documentId && <Link to={`/documents/${task.documentId}`}>Open document</Link>}
              {task.documentId && <Link to={`/tasks?documentId=${task.documentId}`}>Open document tasks</Link>}
              {task.taskType && <Link to={`/tasks?taskType=${task.taskType}`}>Open {task.taskType} tasks</Link>}
              {task.status && <Link to={`/tasks?status=${task.status}`}>Open {task.status} tasks</Link>}
            </Space>

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Task type">{task.taskType}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getTaskStatusColor(task.status)}>{task.status || 'unknown'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Current step">{task.step || '-'}</Descriptions.Item>
              <Descriptions.Item label="Retry count">{task.retryCount}</Descriptions.Item>
              <Descriptions.Item label="Source URI">
                <Typography.Text copyable={Boolean(task.sourceUri)}>{task.sourceUri || '-'}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Document">
                {task.documentId ? <Link to={`/documents/${task.documentId}`}>{task.documentId}</Link> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Version ID">{task.versionId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Created at">{formatDateTime(task.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated at">{formatDateTime(task.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="Started at">{formatDateTime(task.startedAt)}</Descriptions.Item>
              <Descriptions.Item label="Finished at">{formatDateTime(task.finishedAt)}</Descriptions.Item>
              <Descriptions.Item label="Error message">{task.errorMessage || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {task?.errorMessage && (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="Task reported an error"
            description={task.errorMessage}
          />
        )}
      </Card>
    </div>
  );
}
