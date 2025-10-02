import React, { useEffect, useState } from 'react';
import { Button, Table, Spin, Alert, Tag } from 'antd';
import commentHistoryService from '../services/comment-history-service';
import type { CommentHistoryListItem, PaginationParams } from '../types/database';

type HistoryRecord = CommentHistoryListItem;

export default function ManageHistoryTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    fetchHistories();
  }, []);

  async function fetchHistories() {
    setLoading(true);
    setError(null);
    try {
      const params: PaginationParams = { page: 1, limit: 20 };
      const res = await commentHistoryService.getCommentHistories(params);
      setData(res.histories || []);
    } catch (err: any) {
      console.error('fetchHistories', err);
      setError(err?.message || 'Failed to fetch histories');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', width: 200 },
    { title: 'Comment (preview)', dataIndex: 'comment_text', key: 'comment_text', render: (t: string) => <div style={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div> },
    { title: 'Total Links', dataIndex: 'total_links', key: 'total_links', width: 120 },
    { title: 'Estimated (s)', dataIndex: 'estimated_duration', key: 'estimated_duration', width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => {
      const color = s === 'completed' ? 'green' : s === 'failed' ? 'red' : s === 'running' ? 'blue' : 'default';
      return <Tag color={color}>{s}</Tag>;
    } },
    {
      title: 'Target URLs',
      dataIndex: 'target_urls',
      key: 'target_urls',
      render: (urls: string[]) => (
        <div style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {Array.isArray(urls) ? urls.join(', ') : String(urls)}
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={fetchHistories} type="primary" disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : (
        <Table rowKey={(r: any) => r.id || JSON.stringify(r)} dataSource={data} columns={columns} />
      )}
    </div>
  );
}
