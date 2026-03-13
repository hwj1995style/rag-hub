import { Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Card className="page-card">
      <Typography.Title level={3}>{t('notFound.title')}</Typography.Title>
      <Typography.Paragraph type="secondary">{t('notFound.description')}</Typography.Paragraph>
      <Button type="primary" onClick={() => navigate('/documents')}>
        {t('notFound.back')}
      </Button>
    </Card>
  );
}
