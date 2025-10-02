"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Input, Typography, Spin, notification, Space } from 'antd';
import commentHistoryService from '../../../services/comment-history-service';
import uploadService from '../../../services/upload-service';
import type { CommentHistory } from '../../../types/database';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function HistoryDetailPage() {
  const params = useParams();
  const idParam = params?.id || params?.historyId;
  const historyId = Number(idParam);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CommentHistory | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    if (!historyId || Number.isNaN(historyId)) return;
    fetchHistory(historyId);
  }, [historyId]);

  async function fetchHistory(id: number) {
    setLoading(true);
    try {
      const res = await commentHistoryService.getCommentHistory(id);
      setHistory(res);
    } catch (err: any) {
      console.error('fetchHistory', err);
      notification.error({ message: 'Failed to load history', description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleRerun() {
    if (!history) return;
    setIsActioning(true);
    try {
      // Create a new history record as rerun or update existing to pending/running
      const payload = {
        status: 'running'
      };
      await commentHistoryService.updateCommentHistory(history.id, payload as any);
      notification.success({ message: 'Rerun requested' });
      // Optionally trigger backend start; skipping because API to start from history may differ
    } catch (err: any) {
      console.error('rerun', err);
      notification.error({ message: 'Failed to request rerun', description: err?.message || String(err) });
    } finally {
      setIsActioning(false);
      fetchHistory(historyId);
    }
  }

  async function handleStop() {
    if (!history) return;
    setIsActioning(true);
    try {
      // If backend processId exists in history, attempt to stop it via uploadService
      // Here we assume history may contain a backend_process_id field — adapt if different
      const processId = (history as any).backend_process_id || (history as any).processId;
      if (processId) {
        await uploadService.stopProcess(processId);
        notification.success({ message: 'Stop requested' });
      } else {
        // Fallback: mark as cancelled
        await commentHistoryService.updateCommentHistory(history.id, { status: 'cancelled' } as any);
        notification.info({ message: 'History marked cancelled' });
      }
    } catch (err: any) {
      console.error('stop', err);
      notification.error({ message: 'Failed to stop', description: err?.message || String(err) });
    } finally {
      setIsActioning(false);
      fetchHistory(historyId);
    }
  }

  if (!historyId || Number.isNaN(historyId)) {
    return <Card><Text>Invalid history id</Text></Card>;
  }

  return (
    <div className="p-6">
      <Card>
        <Title level={3}>History #{historyId}</Title>

        {loading || !history ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label>ID</label>
              <Input value={history.id} disabled />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>Created At</label>
              <Input value={history.created_at} disabled />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>Comment</label>
              <TextArea value={history.comment_text} rows={6} disabled />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>Target URLs</label>
              <TextArea value={history.target_urls} rows={4} disabled />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>Cookie File Path</label>
              <Input value={history.cookie_file_path || ''} disabled />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>Status</label>
              <Input value={history.status} disabled />
            </div>

            <Space>
              <Button type="primary" onClick={handleRerun} loading={isActioning}>Rerun</Button>
              <Button danger onClick={handleStop} loading={isActioning}>Stop</Button>
              <Button onClick={() => fetchHistory(historyId)}>Refresh</Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
}
