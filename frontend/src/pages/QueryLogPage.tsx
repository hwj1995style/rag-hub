import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Space, Table, Tag, Typography } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getQueryLog } from '../services/api/qa';
import type { Citation } from '../types/api';
import { formatDateTime } from '../utils/format';

export function QueryLogPage() {
  const navigate = useNavigate();
  const { logId = '' } = useParams();
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
              Query Log Detail
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Use this page to inspect saved QA traces, cited chunks, and latency when you need to explain an answer.
            </Typography.Paragraph>
          </div>
          <Space>
            <Link to="/qa">Back to QA</Link>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      <Card className="page-card" title="Lookup another query log">
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
          <Form.Item name="logId" label="Log ID" rules={[{ required: true, message: 'Please enter a log ID' }]}>
            <Input style={{ width: 360 }} placeholder="66666666-6666-6666-6666-666666666666" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            Open
          </Button>
          <Button onClick={() => navigate('/query-logs/66666666-6666-6666-6666-666666666666')}>Use sample log</Button>
        </Form>
      </Card>

      <Card className="page-card" title="Log overview" loading={query.isLoading}>
        {query.data && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Log ID">{query.data.log_id}</Descriptions.Item>
            <Descriptions.Item label="Session ID">{query.data.session_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="Created at">{formatDateTime(query.data.created_at)}</Descriptions.Item>
            <Descriptions.Item label="Latency">{query.data.latency_ms ? `${query.data.latency_ms} ms` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Trace ID">{query.data.trace_id}</Descriptions.Item>
            <Descriptions.Item label="Question">{query.data.query_text}</Descriptions.Item>
            <Descriptions.Item label="Rewritten query">{query.data.rewritten_query || '-'}</Descriptions.Item>
            <Descriptions.Item label="Answer">{query.data.answer_text || '-'}</Descriptions.Item>
            <Descriptions.Item label="Retrieved chunk IDs">
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
            message="No citations recorded"
            description="This query log did not store any citations, so only the raw answer trace is available."
          />
        )}
      </Card>

      <Card className="page-card" title="Citations">
        <Table<Citation>
          rowKey={(record) => `${record.documentId}-${record.locator}`}
          dataSource={query.data?.citations ?? []}
          pagination={false}
          columns={[
            {
              title: 'Document',
              dataIndex: 'documentTitle',
              key: 'documentTitle',
              render: (_: unknown, record) => <Link to={`/documents/${record.documentId}`}>{record.documentTitle}</Link>,
            },
            { title: 'Title Path', dataIndex: 'titlePath', key: 'titlePath' },
            { title: 'Locator', dataIndex: 'locator', key: 'locator', width: 100 },
            { title: 'Snippet', dataIndex: 'snippet', key: 'snippet' },
          ]}
        />
      </Card>
    </div>
  );
}
