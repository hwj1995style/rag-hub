import { LinkOutlined, MessageOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Row, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { askQuestion } from '../services/api/qa';
import type { Citation } from '../types/api';

export function QaPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [queryError, setQueryError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: askQuestion,
    onSuccess: () => setQueryError(null),
    onError: (error: Error) => {
      setQueryError(error.message);
      void message.error(error.message);
    },
  });

  const sessionId = mutation.data?.sessionId || form.getFieldValue('sessionId');
  const showNoAccessibleEvidence = useMemo(
    () => mutation.isSuccess && !queryError && (mutation.data?.retrievedCount ?? 0) === 0,
    [mutation.data?.retrievedCount, mutation.isSuccess, queryError],
  );

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Row gutter={[20, 20]}>
          <Col xs={24} xl={10}>
            <Typography.Title level={3} style={{ marginTop: 0 }}>
              QA Workbench
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              This page calls POST /api/qa/query and links to query log pages for traceability.
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary">
              For the seeded local dataset, <Typography.Text code>business license</Typography.Text> is a stable sample query.
            </Typography.Paragraph>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ query: 'business license', topK: 5, returnCitations: true, sessionId: 'frontend-session-001' }}
              onFinish={(values) => {
                setQueryError(null);
                mutation.mutate(values);
              }}
            >
              <Form.Item name="query" label="Question" rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder="business license" />
              </Form.Item>
              <Space wrap align="start">
                <Form.Item name="topK" label="TopK">
                  <InputNumber min={1} max={20} />
                </Form.Item>
                <Form.Item name="sessionId" label="Session ID">
                  <Input style={{ width: 220 }} />
                </Form.Item>
              </Space>
              <Space wrap>
                <Button type="primary" htmlType="submit" icon={<MessageOutlined />} loading={mutation.isPending}>
                  Ask
                </Button>
                <Button onClick={() => form.setFieldValue('query', 'business license')}>Use seeded sample query</Button>
              </Space>
            </Form>
          </Col>
          <Col xs={24} xl={14}>
            <Card bordered={false} style={{ background: '#f8fafc' }}>
              <Typography.Text type="secondary">Answer</Typography.Text>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 12, minHeight: 120 }}>
                {mutation.data?.answer || 'Submit a question to view the answer.'}
              </Typography.Paragraph>
              <Space wrap>
                <Typography.Text>confidence: {mutation.data?.confidence ?? '-'}</Typography.Text>
                <Typography.Text>retrievedCount: {mutation.data?.retrievedCount ?? '-'}</Typography.Text>
                <Typography.Text>usedChunkCount: {mutation.data?.usedChunkCount ?? '-'}</Typography.Text>
                {mutation.data?.sessionId && <Typography.Text>sessionId: {mutation.data.sessionId}</Typography.Text>}
                {sessionId && <Link to={`/query-logs?sessionId=${sessionId}`}>Open session logs</Link>}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {queryError && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setQueryError(null)}
          message="QA request failed"
          description={queryError}
        />
      )}

      {showNoAccessibleEvidence && (
        <Alert
          type="info"
          showIcon
          message="No accessible evidence"
          description="Matching documents may be restricted or unavailable for the current account."
        />
      )}

      <Card
        className="page-card"
        title="Citations"
        extra={
          <Space>
            <Link to="/query-logs">
              <LinkOutlined /> Query Logs
            </Link>
            <Link to="/query-logs/66666666-6666-6666-6666-666666666666">
              <LinkOutlined /> Sample detail
            </Link>
          </Space>
        }
      >
        <Table<Citation>
          rowKey={(record) => `${record.documentId}-${record.locator}`}
          dataSource={mutation.data?.citations ?? []}
          pagination={false}
          columns={[
            { title: 'Document', dataIndex: 'documentTitle', key: 'documentTitle' },
            { title: 'Title Path', dataIndex: 'titlePath', key: 'titlePath' },
            { title: 'Locator', dataIndex: 'locator', key: 'locator', width: 100 },
            { title: 'Snippet', dataIndex: 'snippet', key: 'snippet' },
          ]}
        />
      </Card>
    </div>
  );
}