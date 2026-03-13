import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Space, Switch, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
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
  const { t } = useI18n();
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
              {t('taskDetail.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('taskDetail.subtitle')}
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Link to="/tasks">{t('taskDetail.backToCenter')}</Link>
            <Typography.Text type="secondary">{t('common.autoRefresh')}</Typography.Text>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} />
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              {t('common.refresh')}
            </Button>
          </Space>
        </Space>
      </Card>

      {isActive && (
        <Alert
          type="info"
          showIcon
          message={t('taskDetail.activeMessage')}
          description={t('taskDetail.activeDescription')}
        />
      )}

      {isFailed && task?.documentId && (
        <Alert
          type="warning"
          showIcon
          message={t('taskDetail.failedFollowup')}
          description={
            <Space wrap>
              <Typography.Text>{task.errorMessage || t('taskDetail.failedFallback')}</Typography.Text>
              <Link to={`/documents/${task.documentId}`}>{t('documents.openDocument')}</Link>
              <Link to={`/tasks?documentId=${task.documentId}&status=failed`}>{t('taskDetail.openFailedDocumentTasks')}</Link>
            </Space>
          }
        />
      )}

      {isBatchImport && task?.sourceUri && (
        <Alert
          type="info"
          showIcon
          message={t('taskDetail.batchFollowup')}
          description={
            <Space wrap>
              <Typography.Text>{t('taskDetail.trackSameSource')}</Typography.Text>
              <Link to={`/tasks?taskType=batch_import&sourceKeyword=${encodeURIComponent(task.sourceUri)}`}>
                {t('taskDetail.openSameSource')}
              </Link>
            </Space>
          }
        />
      )}

      <Card className="page-card" title={t('taskDetail.lookup')}>
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
          <Form.Item name="taskId" label={t('taskDetail.taskId')} rules={[{ required: true, message: t('taskDetail.taskIdRequired') }]}>
            <Input style={{ width: 360 }} placeholder={t('taskDetail.taskIdPlaceholder')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            {t('common.open')}
          </Button>
          <Button onClick={() => navigate('/tasks')}>{t('taskDetail.openTaskCenter')}</Button>
        </Form>
      </Card>

      <Card className="page-card" title={t('taskDetail.taskState')} loading={query.isLoading}>
        <Typography.Paragraph type="secondary">{t('taskDetail.idLine', { value: taskId || '-' })}</Typography.Paragraph>
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={t('taskDetail.loadFailed')}
            description={query.error instanceof Error ? query.error.message : t('common.loadingFailed')}
          />
        )}
        {task && (
          <>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color={getTaskStatusColor(task.status)}>{task.status || 'unknown'}</Tag>
              <Tag>{task.taskType || 'unknown'}</Tag>
              {task.documentId && <Link to={`/documents/${task.documentId}`}>{t('documents.openDocument')}</Link>}
              {task.documentId && <Link to={`/tasks?documentId=${task.documentId}`}>{t('taskDetail.openDocumentTasks')}</Link>}
              {task.taskType && <Link to={`/tasks?taskType=${task.taskType}`}>{t('taskDetail.openTypeTasks', { value: task.taskType })}</Link>}
              {task.status && <Link to={`/tasks?status=${task.status}`}>{t('taskDetail.openStatusTasks', { value: task.status })}</Link>}
            </Space>

            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('tasks.taskType')}>{task.taskType}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag color={getTaskStatusColor(task.status)}>{task.status || 'unknown'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('taskDetail.currentStep')}>{task.step || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('taskDetail.retryCount')}>{task.retryCount}</Descriptions.Item>
              <Descriptions.Item label={t('common.sourceUri')}>
                <Typography.Text copyable={Boolean(task.sourceUri)}>{task.sourceUri || '-'}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.document')}>
                {task.documentId ? <Link to={`/documents/${task.documentId}`}>{task.documentId}</Link> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('taskDetail.versionId')}>{task.versionId || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('common.createdAt')}>{formatDateTime(task.createdAt)}</Descriptions.Item>
              <Descriptions.Item label={t('common.updatedAt')}>{formatDateTime(task.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label={t('taskDetail.startedAt')}>{formatDateTime(task.startedAt)}</Descriptions.Item>
              <Descriptions.Item label={t('taskDetail.finishedAt')}>{formatDateTime(task.finishedAt)}</Descriptions.Item>
              <Descriptions.Item label={t('taskDetail.errorMessage')}>{task.errorMessage || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {task?.errorMessage && (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message={t('taskDetail.reportedError')}
            description={task.errorMessage}
          />
        )}
      </Card>
    </div>
  );
}
