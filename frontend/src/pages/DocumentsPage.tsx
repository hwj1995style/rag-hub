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
      title: 'Title',
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
      title: 'Domain',
      dataIndex: 'bizDomain',
      key: 'bizDomain',
      render: (value: string) => <Tag>{value || 'n/a'}</Tag>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (value: string) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: 'Version',
      dataIndex: 'currentVersionId',
      key: 'currentVersionId',
      render: (value: string) => <Typography.Text code>{value || '-'}</Typography.Text>,
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: unknown, record: DocumentListItem) => (
        <Space wrap>
          <Link to={`/documents/${record.documentId}`}>Detail</Link>
          <Link to={`/documents/${record.documentId}/chunks`}>Chunks</Link>
          <Link to={`/tasks?documentId=${record.documentId}`}>Related tasks</Link>
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
              Documents
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              This screen wires into list, detail, chunk, upload, batch-import, and task follow-up flows from the current backend.
            </Typography.Paragraph>
          </Col>
          <Col xs={24} lg={12}>
            <div className="metric-grid">
              <div className="metric-card"><Statistic title="Total" value={query.data?.total ?? 0} /></div>
              <div className="metric-card"><Statistic title="Active" value={activeCount} /></div>
              <div className="metric-card"><Statistic title="Role" value={roleCode ?? '-'} /></div>
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
          message={actionState.type === 'upload' ? 'Upload request submitted' : 'Batch import request submitted'}
          description={
            actionState.type === 'upload' ? (
              <Space wrap>
                <Typography.Text>document: {actionState.payload.document_id}</Typography.Text>
                <Typography.Text>version: {actionState.payload.version_id}</Typography.Text>
                <Link to={`/documents/${actionState.payload.document_id}`}>Open document</Link>
                <Link to={`/tasks/${actionState.payload.task_id}`}>Open task {actionState.payload.task_id}</Link>
              </Space>
            ) : (
              <Space wrap>
                <Typography.Text>batch: {actionState.payload.batch_id}</Typography.Text>
                <Typography.Text>accepted: {actionState.payload.accepted_count}</Typography.Text>
                <Typography.Text>tasks: {actionState.payload.task_count}</Typography.Text>
                <Typography.Text>source: {actionState.payload.source_uri}</Typography.Text>
                <Link to="/tasks">Open task center</Link>
                {actionState.payload.task_ids[0] && (
                  <Link to={`/tasks/${actionState.payload.task_ids[0]}`}>Open task {actionState.payload.task_ids[0]}</Link>
                )}
              </Space>
            )
          }
        />
      )}

      {uploadError && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setUploadError(null)}
          message="Upload failed"
          description={uploadError}
        />
      )}

      {batchError && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setBatchError(null)}
          message="Batch import failed"
          description={batchError}
        />
      )}

      <Card className="page-card">
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Input.Search
            placeholder="Search by title"
            allowClear
            style={{ maxWidth: 320 }}
            value={keyword}
            enterButton="Search"
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setKeyword(value.trim())}
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>
              Refresh
            </Button>
            <Link to="/tasks">Open task center</Link>
            {isAdmin(roleCode) && (
              <>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => {
                    setUploadError(null);
                    setUploadOpen(true);
                  }}
                >
                  Upload
                </Button>
                <Button
                  icon={<InboxOutlined />}
                  onClick={() => {
                    setBatchError(null);
                    setBatchOpen(true);
                  }}
                >
                  Batch import
                </Button>
              </>
            )}
          </Space>
        </Space>

        <Table
          rowKey="documentId"
          style={{ marginTop: 20 }}
          loading={query.isLoading}
          columns={columns}
          dataSource={items}
          pagination={false}
        />
      </Card>

      <Modal
        title="Upload document"
        open={uploadOpen}
        onCancel={() => {
          setUploadError(null);
          setUploadOpen(false);
        }}
        onOk={() => uploadForm.submit()}
        confirmLoading={uploadMutation.isPending}
        okText="Submit upload"
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
              void message.error('Please choose a file');
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
          <Form.Item
            name="file"
            label="File"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList}
            rules={[{ required: true, message: 'Please choose a file' }]}
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<CloudUploadOutlined />}>Choose file</Button>
            </Upload>
          </Form.Item>
          {uploadFileList.length > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Selected: ${uploadFileList[0].name}`}
              description={`Size: ${uploadFileList[0].size ?? 0} bytes`}
            />
          )}
          <Form.Item name="title" label="Title"><Input /></Form.Item>
          <Form.Item name="bizDomain" label="Domain"><Input /></Form.Item>
          <Form.Item name="department" label="Department"><Input /></Form.Item>
          <Form.Item name="securityLevel" label="Security level"><Input placeholder="internal" /></Form.Item>
          <Form.Item name="sourceSystem" label="Source system"><Input placeholder="crm / shared-drive / s3" /></Form.Item>
          <Form.Item name="owner" label="Owner"><Input placeholder="alice" /></Form.Item>
          <Form.Item name="permissionTags" label="Permission tags"><Input placeholder="finance,internal" /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Batch import"
        open={batchOpen}
        onCancel={() => {
          setBatchError(null);
          setBatchOpen(false);
        }}
        onOk={() => batchForm.submit()}
        confirmLoading={batchMutation.isPending}
        okText="Submit import"
      >
        <Form
          form={batchForm}
          layout="vertical"
          initialValues={{ sourceType: 's3', securityLevel: 'internal' }}
          onFinish={(values) => {
            setBatchError(null);
            batchMutation.mutate(values);
          }}
        >
          <Form.Item name="sourceType" label="Source type" rules={[{ required: true }]}>
            <Input placeholder="s3" />
          </Form.Item>
          <Form.Item name="sourceUri" label="Source URI" rules={[{ required: true }]}>
            <Input placeholder="s3://bucket/path" />
          </Form.Item>
          <Form.Item name="bizDomain" label="Domain"><Input /></Form.Item>
          <Form.Item name="department" label="Department"><Input /></Form.Item>
          <Form.Item name="securityLevel" label="Security level"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}