import { LinkOutlined, MessageOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Row, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { askQuestion } from '../services/api/qa';
import type { Citation } from '../types/api';

export function QaPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
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
              {t('qa.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary">{t('qa.subtitle')}</Typography.Paragraph>
            <Typography.Paragraph type="secondary">
              {t('qa.seedNote', { query: 'business license' })}
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
              <Form.Item name="query" label={t('qa.question')} rules={[{ required: true }]}> 
                <Input.TextArea rows={4} placeholder="business license" />
              </Form.Item>
              <Space wrap align="start">
                <Form.Item name="topK" label={t('search.topK')}>
                  <InputNumber min={1} max={20} />
                </Form.Item>
                <Form.Item name="sessionId" label={t('qa.sessionId')}>
                  <Input style={{ width: 220 }} />
                </Form.Item>
              </Space>
              <Space wrap>
                <Button type="primary" htmlType="submit" icon={<MessageOutlined />} loading={mutation.isPending}>
                  {t('qa.ask')}
                </Button>
                <Button onClick={() => form.setFieldValue('query', 'business license')}>{t('qa.useSeeded')}</Button>
              </Space>
            </Form>
          </Col>
          <Col xs={24} xl={14}>
            <Card bordered={false} style={{ background: '#f8fafc' }}>
              <Typography.Text type="secondary">{t('qa.answer')}</Typography.Text>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 12, minHeight: 120 }}>
                {mutation.data?.answer || t('qa.answerPlaceholder')}
              </Typography.Paragraph>
              <Space wrap>
                <Typography.Text>{t('qa.confidence', { value: mutation.data?.confidence ?? '-' })}</Typography.Text>
                <Typography.Text>{t('qa.retrievedCount', { value: mutation.data?.retrievedCount ?? '-' })}</Typography.Text>
                <Typography.Text>{t('qa.usedChunkCount', { value: mutation.data?.usedChunkCount ?? '-' })}</Typography.Text>
                {mutation.data?.sessionId && <Typography.Text>{t('qa.sessionLine', { value: mutation.data.sessionId })}</Typography.Text>}
                {sessionId && <Link to={`/query-logs?sessionId=${sessionId}`}>{t('qa.openSessionLogs')}</Link>}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {queryError && <Alert type="error" showIcon closable onClose={() => setQueryError(null)} message={t('qa.failed')} description={queryError} />}

      {showNoAccessibleEvidence && <Alert type="info" showIcon message={t('qa.noEvidence')} description={t('qa.noEvidenceDescription')} />}

      <Card className="page-card" title={t('qa.citations')} extra={<Space><Link to="/query-logs"><LinkOutlined /> {t('qa.queryLogs')}</Link><Link to="/query-logs/66666666-6666-6666-6666-666666666666"><LinkOutlined /> {t('qa.sampleDetail')}</Link></Space>}>
        <Table<Citation>
          rowKey={(record) => `${record.documentId}-${record.locator}`}
          dataSource={mutation.data?.citations ?? []}
          pagination={false}
          columns={[
            { title: t('common.document'), dataIndex: 'documentTitle', key: 'documentTitle' },
            { title: t('common.titlePath'), dataIndex: 'titlePath', key: 'titlePath' },
            { title: t('common.locator'), dataIndex: 'locator', key: 'locator', width: 100 },
            { title: t('qa.snippet'), dataIndex: 'snippet', key: 'snippet' },
          ]}
        />
      </Card>
    </div>
  );
}
