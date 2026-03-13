import { SearchOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Row, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import { searchKnowledge } from '../services/api/search';
import type { SearchItem } from '../types/api';

export function SearchPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [queryError, setQueryError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: searchKnowledge,
    onSuccess: () => setQueryError(null),
    onError: (error: Error) => {
      setQueryError(error.message);
      void message.error(error.message);
    },
  });

  const showNoAccessibleResults = useMemo(
    () => mutation.isSuccess && !queryError && (mutation.data?.total ?? 0) === 0,
    [mutation.data?.total, mutation.isSuccess, queryError],
  );

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Row gutter={[20, 20]}>
          <Col xs={24} xl={10}>
            <Typography.Title level={3} style={{ marginTop: 0 }}>
              {t('search.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary">{t('search.subtitle')}</Typography.Paragraph>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ topK: 10 }}
              onFinish={(values) => {
                setQueryError(null);
                mutation.mutate({
                  query: values.query,
                  topK: values.topK,
                  filters: values.bizDomain ? { bizDomain: values.bizDomain } : undefined,
                });
              }}
            >
              <Form.Item name="query" label={t('search.query')} rules={[{ required: true }]}> 
                <Input.TextArea rows={4} placeholder={t('search.queryPlaceholder')} />
              </Form.Item>
              <Space align="start" wrap>
                <Form.Item name="topK" label={t('search.topK')}>
                  <InputNumber min={1} max={20} />
                </Form.Item>
                <Form.Item name="bizDomain" label={t('search.domainFilter')}>
                  <Input placeholder={t('search.domainPlaceholder')} />
                </Form.Item>
              </Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={mutation.isPending}>
                {t('common.search')}
              </Button>
            </Form>
          </Col>
          <Col xs={24} xl={14}>
            <div className="metric-grid">
              <div className="metric-card">
                <Typography.Text type="secondary">{t('search.hits')}</Typography.Text>
                <Typography.Title level={3}>{mutation.data?.total ?? 0}</Typography.Title>
              </div>
              <div className="metric-card">
                <Typography.Text type="secondary">{t('search.state')}</Typography.Text>
                <Tag color={mutation.data ? 'green' : 'default'}>
                  {mutation.isPending ? t('search.stateRunning') : mutation.data ? t('search.stateComplete') : t('search.stateIdle')}
                </Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {queryError && <Alert type="error" showIcon closable onClose={() => setQueryError(null)} message={t('search.failed')} description={queryError} />}

      {showNoAccessibleResults && <Alert type="info" showIcon message={t('search.noAccessibleResults')} description={t('search.noAccessibleDescription')} />}

      <Card className="page-card" title={t('search.results')}>
        <Table<SearchItem>
          rowKey="chunkId"
          dataSource={mutation.data?.items ?? []}
          pagination={false}
          columns={[
            { title: t('common.document'), dataIndex: 'documentTitle', key: 'documentTitle' },
            { title: t('common.titlePath'), dataIndex: 'titlePath', key: 'titlePath' },
            { title: t('common.locator'), dataIndex: 'locator', key: 'locator', width: 100 },
            { title: t('search.score'), dataIndex: 'score', key: 'score', width: 100 },
            { title: t('search.snippet'), dataIndex: 'snippet', key: 'snippet' },
          ]}
        />
      </Card>
    </div>
  );
}
