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
import { activateDocumentVersion, getDocument, getDocumentChunks, reparseDocument } from '../services/api/documents';
import { useAuthStore } from '../stores/authStore';
import type { ChunkItem, TaskResponse } from '../types/api';
import { formatDateTime, isAdmin } from '../utils/format';

type ActivateResult = {
  document_id: string;
  version_id: string;
  status: string;
};

function hasCurrentVersion(
  value: Record<string, unknown> | { version_id: string; version_no: string; parse_status: string; index_status: string; effective_from: string; effective_to: string; is_current: boolean },
): value is { version_id: string; version_no: string; parse_status: string; index_status: string; effective_from: string; effective_to: string; is_current: boolean } {
  return 'version_id' in value;
}

export function DocumentDetailPage() {
  const { documentId = '' } = useParams();
  const { message } = App.useApp();
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
      void message.success(`Reparse task created: ${data.taskId}`);
    },
    onError: (error: Error) => void message.error(error.message),
  });

  const activateMutation = useMutation({
    mutationFn: (values: { versionId: string; effectiveFrom?: string; remark?: string }) => activateDocumentVersion(documentId, values.versionId, values),
    onSuccess: (data) => {
      setActivateResult(data);
      void message.success('Version activated');
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
    { title: 'No', dataIndex: 'chunkNo', key: 'chunkNo', width: 80 },
    { title: 'Title Path', dataIndex: 'titlePath', key: 'titlePath' },
    { title: 'Locator', dataIndex: 'locator', key: 'locator', width: 120 },
    {
      title: 'Summary',
      dataIndex: 'contentSummary',
      key: 'contentSummary',
      render: (_: unknown, record: ChunkItem) => record.contentSummary || record.contentText,
    },
  ];

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
              Document Detail
            </Typography.Title>
            <Typography.Text type="secondary">{documentId}</Typography.Text>
          </div>
          <Space>
            <Link to={`/documents/${documentId}/chunks`}>
              <Button icon={<PartitionOutlined />}>All chunks</Button>
            </Link>
            <Button icon={<ReloadOutlined />} onClick={() => { void detailQuery.refetch(); void chunkQuery.refetch(); }}>
              Refresh
            </Button>
          </Space>
        </Space>
      </Card>

      {reparseResult && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setReparseResult(null)}
          message="Reparse task created"
          description={<Link to={`/tasks/${reparseResult.taskId}`}>Open task {reparseResult.taskId}</Link>}
        />
      )}

      {activateResult && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setActivateResult(null)}
          message="Version activation submitted"
          description={`Version ${activateResult.version_id} is now active for document ${activateResult.document_id}.`}
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={15}>
          <Card className="page-card" loading={detailQuery.isLoading}>
            {detail && (
              <Descriptions title="Base info" bordered column={1}>
                <Descriptions.Item label="Title">{detail.title}</Descriptions.Item>
                <Descriptions.Item label="Doc code">{detail.doc_code}</Descriptions.Item>
                <Descriptions.Item label="Source type">{detail.source_type}</Descriptions.Item>
                <Descriptions.Item label="Source uri">{detail.source_uri || '-'}</Descriptions.Item>
                <Descriptions.Item label="Domain">{detail.biz_domain || '-'}</Descriptions.Item>
                <Descriptions.Item label="Department">{detail.department || '-'}</Descriptions.Item>
                <Descriptions.Item label="Security">{detail.security_level}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color="green">{detail.status}</Tag></Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          <Card className="page-card" title="Chunk preview" style={{ marginTop: 20 }}>
            <Table rowKey="chunkId" columns={chunkColumns} dataSource={chunks} pagination={false} />
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card className="page-card" title="Current version">
            {currentVersion ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Version ID">
                  <Space>
                    <Typography.Text code>{currentVersion.version_id}</Typography.Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        await navigator.clipboard.writeText(currentVersion.version_id);
                        void message.success('Current version ID copied');
                      }}
                    >
                      Copy
                    </Button>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Version no">{currentVersion.version_no}</Descriptions.Item>
                <Descriptions.Item label="Parse status">{currentVersion.parse_status}</Descriptions.Item>
                <Descriptions.Item label="Index status">{currentVersion.index_status}</Descriptions.Item>
                <Descriptions.Item label="Effective from">{formatDateTime(currentVersion.effective_from)}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">No version data</Typography.Text>
            )}
          </Card>

          {isAdmin(roleCode) && (
            <>
              <Card className="page-card" title="Reparse" style={{ marginTop: 20 }}>
                <Typography.Paragraph type="secondary">
                  Use this to enqueue a new reparse task for the current document.
                </Typography.Paragraph>
                <Form
                  form={reparseForm}
                  layout="vertical"
                  initialValues={{ forceReindex: true }}
                  onFinish={(values) => reparseMutation.mutate(values)}
                >
                  <Form.Item name="reason" label="Reason">
                    <Input.TextArea rows={3} placeholder="For example: refresh chunks after parser update" />
                  </Form.Item>
                  <Form.Item name="forceReindex" label="Force reindex" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={reparseMutation.isPending} icon={<ReloadOutlined />}>
                    Submit reparse
                  </Button>
                </Form>
              </Card>

              <Card className="page-card" title="Activate version" style={{ marginTop: 20 }}>
                <Typography.Paragraph type="secondary">
                  The current API does not expose version history, so this panel offers quick-fill helpers plus manual entry.
                </Typography.Paragraph>
                <Space wrap style={{ marginBottom: 16 }}>
                  {currentVersion && (
                    <Button onClick={() => activateForm.setFieldValue('versionId', currentVersion.version_id)}>
                      Use current version ID
                    </Button>
                  )}
                  {knownSeedHistoryVersion && (
                    <Button onClick={() => activateForm.setFieldValue('versionId', knownSeedHistoryVersion)}>
                      Use seeded history version
                    </Button>
                  )}
                  <Button onClick={() => activateForm.setFieldValue('effectiveFrom', new Date().toISOString())}>
                    Fill current timestamp
                  </Button>
                </Space>
                <Form form={activateForm} layout="vertical" onFinish={(values) => activateMutation.mutate(values)}>
                  <Form.Item name="versionId" label="Target version ID" rules={[{ required: true }]}>
                    <Input placeholder="Enter target version UUID" />
                  </Form.Item>
                  <Form.Item name="effectiveFrom" label="Effective from">
                    <Input placeholder="2026-03-10T00:00:00+08:00 or ISO timestamp" />
                  </Form.Item>
                  <Form.Item name="remark" label="Remark">
                    <Input.TextArea rows={3} placeholder="Optional activation note" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={activateMutation.isPending} icon={<CheckCircleOutlined />}>
                    Activate
                  </Button>
                </Form>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
