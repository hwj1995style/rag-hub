import { PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Card, Form, Input, Select, Space, Typography } from 'antd';
import { useState } from 'react';
import { bindPermissions } from '../services/api/permissions';
import { useAuthStore } from '../stores/authStore';
import { isAdmin } from '../utils/format';

export function PermissionsPage() {
  const { message } = App.useApp();
  const roleCode = useAuthStore((state) => state.user?.roleCode);
  const [form] = Form.useForm();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: bindPermissions,
    onSuccess: (data) => {
      const text = `Stored ${data.policy_count} policies`;
      setSuccessMessage(text);
      void message.success(text);
    },
    onError: (error: Error) => void message.error(error.message),
  });

  if (!isAdmin(roleCode)) {
    return (
      <Card className="page-card">
        <Typography.Title level={4}>Permission denied</Typography.Title>
        <Typography.Text type="secondary">Please log in with an admin account.</Typography.Text>
      </Card>
    );
  }

  return (
    <div className="content-stack">
      {successMessage && (
        <Alert
          type="success"
          showIcon
          closable
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
        />
      )}

      <Card className="page-card" title="Permission Binding" extra={<SafetyOutlined />}>
        <Typography.Paragraph type="secondary">
          Resource-level policy enforcement is not wired into retrieval yet, so this page currently focuses on writing policies through POST /api/permissions/bind.
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
            mutation.mutate(values);
          }}
        >
          <Form.Item name="resourceType" label="Resource type" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="resourceId" label="Resource ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
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
                    <Button danger onClick={() => remove(field.name)}>Remove</Button>
                  </Space>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ subjectType: 'role', effect: 'allow' })}>
                  Add policy
                </Button>
              </Space>
            )}
          </Form.List>
          <Button type="primary" htmlType="submit" loading={mutation.isPending} style={{ marginTop: 20 }}>
            Submit
          </Button>
        </Form>
      </Card>
    </div>
  );
}