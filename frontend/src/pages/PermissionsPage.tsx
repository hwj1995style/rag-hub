import { DeleteOutlined, PlusOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Empty, Form, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { bindPermissions, deletePermission, listPermissions } from '../services/api/permissions';
import type { PermissionPolicyItem } from '../types/api';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime, isAdmin } from '../utils/format';

type ResourceTarget = {
  resourceType: string;
  resourceId: string;
};

export function PermissionsPage() {
  const { message } = App.useApp();
  const roleCode = useAuthStore((state) => state.user?.roleCode);
  const [form] = Form.useForm();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTarget, setCurrentTarget] = useState<ResourceTarget>({
    resourceType: 'document',
    resourceId: '11111111-1111-1111-1111-111111111111',
  });

  const policyQuery = useQuery({
    queryKey: ['permissionPolicies', currentTarget.resourceType, currentTarget.resourceId],
    queryFn: () => listPermissions(currentTarget),
    enabled: Boolean(currentTarget.resourceType && currentTarget.resourceId),
  });

  const bindMutation = useMutation({
    mutationFn: bindPermissions,
    onSuccess: (data, variables) => {
      const text = `Stored ${data.policy_count} policies`;
      setSuccessMessage(text);
      setErrorMessage(null);
      setCurrentTarget({ resourceType: variables.resourceType, resourceId: variables.resourceId });
      void policyQuery.refetch();
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

  const columns: ColumnsType<PermissionPolicyItem> = [
    {
      title: 'Policy ID',
      dataIndex: 'policyId',
      key: 'policyId',
      render: (value: string) => <Typography.Text copyable>{value}</Typography.Text>,
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
    const values = await form.validateFields(['resourceType', 'resourceId']);
    setSuccessMessage(null);
    setErrorMessage(null);
    setCurrentTarget({
      resourceType: values.resourceType,
      resourceId: values.resourceId.trim(),
    });
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
          Manage document-level policies by loading the current rules for a resource, deleting a single policy, or replacing the full policy set.
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            resourceType: 'document',
            resourceId: '11111111-1111-1111-1111-111111111111',
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
            <Form.Item name="resourceType" label="Resource type" rules={[{ required: true }]}>
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="resourceId" label="Resource ID" rules={[{ required: true }]}>
              <Input style={{ width: 360 }} />
            </Form.Item>
            <Form.Item label=" " colon={false}>
              <Space wrap>
                <Button onClick={() => void handleLoadPolicies()} icon={<ReloadOutlined />}>
                  Load policies
                </Button>
                <Button onClick={() => void policyQuery.refetch()} loading={policyQuery.isFetching}>
                  Refresh list
                </Button>
              </Space>
            </Form.Item>
          </Space>

          <Card
            size="small"
            title={`Current policies for ${currentTarget.resourceType}:${currentTarget.resourceId}`}
            style={{ marginBottom: 20 }}
          >
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
              locale={{ emptyText: <Empty description="No policies are currently bound to this resource." /> }}
            />
          </Card>

          <Form.List name="policies">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap>
                    <Form.Item {...field} name={[field.name, 'subjectType']} label="Subject type" rules={[{ required: true }]}>
                      <Select style={{ width: 160 }} options={[{ value: 'role' }, { value: 'department' }, { value: 'user' }]} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'subjectValue']} label="Subject value" rules={[{ required: true }]}>
                      <Input style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'effect']} label="Effect" rules={[{ required: true }]}>
                      <Select style={{ width: 140 }} options={[{ value: 'allow' }, { value: 'deny' }]} />
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