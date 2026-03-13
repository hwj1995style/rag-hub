import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { getQueryLog } from '../services/api/qa';
import type { Citation } from '../types/api';
import { formatDateTime } from '../utils/format';

export function QueryLogPage() {
  const navigate = useNavigate();
  const { logId = '' } = useParams();
  const { t } = useI18n();
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['queryLog', logId],
    queryFn: () => getQueryLog(logId),
    enabled: Boolean(logId),
  });

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              {t('queryLog.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('queryLog.subtitle')}
            </Typography.Paragraph>
          </div>
          <Space>
            <Link to="/query-logs">{t('queryLog.backToList')}</Link>
            <Link to="/qa">{t('queryLog.backToQa')}</Link>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              {t('common.refresh')}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card className="page-card" title={t('queryLog.lookup')}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ logId }}
          onFinish={(values: { logId: string }) => {
            if (values.logId?.trim()) {
              navigate(`/query-logs/${values.logId.trim()}`);
            }
          }}
        >
          <Form.Item name="logId" label={t('queryLog.logId')} rules={[{ required: true, message: t('queryLog.logIdRequired') }]}>
            <Input style={{ width: 360 }} placeholder={t('queryLog.logIdPlaceholder')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            {t('common.open')}
          </Button>
          <Button onClick={() => navigate('/query-logs')}>{t('queryLog.openList')}</Button>
          <Button onClick={() => navigate('/query-logs/66666666-6666-6666-6666-666666666666')}>{t('queryLog.useSample')}</Button>
        </Form>
      </Card>

      <Card className="page-card" title={t('queryLog.overview')} loading={query.isLoading}>
        {query.error && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={t('queryLog.loadFailed')}
            description={query.error instanceof Error ? query.error.message : t('common.loadingFailed')}
          />
        )}
        {query.data && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={t('queryLog.logId')}>{query.data.log_id}</Descriptions.Item>
            <Descriptions.Item label={t('common.sessionId')}>
              {query.data.session_id ? <Link to={`/query-logs?sessionId=${query.data.session_id}`}>{query.data.session_id}</Link> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.createdAt')}>{formatDateTime(query.data.created_at)}</Descriptions.Item>
            <Descriptions.Item label={t('queryLog.latency')}>{query.data.latency_ms ? `${query.data.latency_ms} ms` : '-'}</Descriptions.Item>
            <Descriptions.Item label={t('common.traceId')}>{query.data.trace_id}</Descriptions.Item>
            <Descriptions.Item label={t('common.question')}>{query.data.query_text}</Descriptions.Item>
            <Descriptions.Item label={t('common.rewrittenQuery')}>{query.data.rewritten_query || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('common.answer')}>{query.data.answer_text || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('queryLog.retrievedChunkIds')}>
              <Space wrap>
                {(query.data.retrieved_chunk_ids ?? []).map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}

        {query.data && (query.data.citations?.length ?? 0) === 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message={t('queryLog.noCitations')}
            description={t('queryLog.noCitationsDescription')}
          />
        )}
      </Card>

      <Card className="page-card" title={t('common.citations')}>
        <Table<Citation>
          rowKey={(record) => `${record.documentId}-${record.locator}`}
          dataSource={query.data?.citations ?? []}
          pagination={false}
          columns={[
            {
              title: t('common.document'),
              dataIndex: 'documentTitle',
              key: 'documentTitle',
              render: (_: unknown, record) => <Link to={`/documents/${record.documentId}`}>{record.documentTitle}</Link>,
            },
            { title: t('common.titlePath'), dataIndex: 'titlePath', key: 'titlePath' },
            { title: t('common.locator'), dataIndex: 'locator', key: 'locator', width: 100 },
            { title: t('qa.snippet'), dataIndex: 'snippet', key: 'snippet' },
          ]}
        />
      </Card>
    </div>
  );
}
