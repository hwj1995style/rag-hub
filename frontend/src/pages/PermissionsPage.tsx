import { DeleteOutlined, PlusOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Empty, Form, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bindPermissions, deletePermission, listPermissions, type PermissionListParams } from '../services/api/permissions';
import type { PermissionPolicyItem } from '../types/api';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime, isAdmin } from '../utils/format';

type PermissionFilterState = {
  resourceType?: string;
  resourceId?: string;
  subjectType?: string;
  subjectValue?: string;
  effect?: string;
};

const DEFAULT_RESOURCE_TYPE = 'document';
const DEFAULT_RESOURCE_ID = '11111111-1111-1111-1111-111111111111';

function normalizeValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parseSearchParams(searchParams: URLSearchParams): PermissionFilterState {
  return {
    resourceType: normalizeValue(searchParams.get('resourceType')),
    resourceId: normalizeValue(searchParams.get('resourceId')),
    subjectType: normalizeValue(searchParams.get('subjectType')),
    subjectValue: normalizeValue(searchParams.get('subjectValue')),
    effect: normalizeValue(searchParams.get('effect')),
  };
}

function canQuery(filters: PermissionFilterState) {
  return Boolean((filters.resourceType && filters.resourceId) || (filters.subjectType && filters.subjectValue));
}

function toSearchParams(filters: PermissionFilterState) {
  const params = new URLSearchParams();
  if (filters.resourceType) params.set('resourceType', filters.resourceType);
  if (filters.resourceId) params.set('resourceId', filters.resourceId);
  if (filters.subjectType) params.set('subjectType', filters.subjectType);
  if (filters.subjectValue) params.set('subjectValue', filters.subjectValue);
  if (filters.effect) params.set('effect', filters.effect);
  return params;
}

function getCardTitle(filters: PermissionFilterState) {
  if (filters.resourceType && filters.resourceId) {
    return `Current policies for ${filters.resourceType}:${filters.resourceId}`;
  }
  if (filters.subjectType && filters.subjectValue) {
    return `Policies for ${filters.subjectType}:${filters.subjectValue}`;
  }
  return 'Permission query results';
}

