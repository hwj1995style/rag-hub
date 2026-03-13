import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Input, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { getDocumentChunks } from '../services/api/documents';

export function DocumentChunksPage() {
  const { documentId = '' } = useParams();
  const { t } = useI18n();
  const [pageNo, setPageNo] = useState('');
  const [chunkType, setChunkType] = useState('');

  const query = useQuery({
    queryKey: ['documentChunks', documentId, pageNo, chunkType],
    queryFn: () =>
      getDocumentChunks(documentId, {
        page_no: pageNo ? Number(pageNo) : undefined,
        chunk_type: chunkType || undefined,
        page_size: 50,
        page_no_num: 1,
      }),
    enabled: Boolean(documentId),
  });

  const queryError = query.error instanceof Error ? query.error.message : null;

  return (
    <div className="content-stack">
      <Card className="page-card" title={t('chunks.title')}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input placeholder={t('chunks.pageNoPlaceholder')} value={pageNo} onChange={(event) => setPageNo(event.target.value)} style={{ width: 160 }} />
          <Input placeholder={t('chunks.typePlaceholder')} value={chunkType} onChange={(event) => setChunkType(event.target.value)} style={{ width: 180 }} />
          <Button onClick={() => void query.refetch()}>{t('common.refresh')}</Button>
        </Space>
        <Typography.Paragraph type="secondary">{t('chunks.documentId', { value: documentId })}</Typography.Paragraph>

        {queryError && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={t('chunks.loadFailed')}
            description={queryError}
          />
        )}

        <Table
          rowKey="chunkId"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          pagination={false}
          columns={[
            { title: t('common.chunkNo'), dataIndex: 'chunkNo', key: 'chunkNo', width: 90 },
            { title: t('common.chunkType'), dataIndex: 'chunkType', key: 'chunkType', width: 120 },
            { title: t('common.titlePath'), dataIndex: 'titlePath', key: 'titlePath' },
            { title: t('common.locator'), dataIndex: 'locator', key: 'locator', width: 120 },
            { title: t('common.summary'), dataIndex: 'contentSummary', key: 'contentSummary' },
            { title: t('common.content'), dataIndex: 'contentText', key: 'contentText' },
          ]}
        />
      </Card>
    </div>
  );
}
