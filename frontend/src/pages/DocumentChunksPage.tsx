import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Input, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocumentChunks } from '../services/api/documents';

export function DocumentChunksPage() {
  const { documentId = '' } = useParams();
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
      <Card className="page-card" title="Chunk Browser">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input placeholder="Filter by page no" value={pageNo} onChange={(event) => setPageNo(event.target.value)} style={{ width: 160 }} />
          <Input placeholder="Filter by chunk type" value={chunkType} onChange={(event) => setChunkType(event.target.value)} style={{ width: 180 }} />
          <Button onClick={() => void query.refetch()}>Refresh</Button>
        </Space>
        <Typography.Paragraph type="secondary">Document ID: {documentId}</Typography.Paragraph>

        {queryError && (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message="Failed to load document chunks"
            description={queryError}
          />
        )}

        <Table
          rowKey="chunkId"
          loading={query.isLoading}
          dataSource={query.data?.items ?? []}
          pagination={false}
          columns={[
            { title: 'ChunkNo', dataIndex: 'chunkNo', key: 'chunkNo', width: 90 },
            { title: 'Type', dataIndex: 'chunkType', key: 'chunkType', width: 120 },
            { title: 'TitlePath', dataIndex: 'titlePath', key: 'titlePath' },
            { title: 'Locator', dataIndex: 'locator', key: 'locator', width: 120 },
            { title: 'Summary', dataIndex: 'contentSummary', key: 'contentSummary' },
            { title: 'Content', dataIndex: 'contentText', key: 'contentText' },
          ]}
        />
      </Card>
    </div>
  );
}