export function PermissionsPage() {
  const { message } = App.useApp();
  const roleCode = useAuthStore((state) => state.user?.roleCode);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PermissionFilterState>(() => parseSearchParams(searchParams));

  useEffect(() => {
    const nextFilters = parseSearchParams(searchParams);
    setCurrentFilters(nextFilters);
    form.setFieldsValue({
      resourceType: nextFilters.resourceType ?? DEFAULT_RESOURCE_TYPE,
      resourceId: nextFilters.resourceId ?? DEFAULT_RESOURCE_ID,
      subjectType: nextFilters.subjectType,
      subjectValue: nextFilters.subjectValue,
      effect: nextFilters.effect,
    });
  }, [form, searchParams]);

  const policyQuery = useQuery({
    queryKey: ['permissionPolicies', currentFilters],
    queryFn: () => listPermissions(currentFilters as PermissionListParams),
    enabled: canQuery(currentFilters),
  });

  const bindMutation = useMutation({
    mutationFn: bindPermissions,
    onSuccess: (data, variables) => {
      const text = `Stored ${data.policy_count} policies`;
      const nextFilters = {
        resourceType: variables.resourceType,
        resourceId: variables.resourceId,
        subjectType: normalizeValue(form.getFieldValue('subjectType')),
        subjectValue: normalizeValue(form.getFieldValue('subjectValue')),
        effect: normalizeValue(form.getFieldValue('effect')),
      };
      setSuccessMessage(text);
      setErrorMessage(null);
      setSearchParams(toSearchParams(nextFilters), { replace: false });
      void message.success(text);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      void message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePermission,
    onSuccess: () => {
      setSuccessMessage('Policy deleted');
      setErrorMessage(null);
      void policyQuery.refetch();
      void message.success('Policy deleted');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      void message.error(error.message);
    },
  });

  const activeTags = useMemo(() => {
    const tags: string[] = [];
    if (currentFilters.resourceType && currentFilters.resourceId) {
      tags.push(`resource=${currentFilters.resourceType}:${currentFilters.resourceId}`);
    }
    if (currentFilters.subjectType && currentFilters.subjectValue) {
      tags.push(`subject=${currentFilters.subjectType}:${currentFilters.subjectValue}`);
    }
    if (currentFilters.effect) {
      tags.push(`effect=${currentFilters.effect}`);
    }
    return tags;
  }, [currentFilters]);

  const columns: ColumnsType<PermissionPolicyItem> = [
    {
      title: 'Policy ID',
      dataIndex: 'policyId',
      key: 'policyId',
      render: (value: string) => <Typography.Text copyable>{value}</Typography.Text>,
    },
    {
      title: 'Resource',
      key: 'resource',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag>{record.resourceType}</Tag>
          <Typography.Text copyable>{record.resourceId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Subject type',
      dataIndex: 'subjectType',
      key: 'subjectType',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Subject value',
      dataIndex: 'subjectValue',
      key: 'subjectValue',
    },
    {
      title: 'Effect',
      dataIndex: 'effect',
      key: 'effect',
      render: (value: string) => <Tag color={value === 'deny' ? 'red' : 'green'}>{value}</Tag>,
    },
    {
      title: 'Created at',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          {currentFilters.subjectType && currentFilters.subjectValue && (
            <Link to={`/permissions?resourceType=${record.resourceType}&resourceId=${record.resourceId}`}>Open resource</Link>
          )}
          <Popconfirm
            title="Delete this policy?"
            description="This only removes the selected rule."
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => deleteMutation.mutate(record.policyId)}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending && deleteMutation.variables === record.policyId}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isAdmin(roleCode)) {
    return (
      <Card className="page-card">
        <Typography.Title level={4}>Permission denied</Typography.Title>
        <Typography.Text type="secondary">Please log in with an admin account.</Typography.Text>
      </Card>
    );
  }

  const handleLoadPolicies = async () => {
    const values = await form.validateFields(['resourceType', 'resourceId', 'subjectType', 'subjectValue', 'effect']);
    const nextFilters = {
      resourceType: normalizeValue(values.resourceType),
      resourceId: normalizeValue(values.resourceId),
      subjectType: normalizeValue(values.subjectType),
      subjectValue: normalizeValue(values.subjectValue),
      effect: normalizeValue(values.effect),
    };
    if (!canQuery(nextFilters)) {
      setSuccessMessage(null);
      setErrorMessage('Please provide a complete resource pair or a complete subject pair before loading policies.');
      return;
    }
    setSuccessMessage(null);
    setErrorMessage(null);
    setSearchParams(toSearchParams(nextFilters), { replace: false });
  };

  return (
    <div className="content-stack">
      {successMessage && (
        <Alert type="success" showIcon closable onClose={() => setSuccessMessage(null)} message={successMessage} />
      )}

      {errorMessage && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setErrorMessage(null)}
          message="Permission governance failed"
          description={errorMessage}
        />
      )}

      <Card className="page-card" title="Permission Binding" extra={<SafetyOutlined />}>
        <Typography.Paragraph type="secondary">
          Query document-level policies from a resource or subject view, then delete a single rule or replace the full policy set.
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            resourceType: DEFAULT_RESOURCE_TYPE,
            resourceId: DEFAULT_RESOURCE_ID,
            subjectType: undefined,
            subjectValue: undefined,
            effect: undefined,
            policies: [{ subjectType: 'role', subjectValue: 'admin', effect: 'allow' }],
          }}
          onFinish={(values) => {
            setSuccessMessage(null);
            setErrorMessage(null);
            bindMutation.mutate({
              resourceType: values.resourceType,
              resourceId: values.resourceId.trim(),
              policies: values.policies,
            });
          }}
        >
          <Space align="start" wrap style={{ width: '100%' }}>
            <Form.Item name="resourceType" label="Resource type" rules={[{ required: true }]}><Input data-testid="permission-filter-resource-type" style={{ width: 180 }} /></Form.Item>
              
            <Form.Item name="resourceId" label="Resource ID" rules={[{ required: true }]}><Input data-testid="permission-filter-resource-id" style={{ width: 360 }} /></Form.Item>
              
            <Form.Item name="subjectType" label="Subject type"><Select data-testid="permission-filter-subject-type" allowClear style={{ width: 180 }} options={[{ value: 'role' }, { value: 'department' }, { value: 'user' }]} /></Form.Item>
            <Form.Item name="subjectValue" label="Subject value"><Input data-testid="permission-filter-subject-value" style={{ width: 220 }} /></Form.Item>
            <Form.Item name="effect" label="Effect"><Select data-testid="permission-filter-effect" allowClear style={{ width: 160 }} options={[{ value: 'allow' }, { value: 'deny' }]} /></Form.Item>
            <Form.Item label=" " colon={false}>
              <Space wrap>
                <Button onClick={() => void handleLoadPolicies()} icon={<ReloadOutlined />}>
                  Load policies
                </Button>
                <Button onClick={() => void policyQuery.refetch()} loading={policyQuery.isFetching} disabled={!canQuery(currentFilters)}>
                  Refresh list
                </Button>
              </Space>
            </Form.Item>
          </Space>

          <Card size="small" title={getCardTitle(currentFilters)} style={{ marginBottom: 20 }}>
            {activeTags.length > 0 && (
              <Space wrap style={{ marginBottom: 16 }}>
                {activeTags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            )}
            {!canQuery(currentFilters) && (
              <Alert
                style={{ marginBottom: 16 }}
                type="info"
                showIcon
                message="Choose a resource pair or subject pair to load policies"
                description="Provide resourceType + resourceId, or subjectType + subjectValue. You can optionally add effect as a filter."
              />
            )}
            {policyQuery.error && (
              <Alert
                style={{ marginBottom: 16 }}
                type="error"
                showIcon
                message="Failed to load permission policies"
                description={policyQuery.error instanceof Error ? policyQuery.error.message : 'Request failed'}
              />
            )}
            <Table<PermissionPolicyItem>
              rowKey="policyId"
              loading={policyQuery.isLoading || policyQuery.isFetching}
              dataSource={policyQuery.data?.items ?? []}
              columns={columns}
              pagination={false}
              locale={{ emptyText: <Empty description="No permission policies matched the current filters." /> }}
            />
          </Card>

          <Form.List name="policies">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline" wrap>
                    <Form.Item {...field} name={[field.name, 'subjectType']} label="Subject type" rules={[{ required: true }]}> 
                      <Select
                        data-testid={`policy-row-subject-type-${index}`}
                        style={{ width: 160 }}
                        options={[{ value: 'role' }, { value: 'department' }, { value: 'user' }]}
                      />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'subjectValue']} label="Subject value" rules={[{ required: true }]}> 
                      <Input data-testid={`policy-row-subject-value-${index}`} style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'effect']} label="Effect" rules={[{ required: true }]}> 
                      <Select
                        data-testid={`policy-row-effect-${index}`}
                        style={{ width: 140 }}
                        options={[{ value: 'allow' }, { value: 'deny' }]}
                      />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ subjectType: 'role', effect: 'allow' })}>
                  Add policy
                </Button>
              </Space>
            )}
          </Form.List>
          <Button type="primary" htmlType="submit" loading={bindMutation.isPending} style={{ marginTop: 20 }}>
            Submit policy set
          </Button>
        </Form>
      </Card>
    </div>
  );
}
