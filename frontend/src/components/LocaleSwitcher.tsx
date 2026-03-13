import { GlobalOutlined } from '@ant-design/icons';
import { Segmented, Space, Typography } from 'antd';
import { useI18n } from '../i18n/useI18n';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Space size="small" align="center">
      <GlobalOutlined style={{ color: 'inherit' }} />
      <Typography.Text style={{ color: 'inherit' }}>{t('common.language')}</Typography.Text>
      <Segmented
        size="small"
        value={locale}
        onChange={(value) => setLocale(value as 'en' | 'zh-CN')}
        options={[
          { label: t('common.english'), value: 'en' },
          { label: t('common.chinese'), value: 'zh-CN' },
        ]}
      />
    </Space>
  );
}
