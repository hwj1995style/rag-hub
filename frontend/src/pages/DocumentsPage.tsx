import { CloudUploadOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { batchImportDocuments, listDocuments, uploadDocument } from '../services/api/documents';
import { useAuthStore } from '../stores/authStore';
import type { BatchImportResponse, DocumentListItem, UploadResponse } from '../types/api';
import { formatDateTime, isAdmin } from '../utils/format';

type AdminActionState =
  | { type: 'upload'; payload: UploadResponse }
  | { type: 'batch'; payload: BatchImportResponse }
  | null;

export function DocumentsPage() {
  const { message } = App.useApp();
  const { t } = useI18n();
  const roleCode = useAuthStore((state) => state.user?.roleCode);
  const [keyword, setKeyword] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [actionState, setActionState] = useState<AdminActionState>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [uploadForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const query = useQuery({
    queryKey: ['documents', keyword],
    queryFn: () => listDocuments({ keyword: keyword || undefined, page_no: 1, page_size: 20 }),
  });

  const uploadMutation = useMutation({
    mutationFn: (payload: FormData) => uploadDocument(payload),
    onSuccess: (data) => {
      setActionState({ type: 'upload', payload: data });
      setUploadError(null);
      void message.success(`Upload accepted. Task ${data.task_id}`);
      setUploadOpen(false);
      uploadForm.resetFields();
      void query.refetch();
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      void message.error(error.message);
    },
  });

  const batchMutation = useMutation({
    mutationFn: batchImportDocuments,
    onSuccess: (data) => {
      setActionState({ type: 'batch', payload: data });
      setBatchError(null);
      void message.success(`Batch import accepted. Batch ${data.batch_id}`);
      setBatchOpen(false);
      batchForm.resetFields();
    },
    onError: (error: Error) => {
      setBatchError(error.message);
      void message.error(error.message);
    },
  });

  const items = query.data?.items ?? [];
  const activeCount = useMemo(() => items.filter((item) => item.status === 'active').length, [items]);

  const columns = [
    {
      title: t('documents.titleLabel'),
      dataIndex: 'title',
      key: 'title',
      render: (_: unknown, record: DocumentListItem) => (
        <Space direction="vertical" size={2}>
          <Link to={`/documents/${record.documentId}`}>{record.title}</Link>
          <Typography.Text type="secondary">{record.documentId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('documents.domain'),
      dataIndex: 'bizDomain',
      key: 'bizDomain',
      render: (value: string) => <Tag>{value || 'n/a'}</Tag>,
    },
    {
      title: t('documents.department'),
      dataIndex: 'department',
      key: 'department',
      render: (value: string) => value || '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: t('common.version'),
      dataIndex: 'currentVersionId',
      key: 'currentVersionId',
      render: (value: string) => <Typography.Text code>{value || '-'}</Typography.Text>,
    },
    {
      title: t('common.updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: unknown, record: DocumentListItem) => (
        <Space wrap>
          <Link to={`/documents/${record.documentId}`}>{t('documents.detail')}</Link>
          <Link to={`/documents/${record.documentId}/chunks`}>{t('documents.chunks')}</Link>
          <Link to={`/tasks?documentId=${record.documentId}`}>{t('documents.relatedTasks')}</Link>
          {isAdmin(roleCode) && (
            <Link to={`/permissions?resourceType=document&resourceId=${record.documentId}`}>{t('documents.permissions')}</Link>
          )}
        </Space>
      ),
    },
  ];

  const uploadFileList = (Form.useWatch('file', uploadForm) as UploadFile[] | undefined) ?? [];

  return (
    <div className="content-stack">
      <Card className="page-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={12}>
            <Typography.Title level={3} style={{ marginTop: 0 }}>
              {t('documents.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('documents.subtitle')}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} lg={12}>
            <div className="metric-grid">
              <div className="metric-card"><Statistic title={t('documents.totalStat')} value={query.data?.total ?? 0} /></div>
              <div className="metric-card"><Statistic title={t('documents.activeStat')} value={activeCount} /></div>
              <div className="metric-card"><Statistic title={t('documents.roleStat')} value={roleCode ?? '-'} /></div>
            </div>
          </Col>
        </Row>
      </Card>

      {actionState && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setActionState(null)}
          message={actionState.type === 'upload' ? t('documents.uploadSubmitted') : t('documents.batchSubmitted')}
          description={
            actionState.type === 'upload' ? (
              <Space wrap>
                <Typography.Text>{t('documents.documentId', { value: actionState.payload.document_id })}</Typography.Text>
                <Typography.Text>{t('documents.versionId', { value: actionState.payload.version_id })}</Typography.Text>
                <Link to={`/documents/${actionState.payload.document_id}`}>{t('documents.openDocument')}</Link>
                <Link to={`/tasks/${actionState.payload.task_id}`}>{t('documents.openTask', { value: actionState.payload.task_id })}</Link>
                <Link to={`/tasks?documentId=${actionState.payload.document_id}`}>{t('documents.openRelatedTasks')}</Link>
              </Space>
            ) : (
              <Space wrap>
                <Typography.Text>{t('documents.batchId', { value: actionState.payload.batch_id })}</Typography.Text>
                <Typography.Text>{t('documents.acceptedCount', { value: actionState.payload.accepted_count })}</Typography.Text>
                <Typography.Text>{t('documents.taskCount', { value: actionState.payload.task_count })}</Typography.Text>
                <Typography.Text>{t('documents.sourceText', { value: actionState.payload.source_uri })}</Typography.Text>
                <Link to="/tasks?taskType=batch_import">{t('documents.openBatchTasks')}</Link>
                <Link to={`/tasks?taskType=batch_import&sourceKeyword=${encodeURIComponent(actionState.payload.source_uri)}`}>
                  {t('documents.openSameSourceTasks')}
                </Link>
                {actionState.payload.task_ids[0] && (
                  <Link to={`/tasks/${actionState.payload.task_ids[0]}`}>{t('documents.openTask', { value: actionState.payload.task_ids[0] })}</Link>
                )}
              </Space>
            )
          }
        />
      )}

      {uploadError && (
        <Alert type="error" showIcon closable onClose={() => setUploadError(null)} message={t('documents.uploadFailed')} description={uploadError} />
      )}

      {batchError && (
        <Alert type="error" showIcon closable onClose={() => setBatchError(null)} message={t('documents.batchFailed')} description={batchError} />
      )}

      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Input.Search
            placeholder={t('documents.searchPlaceholder')}
            allowClear
            style={{ maxWidth: 320 }}
            value={keyword}
            enterButton={t('common.search')}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setKeyword(value.trim())}
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              {t('common.refresh')}
            </Button>
            <Link to="/tasks">{t('documents.openTaskCenter')}</Link>
            {isAdmin(roleCode) && (
              <>
                <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => { setUploadError(null); setUploadOpen(true); }}>
                  {t('documents.upload')}
                </Button>
                <Button icon={<InboxOutlined />} onClick={() => { setBatchError(null); setBatchOpen(true); }}>
                  {t('documents.batchImport')}
                </Button>
              </>
            )}
          </Space>
        </Space>

        <Table rowKey="documentId" style={{ marginTop: 20 }} loading={query.isLoading} columns={columns} dataSource={items} pagination={false} />
      </Card>

      <Modal
        title={t('documents.uploadTitle')}
        open={uploadOpen}
        onCancel={() => { setUploadError(null); setUploadOpen(false); }}
        onOk={() => uploadForm.submit()}
        confirmLoading={uploadMutation.isPending}
        okText={t('documents.submitUpload')}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          initialValues={{ securityLevel: 'internal' }}
          onFinish={(values) => {
            setUploadError(null);
            const formData = new FormData();
            const file = (values.file as UploadFile[] | undefined)?.[0]?.originFileObj;
            if (!file) {
              void message.error(t('documents.pleaseChooseFile'));
              return;
            }
            if ((file.size ?? 0) <= 0) {
              setUploadError('uploaded file must not be empty');
              void message.error('uploaded file must not be empty');
              return;
            }
            formData.append('file', file);
            if (values.title) formData.append('title', values.title);
            if (values.bizDomain) formData.append('biz_domain', values.bizDomain);
            if (values.department) formData.append('department', values.department);
            if (values.securityLevel) formData.append('security_level', values.securityLevel);
            if (values.sourceSystem) formData.append('source_system', values.sourceSystem);
            if (values.owner) formData.append('owner', values.owner);
            if (values.permissionTags) formData.append('permission_tags', values.permissionTags);
            uploadMutation.mutate(formData);
          }}
        >
          <Form.Item name="file" label={t('documents.file')} valuePropName="fileList" getValueFromEvent={(event) => event?.fileList} rules={[{ required: true, message: t('documents.pleaseChooseFile') }]}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<CloudUploadOutlined />}>{t('documents.chooseFile')}</Button>
            </Upload>
          </Form.Item>
          {uploadFileList.length > 0 && (
            <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('documents.selected', { name: uploadFileList[0].name })} description={t('documents.size', { size: uploadFileList[0].size ?? 0 })} />
          )}
          <Form.Item name="title" label={t('documents.titleLabel')}><Input /></Form.Item>
          <Form.Item name="bizDomain" label={t('documents.domain')}><Input /></Form.Item>
          <Form.Item name="department" label={t('documents.department')}><Input /></Form.Item>
          <Form.Item name="securityLevel" label={t('documents.securityLevel')}><Input placeholder="internal" /></Form.Item>
          <Form.Item name="sourceSystem" label={t('documents.sourceSystem')}><Input placeholder="crm / shared-drive / s3" /></Form.Item>
          <Form.Item name="owner" label={t('documents.owner')}><Input placeholder="alice" /></Form.Item>
          <Form.Item name="permissionTags" label={t('documents.permissionTags')}><Input placeholder="finance,internal" /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('documents.batchTitle')}
        open={batchOpen}
        onCancel={() => { setBatchError(null); setBatchOpen(false); }}
        onOk={() => batchForm.submit()}
        confirmLoading={batchMutation.isPending}
        okText={t('documents.submitImport')}
      >
        <Form form={batchForm} layout="vertical" initialValues={{ sourceType: 's3', securityLevel: 'internal' }} onFinish={(values) => { setBatchError(null); batchMutation.mutate(values); }}>
          <Form.Item name="sourceType" label={t('documents.sourceType')} rules={[{ required: true }]}><Input placeholder="s3" /></Form.Item>
          <Form.Item name="sourceUri" label={t('documents.sourceUri')} rules={[{ required: true }]}><Input placeholder="s3://bucket/path" /></Form.Item>
          <Form.Item name="bizDomain" label={t('documents.domain')}><Input /></Form.Item>
          <Form.Item name="department" label={t('documents.department')}><Input /></Form.Item>
          <Form.Item name="securityLevel" label={t('documents.securityLevel')}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
