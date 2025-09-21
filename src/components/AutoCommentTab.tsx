"use client";

import React, { useState } from "react";
import { Button, Input, Upload, Tag, Space, notification, Card, Progress, Typography, Alert } from "antd";
import { UploadOutlined, ClockCircleOutlined } from "@ant-design/icons";
import uploadService, { type UploadResponse } from "../services/upload-service";
import UserWelcomeCard from "./UserWelcomeCard";

const { TextArea } = Input;
const { Text } = Typography;

export default function AutoCommentTab() {
  const [links, setLinks] = useState<string[]>([]);
  const [linksText, setLinksText] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookiesFileName, setCookiesFileName] = useState<string | null>(null);
  const [cookiesContent, setCookiesContent] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResponse | null>(null);

  const urlRegex = /https?:\/\/[\w\-@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([\w\-@:%_\+.~#?&//=]*)/i;

  // Time estimation constants
  const AVERAGE_TIME_PER_COMMENT = 15; // seconds per comment
  const DELAY_BETWEEN_COMMENTS = 3; // seconds delay between comments

  // Function to calculate estimated time
  const calculateEstimatedTime = (linkCount: number) => {
    const totalTimeInSeconds = (linkCount * AVERAGE_TIME_PER_COMMENT) + ((linkCount - 1) * DELAY_BETWEEN_COMMENTS);
    return totalTimeInSeconds;
  };

  // Function to format time duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes} minutes ${remainingSeconds} seconds`
        : `${minutes} minutes`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0
        ? `${hours} hours ${remainingMinutes} minutes`
        : `${hours} hours`;
    }
  };

  // Function to get estimated completion time
  const getEstimatedCompletionTime = (estimatedSeconds: number) => {
    const now = new Date();
    const completionTime = new Date(now.getTime() + estimatedSeconds * 1000);
    return completionTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const parseLinksFromText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return Array.from(new Set(lines));
  };

  const addLinksFromText = () => {
    const parsed = parseLinksFromText(linksText);
    const valid = parsed.filter((l) => urlRegex.test(l));
    const invalid = parsed.filter((l) => !urlRegex.test(l));
    if (invalid.length) {
      notification.warning({
        message: `Ignored ${invalid.length} invalid link(s)`,
      });
    }
    setLinks((prev) => Array.from(new Set([...prev, ...valid])));
    setLinksText("");
  };

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      const parsed = parseLinksFromText(text);
      const valid = parsed.filter((l) => urlRegex.test(l));
      const invalid = parsed.filter((l) => !urlRegex.test(l));
      if (invalid.length) {
        notification.warning({
          message: `Ignored ${invalid.length} invalid link(s) from file`,
        });
      }
      setLinks((prev) => Array.from(new Set([...prev, ...valid])));
      notification.success({
        message: `Added ${valid.length} link(s) from file`,
      });
    };
    reader.readAsText(file);
    return false;
  };

  const beforeUploadCookies = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      setCookiesFileName(file.name);
      setCookiesContent(text);
      notification.success({ message: `Loaded cookies file: ${file.name}` });
    };
    reader.readAsText(file);
    return false;
  };

  const removeCookies = () => {
    setCookiesFileName(null);
    setCookiesContent(null);
    notification.info({ message: "Removed cookies file" });
  };

  const removeLink = (link: string) => {
    setLinks((prev) => prev.filter((l) => l !== link));
  };

  const handleStart = async () => {
    if (links.length === 0) {
      notification.error({ message: "Please add at least one link." });
      return;
    }
    if (!comment.trim()) {
      notification.error({ message: "Please enter a comment." });
      return;
    }

    // Calculate estimated time
    const estimatedSeconds = calculateEstimatedTime(links.length);
    const estimatedDuration = formatDuration(estimatedSeconds);
    const estimatedCompletionTime = getEstimatedCompletionTime(estimatedSeconds);

    setLoading(true);
    setUploadResults(null);

    try {
      // Show detailed estimation notification
      notification.info({
        message: `🚀 Auto-comment process started!`,
        description: (
          <div>
            <div>📊 Processing {links.length} link(s)</div>
            <div>⏱️ Estimated duration: <strong>{estimatedDuration}</strong></div>
            <div>🎯 Expected completion: <strong>{estimatedCompletionTime}</strong></div>
            <div className="text-xs text-gray-500 mt-1">
              * Based on ~{AVERAGE_TIME_PER_COMMENT}s per comment + {DELAY_BETWEEN_COMMENTS}s delays
            </div>
          </div>
        ),
        duration: 8,
        placement: 'topRight',
      });

      const results = await uploadService.uploadComment(
        comment,
        links,
        cookiesContent,
        cookiesFileName,
        {
          delay: DELAY_BETWEEN_COMMENTS * 1000, // Convert to milliseconds
          headless: true,
          timeout: 30000,
          debug: false,
        }
      );

      setUploadResults(results);

      notification.success({
        message: "✅ Auto-comment process completed!",
        description: `${results.statistics.successful}/${results.statistics.total} comments posted successfully (${results.statistics.successRate})`,
        duration: 10,
      });

      const failedResults = results.results.filter(r => !r.success);
      if (failedResults.length > 0) {
        failedResults.forEach((result, index) => {
          if (index < 3) {
            notification.error({
              message: `❌ Failed to comment on ${result.url}`,
              description: result.message || result.error,
              duration: 8,
            });
          }
        });
        
        if (failedResults.length > 3) {
          notification.warning({
            message: `⚠️ ${failedResults.length - 3} more comments failed`,
            description: "Check the results section below for details",
            duration: 5,
          });
        }
      }

    } catch (error) {
      console.error('Upload error:', error);
      notification.error({
        message: "❌ Failed to start auto-comment process",
        description: error instanceof Error ? error.message : String(error),
        duration: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <UserWelcomeCard />
      <Card>
        <div className="mb-4 flex flex-col gap-4">
          <label className="block mb-2 font-medium text-gray-700">Facebook Links (one per line)</label>
          <TextArea
            rows={6}
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            placeholder="https://facebook.com/post/123456789&#10;https://facebook.com/post/987654321"
            className="mb-2"
          />
          <Space>
            <Button onClick={addLinksFromText} type="primary">
              Add Links
            </Button>
            <Upload beforeUpload={beforeUpload} showUploadList={false} accept=".txt">
              <Button icon={<UploadOutlined />}>Upload .txt File</Button>
            </Upload>
          </Space>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Links Preview ({links.length} links)</label>
          <div className="min-h-[100px] max-h-[200px] overflow-y-auto border border-gray-200 rounded p-3">
            <Space wrap>
              {links.length === 0 && (
                <span className="text-gray-400 italic">No links added yet</span>
              )}
              {links.map((link, index) => (
                <Tag key={index} closable onClose={() => removeLink(link)} className="mb-1">
                  <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline max-w-[300px] truncate">
                    {link}
                  </a>
                </Tag>
              ))}
            </Space>
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Comment Content</label>
          <TextArea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter the comment text that will be posted to each Facebook post..."
            showCount
            maxLength={8000}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">Authentication (Facebook Cookies)</label>
          <Space direction="vertical" className="w-full">
            <Upload beforeUpload={beforeUploadCookies} showUploadList={false} accept=".txt,.json">
              <Button icon={<UploadOutlined />} type="dashed">
                Upload Cookies File
              </Button>
            </Upload>
            <div>
              {cookiesFileName ? (
                <Tag closable onClose={removeCookies} color="success" className="flex items-center">
                  ✓ {cookiesFileName}
                </Tag>
              ) : (
                <Text type="secondary" className="text-sm">
                  No cookies file loaded - required for Facebook authentication
                </Text>
              )}
            </div>
          </Space>
        </div>

        <div className="flex justify-between items-center mb-5">
          <div className="text-sm text-gray-500">
            Ready to comment on {links.length} posts
          </div>
          <Button 
            type="primary" 
            size="large"
            loading={loading} 
            onClick={handleStart}
            disabled={links.length === 0 || !comment.trim()}
          >
            {loading ? 'Processing...' : 'Start Auto-Comment'}
          </Button>
        </div>

        {/* Time Estimation Alert */}
        {links.length > 0 && !loading && (
          <Alert
            message={
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined className="text-blue-500" />
                <span className="font-medium">Estimated Time</span>
              </div>
            }
            description={
              <div className="space-y-1">
                <div className="text-sm">
                  🕐 Duration: <strong>{formatDuration(calculateEstimatedTime(links.length))}</strong>
                </div>
                <div className="text-sm">
                  🎯 Completion: <strong>{getEstimatedCompletionTime(calculateEstimatedTime(links.length))}</strong>
                </div>
                <div className="text-xs text-gray-500">
                  Based on ~{AVERAGE_TIME_PER_COMMENT}s per comment + {DELAY_BETWEEN_COMMENTS}s safety delays
                </div>
              </div>
            }
            type="info"
            showIcon={false}
            className="mt-4"
          />
        )}

        {/* Results Section */}
        {uploadResults && (
          <div className="mt-8">
            <Card title="Results" size="small">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{uploadResults.statistics.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{uploadResults.statistics.successful}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{uploadResults.statistics.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{uploadResults.statistics.successRate}</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
              
              <Progress 
                percent={Math.round((uploadResults.statistics.successful / uploadResults.statistics.total) * 100)}
                status={uploadResults.statistics.failed > 0 ? "active" : "success"}
                className="mb-4"
              />

              {/* Detailed Results */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {uploadResults.results.map((result, index) => (
                  <Card 
                    key={index} 
                    size="small" 
                    className={`border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium truncate">
                          <a href={result.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            {result.url}
                          </a>
                        </div>
                        <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.message}
                        </div>
                        {result.error && (
                          <Text type="danger" className="text-xs">
                            Error: {result.error}
                          </Text>
                        )}
                      </div>
                      <div className="ml-4">
                        <Tag color={result.success ? 'success' : 'error'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}