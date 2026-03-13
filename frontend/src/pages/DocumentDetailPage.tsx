import { useState } from 'react';
import { CheckCircleOutlined, CopyOutlined, PartitionOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { getDocument, getDocumentChunks, reparseDocument, activateDocumentVersion } from '../services/api/documents';
import { useAuthStore } from '../stores/authStore';
import type { ChunkItem, TaskResponse } from '../types/api';
import { formatDateTime, isAdmin } from '../utils/format';

type ActivateResult = {
  document_id: string;
  version_id: string;
  status: string;
};

type CurrentVersion = {
  version_id: string;
  version_no: string;
  parse_status: string;
  index_status: string;
  effective_from: string;
  effective_to: string;
  is_current: boolean;
};

function hasCurrentVersion(value: Record<string, unknown> | CurrentVersion): value is CurrentVersion {
  return 'version_id' in value;
}

export function DocumentDetailPage() {
  const { documentId = '' } = useParams();
  const { message } = App.useApp();
  const { t } = useI18n();
  const roleCode = useAuthStore((state) => state.user?.roleCode);
  const [reparseForm] = Form.useForm();
  const [activateForm] = Form.useForm();
  const [reparseResult, setReparseResult] = useState<TaskResponse | null>(null);
  const [activateResult, setActivateResult] = useState<ActivateResult | null>(null);

  const detailQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
  });

  const chunkQuery = useQuery({
    queryKey: ['documentChunks', documentId, 'preview'],
    queryFn: () => getDocumentChunks(documentId, { page_size: 5, page_no_num: 1 }),
    enabled: Boolean(documentId),
  });

  const reparseMutation = useMutation({
    mutationFn: (payload: { forceReindex?: boolean; reason?: string }) => reparseDocument(documentId, payload),
    onSuccess: (data) => {
      setReparseResult(data);
      void message.success(`${t('documentDetail.reparseCreated')}: ${data.taskId}`);
    },
    onError: (error: Error) => void message.error(error.message),
  });

  const activateMutation = useMutation({
    mutationFn: (values: { versionId: string; effectiveFrom?: string; remark?: string }) => activateDocumentVersion(documentId, values.versionId, values),
    onSuccess: (data) => {
      setActivateResult(data);
      void message.success(t('documentDetail.activationSubmitted'));
      void detailQuery.refetch();
    },
    onError: (error: Error) => void message.error(error.message),
  });

  const detail = detailQuery.data;
  const chunks = chunkQuery.data?.items ?? [];
  const currentVersion = detail && hasCurrentVersion(detail.current_version) ? detail.current_version : null;
  const knownSeedHistoryVersion =
    documentId === '11111111-1111-1111-1111-111111111111' ? '22222222-2222-2222-2222-222222222223' : '';

  const chunkColumns = [
    { title: t('common.chunkNo'), dataIndex: 'chunkNo', key: 'chunkNo', width: 80 },
    { title: t('common.titlePath'), dataIndex: 'titlePath', key: 'titlePath' },
    { title: t('common.locator'), dataIndex: 'locator', key: 'locator', width: 120 },
    {
      title: t('common.summary'),
      dataIndex: 'contentSummary',
      key: 'contentSummary',
      render: (_: unknown, record: ChunkItem) => record.contentSummary || record.contentText,
    },
  ];

  const detailError = detailQuery.error instanceof Error ? detailQuery.error.message : null;
  const chunkError = chunkQuery.error instanceof Error ? chunkQuery.error.message : null;

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              {t('documentDetail.title')}
            </Typography.Title>
            <Typography.Text type="secondary">{documentId}</Typography.Text>
          </div>
          <Space>
            {isAdmin(roleCode) && (
              <Link to={`/permissions?resourceType=document&resourceId=${documentId}`}>
                <Button>{t('documentDetail.managePermissions')}</Button>
              </Link>
            )}
            <Link to={`/documents/${documentId}/chunks`}>
              <Button icon={<PartitionOutlined />}>{t('documentDetail.allChunks')}</Button>
            </Link>
            <Button icon={<ReloadOutlined />} onClick={() => { void detailQuery.refetch(); void chunkQuery.refetch(); }}>
              {t('common.refresh')}
            </Button>
          </Space>
        </Space>
      </Card>

      {detailError && (
        <Alert
          type="error"
          showIcon
          message={t('documentDetail.loadFailed')}
          description={detailError}
        />
      )}

      {!detailError && chunkError && (
        <Alert
          type="warning"
          showIcon
          message={t('documentDetail.chunkPreviewUnavailable')}
          description={chunkError}
        />
      )}

      {reparseResult && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setReparseResult(null)}
          message={t('documentDetail.reparseCreated')}
          description={<Link to={`/tasks/${reparseResult.taskId}`}>{t('documents.openTask', { value: reparseResult.taskId })}</Link>}
        />
      )}

      {activateResult && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setActivateResult(null)}
          message={t('documentDetail.activationSubmitted')}
          description={t('documentDetail.activationDescription', { versionId: activateResult.version_id, documentId: activateResult.document_id })}
        />
      )}

      {!detailError && (
        <Row gutter={[20, 20]}>
          <Col xs={24} xl={15}>
            <Card className="page-card" loading={detailQuery.isLoading}>
              {detail && (
                <Descriptions title={t('documentDetail.baseInfo')} bordered column={1}>
                  <Descriptions.Item label={t('documents.titleLabel')}>{detail.title}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.docCode')}>{detail.doc_code}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.sourceType')}>{detail.source_type}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.sourceUri')}>{detail.source_uri || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('documents.domain')}>{detail.biz_domain || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('documents.department')}>{detail.department || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.security')}>{detail.security_level}</Descriptions.Item>
                  <Descriptions.Item label={t('common.status')}><Tag color="green">{detail.status}</Tag></Descriptions.Item>
                </Descriptions>
              )}
            </Card>

            <Card className="page-card" title={t('documentDetail.chunkPreview')} style={{ marginTop: 20 }}>
              <Table rowKey="chunkId" columns={chunkColumns} dataSource={chunks} pagination={false} />
            </Card>
          </Col>

          <Col xs={24} xl={9}>
            <Card className="page-card" title={t('documentDetail.currentVersion')}>
              {currentVersion ? (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('common.versionId')}>
                    <Space>
                      <Typography.Text code>{currentVersion.version_id}</Typography.Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={async () => {
                          await navigator.clipboard.writeText(currentVersion.version_id);
                          void message.success(t('documentDetail.currentVersionCopied'));
                        }}
                      >
                        {t('common.copy')}
                      </Button>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.versionNo')}>{currentVersion.version_no}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.parseStatus')}>{currentVersion.parse_status}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.indexStatus')}>{currentVersion.index_status}</Descriptions.Item>
                  <Descriptions.Item label={t('documentDetail.effectiveFrom')}>{formatDateTime(currentVersion.effective_from)}</Descriptions.Item>
                </Descriptions>
              ) : (
                <Typography.Text type="secondary">{t('documentDetail.noVersionData')}</Typography.Text>
              )}
            </Card>

            {isAdmin(roleCode) && (
              <>
                <Card className="page-card" title={t('documentDetail.reparse')} style={{ marginTop: 20 }}>
                  <Typography.Paragraph type="secondary">
                    {t('documentDetail.reparseDescription')}
                  </Typography.Paragraph>
                  <Form
                    form={reparseForm}
                    layout="vertical"
                    initialValues={{ forceReindex: true }}
                    onFinish={(values) => reparseMutation.mutate(values)}
                  >
                    <Form.Item name="reason" label={t('documentDetail.reason')}>
                      <Input.TextArea rows={3} placeholder={t('documentDetail.reasonPlaceholder')} />
                    </Form.Item>
                    <Form.Item name="forceReindex" label={t('documentDetail.forceReindex')} valuePropName="checked">
                      <Switch checkedChildren={t('common.yes')} unCheckedChildren={t('common.no')} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={reparseMutation.isPending} icon={<ReloadOutlined />}>
                      {t('documentDetail.submitReparse')}
                    </Button>
                  </Form>
                </Card>

                <Card className="page-card" title={t('documentDetail.activateVersion')} style={{ marginTop: 20 }}>
                  <Typography.Paragraph type="secondary">
                    {t('documentDetail.activateDescription')}
                  </Typography.Paragraph>
                  <Space wrap style={{ marginBottom: 16 }}>
                    {currentVersion && (
                      <Button onClick={() => activateForm.setFieldValue('versionId', currentVersion.version_id)}>
                        {t('documentDetail.useCurrentVersionId')}
                      </Button>
                    )}
                    {knownSeedHistoryVersion && (
                      <Button onClick={() => activateForm.setFieldValue('versionId', knownSeedHistoryVersion)}>
                        {t('documentDetail.useSeededHistoryVersion')}
                      </Button>
                    )}
                    <Button onClick={() => activateForm.setFieldValue('effectiveFrom', new Date().toISOString())}>
                      {t('documentDetail.fillCurrentTimestamp')}
                    </Button>
                  </Space>
                  <Form form={activateForm} layout="vertical" onFinish={(values) => activateMutation.mutate(values)}>
                    <Form.Item name="versionId" label={t('documentDetail.targetVersionId')} rules={[{ required: true }]}>
                      <Input placeholder={t('documentDetail.targetVersionPlaceholder')} />
                    </Form.Item>
                    <Form.Item name="effectiveFrom" label={t('documentDetail.effectiveFrom')}>
                      <Input placeholder={t('documentDetail.effectiveFromPlaceholder')} />
                    </Form.Item>
                    <Form.Item name="remark" label={t('documentDetail.remark')}>
                      <Input.TextArea rows={3} placeholder={t('documentDetail.remarkPlaceholder')} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={activateMutation.isPending} icon={<CheckCircleOutlined />}>
                      {t('documentDetail.activate')}
                    </Button>
                  </Form>
                </Card>
              </>
            )}
          </Col>
        </Row>
      )}
    </div>
  );
}
