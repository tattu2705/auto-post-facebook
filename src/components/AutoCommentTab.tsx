"use client";

import React, { useState } from "react";
import { Button, Input, Upload, Tag, Space, notification, Card, Progress, Typography, Alert, InputNumber } from "antd";
import { UploadOutlined, ClockCircleOutlined } from "@ant-design/icons";
import uploadService, { type UploadResponse, type ProcessInfo, type StartIntervalResponse } from "../services/upload-service";
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
  const [intervalTime, setIntervalTime] = useState<number>(3); // seconds between comments
  const [cycleInterval, setCycleInterval] = useState<number>(300); // seconds between cycles (5 minutes)
  const [cycleHours, setCycleHours] = useState<number>(0);
  const [cycleMinutes, setCycleMinutes] = useState<number>(5);
  const [cycleSeconds, setCycleSeconds] = useState<number>(0);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processController, setProcessController] = useState<AbortController | null>(null);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalCyclesCompleted, setTotalCyclesCompleted] = useState(0);
  const [nextCycleCountdown, setNextCycleCountdown] = useState(0);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [processStartTime, setProcessStartTime] = useState<Date | null>(null);
  const [backendProcessId, setBackendProcessId] = useState<string | null>(null);
  const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const urlRegex = /https?:\/\/[\w\-@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([\w\-@:%_\+.~#?&//=]*)/i;

  // Time estimation constants
  const AVERAGE_TIME_PER_COMMENT = 15; // seconds per comment
  const DELAY_BETWEEN_COMMENTS = intervalTime; // Use dynamic interval time

  // Function to calculate total seconds from hours, minutes, seconds
  const calculateTotalSeconds = (hours: number, minutes: number, seconds: number) => {
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Function to update cycle interval when time components change
  const updateCycleInterval = (hours: number, minutes: number, seconds: number) => {
    const totalSeconds = calculateTotalSeconds(hours, minutes, seconds);
    setCycleInterval(totalSeconds);
  };

  // Function to set time components from total seconds
  const setTimeFromSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    setCycleHours(hours);
    setCycleMinutes(minutes);
    setCycleSeconds(seconds);
    setCycleInterval(totalSeconds);
  };

  // Function to calculate estimated time for one cycle
  const calculateEstimatedTime = (linkCount: number) => {
    const totalTimeInSeconds = (linkCount * AVERAGE_TIME_PER_COMMENT) + ((linkCount - 1) * intervalTime);
    return totalTimeInSeconds;
  };

  // Cleanup function
  const cleanup = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    setLoading(false);
    setIsProcessing(false);
    setIsPaused(false);
    setProcessController(null);
    setNextCycleCountdown(0);
    setCurrentCycle(0);
    setBackendProcessId(null);
    setProcessInfo(null);
  };

  // Reset function for new session
  const resetSession = () => {
    cleanup();
    setUploadResults(null);
    setTotalCyclesCompleted(0);
    setProcessStartTime(null);
  };

  // Function to format time duration with hours:minutes:seconds
  const formatDurationHMS = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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

  // Start process status monitoring
  const startStatusMonitoring = (processId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await uploadService.getProcessStatus(processId);
        if (statusResponse.success && statusResponse.process) {
          const process = statusResponse.process;
          setProcessInfo(process);
          setCurrentCycle(process.currentCycle);
          setTotalCyclesCompleted(process.completedCycles);
          
          // Update countdown for next cycle
          if (process.nextCycleTime) {
            const nextTime = new Date(process.nextCycleTime);
            const now = new Date();
            const countdown = Math.max(0, Math.floor((nextTime.getTime() - now.getTime()) / 1000));
            setNextCycleCountdown(countdown);
          } else {
            setNextCycleCountdown(0);
          }
          
          // Check if process finished
          if (process.status === 'completed' || process.status === 'stopped' || process.status === 'error') {
            clearInterval(interval);
            setStatusCheckInterval(null);
            setIsProcessing(false);
            setLoading(false);
            
            if (process.lastCycleResult) {
              setUploadResults({
                success: true,
                message: `Process ${process.status}`,
                statistics: {
                  total: process.lastCycleResult.total,
                  successful: process.lastCycleResult.successful,
                  failed: process.lastCycleResult.failed,
                  successRate: process.lastCycleResult.successRate
                },
                results: [] // Backend doesn't return detailed results in status
              });
            }
            
            notification.info({
              message: `🏁 Process ${process.status}`,
              description: `Completed ${process.completedCycles} cycle(s) in ${formatDuration(Math.floor(process.duration / 1000))}`,
              duration: 8,
            });
          }
          
          // Update loading state
          setLoading(process.status === 'running_cycle');
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 2000); // Check every 2 seconds
    
    setStatusCheckInterval(interval);
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
    if (isContinuousMode && cycleInterval < 60) {
      notification.error({ 
        message: "Invalid cycle interval", 
        description: "Cycle interval must be at least 1 minute (60 seconds)." 
      });
      return;
    }

    // Reset session for new start
    resetSession();
    setIsProcessing(true);
    setProcessStartTime(new Date());

    try {
      if (isContinuousMode) {
        // Use backend interval commenting
        const response = await uploadService.startIntervalComment(
          comment,
          links,
          cookiesContent,
          cookiesFileName,
          {
            delay: intervalTime * 1000,
            cycleInterval: cycleInterval * 1000,
            maxCycles: null, // unlimited cycles
            headless: true,
            timeout: 30000,
            debug: false,
          }
        );

        setBackendProcessId(response.processId);
        
        notification.success({
          message: "🔄 Continuous commenting started!",
          description: (
            <div>
              <div>📊 Processing {links.length} link(s)</div>
              <div>⏰ Comment interval: <strong>{intervalTime}s</strong></div>
              <div>🔄 Cycle interval: <strong>{formatDurationHMS(cycleInterval)}</strong></div>
              <div className="text-xs text-gray-600 mt-1">Process ID: {response.processId}</div>
            </div>
          ),
          duration: 8,
          placement: 'topRight',
        });

        // Start monitoring the backend process
        startStatusMonitoring(response.processId);
        
      } else {
        // Single cycle - use existing logic
        const results = await uploadService.uploadComment(
          comment,
          links,
          cookiesContent,
          cookiesFileName,
          {
            delay: intervalTime * 1000,
            headless: true,
            timeout: 30000,
            debug: false,
          }
        );

        setUploadResults(results);
        setIsProcessing(false);
        
        notification.success({
          message: "✅ Single cycle completed!",
          description: `${results.statistics.successful}/${results.statistics.total} comments posted (${results.statistics.successRate})`,
          duration: 6,
        });
      }

    } catch (error) {
      console.error('Process error:', error);
      cleanup();
      notification.error({
        message: "❌ Failed to start process",
        description: error instanceof Error ? error.message : String(error),
        duration: 10,
      });
    }
  };

  const handleStop = async () => {
    try {
      if (backendProcessId) {
        // Stop backend process
        const response = await uploadService.stopProcess(backendProcessId);
        
        notification.warning({
          message: "⏹️ Process stopped",
          description: (
            <div>
              <div>Continuous commenting stopped after {response.finalStatus.completedCycles} cycle(s)</div>
              <div className="text-xs text-gray-600 mt-1">
                Session duration: {formatDuration(Math.floor(response.finalStatus.duration / 1000))}
              </div>
            </div>
          ),
          duration: 8,
        });
      } else if (processController) {
        // Stop frontend process
        processController.abort();
        
        const sessionDuration = processStartTime 
          ? Math.floor((new Date().getTime() - processStartTime.getTime()) / 1000)
          : 0;
        
        notification.warning({
          message: "⏹️ Process stopped",
          description: (
            <div>
              <div>{isContinuousMode 
                ? `Continuous commenting stopped after ${totalCyclesCompleted} cycle(s)`
                : "Comment process has been stopped"
              }</div>
              {sessionDuration > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Session duration: {formatDuration(sessionDuration)}
                </div>
              )}
            </div>
          ),
          duration: 8,
        });
      }
      
      cleanup();
    } catch (error) {
      console.error('Stop error:', error);
      notification.error({
        message: "❌ Error stopping process",
        description: error instanceof Error ? error.message : String(error),
        duration: 5,
      });
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

        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Comment Interval (seconds)</label>
          <div className="flex items-center space-x-4">
            <InputNumber
              min={1}
              max={60}
              value={intervalTime}
              onChange={(value: number | null) => setIntervalTime(value || 3)}
              placeholder="3"
              className="w-32"
              addonAfter="seconds"
              disabled={isProcessing}
            />
            <Text type="secondary" className="text-sm">
              Time delay between each comment (1-60 seconds)
            </Text>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-4 mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isContinuousMode}
                onChange={(e) => setIsContinuousMode(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">Continuous Mode</span>
            </label>
            <Text type="secondary" className="text-sm">
              Automatically repeat commenting cycles
            </Text>
          </div>
          
          {isContinuousMode && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 min-w-[100px]">Cycle Interval:</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <InputNumber
                    min={0}
                    max={4}
                    value={cycleHours}
                    onChange={(value: number | null) => {
                      const newHours = value || 0;
                      setCycleHours(newHours);
                      updateCycleInterval(newHours, cycleMinutes, cycleSeconds);
                    }}
                    placeholder="0"
                    className="w-16"
                    disabled={isProcessing}
                  />
                  <span className="text-sm text-gray-600">hours</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <InputNumber
                    min={0}
                    max={59}
                    value={cycleMinutes}
                    onChange={(value: number | null) => {
                      const newMinutes = value || 0;
                      setCycleMinutes(newMinutes);
                      updateCycleInterval(cycleHours, newMinutes, cycleSeconds);
                    }}
                    placeholder="5"
                    className="w-16"
                    disabled={isProcessing}
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <InputNumber
                    min={0}
                    max={59}
                    value={cycleSeconds}
                    onChange={(value: number | null) => {
                      const newSeconds = value || 0;
                      setCycleSeconds(newSeconds);
                      updateCycleInterval(cycleHours, cycleMinutes, newSeconds);
                    }}
                    placeholder="0"
                    className="w-16"
                    disabled={isProcessing}
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Text type="secondary" className="text-sm">
                  Time between cycles (minimum 1 minute, maximum 4 hours)
                </Text>
                
                {cycleInterval >= 60 && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Total: {formatDuration(cycleInterval)}
                  </div>
                )}
                
                {cycleInterval < 60 && cycleInterval > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    ⚠️ Minimum 1 minute required
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="small" 
                  type="dashed"
                  onClick={() => setTimeFromSeconds(300)} // 5 minutes
                  disabled={isProcessing}
                >
                  5 min
                </Button>
                <Button 
                  size="small" 
                  type="dashed"
                  onClick={() => setTimeFromSeconds(900)} // 15 minutes
                  disabled={isProcessing}
                >
                  15 min
                </Button>
                <Button 
                  size="small" 
                  type="dashed"
                  onClick={() => setTimeFromSeconds(1800)} // 30 minutes
                  disabled={isProcessing}
                >
                  30 min
                </Button>
                <Button 
                  size="small" 
                  type="dashed"
                  onClick={() => setTimeFromSeconds(3600)} // 1 hour
                  disabled={isProcessing}
                >
                  1 hour
                </Button>
                <Button 
                  size="small" 
                  type="dashed"
                  onClick={() => setTimeFromSeconds(7200)} // 2 hours
                  disabled={isProcessing}
                >
                  2 hours
                </Button>
              </div>
            </div>
          )}
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
            <div>Ready to comment on {links.length} posts with {intervalTime}s intervals</div>
            {isContinuousMode && !isProcessing && (
              <div className="text-xs text-blue-600 mt-1">
                Continuous mode: Cycle every {formatDurationHMS(cycleInterval)}
              </div>
            )}
            {isProcessing && (
              <div className="space-y-1">
                <div className="text-xs text-green-600">
                  {processInfo?.status === 'running_cycle' && `🔄 Processing cycle ${currentCycle}...`}
                  {processInfo?.status === 'waiting' && nextCycleCountdown > 0 && `⏳ Next cycle ${currentCycle + 1} in ${formatDuration(nextCycleCountdown)}`}
                  {processInfo?.status === 'running' && !loading && `⚡ Ready for next cycle`}
                  {!isContinuousMode && loading && `🔄 Processing...`}
                  {backendProcessId && `🔧 Backend Process: ${backendProcessId.substring(0, 8)}...`}
                </div>
                {processStartTime && (
                  <div className="text-xs text-gray-400">
                    Started: {processStartTime.toLocaleTimeString()} • 
                    Completed: {totalCyclesCompleted} cycle(s)
                    {processInfo && ` • Status: ${processInfo.status}`}
                  </div>
                )}
              </div>
            )}
          </div>
          <Space>
            {isProcessing && (
              <Button 
                type="default" 
                size="large"
                onClick={handleStop}
                danger
              >
                ⏹️ Stop Process
              </Button>
            )}
            <Button 
              type="primary" 
              size="large"
              loading={loading} 
              onClick={handleStart}
              disabled={links.length === 0 || !comment.trim() || isProcessing}
            >
              {loading ? 'Processing...' : isProcessing ? 'Running...' : 
               isContinuousMode ? 'Start Continuous' : 'Start Single Cycle'}
            </Button>
          </Space>
        </div>

        {/* Session Statistics for Continuous Mode */}
        {isContinuousMode && isProcessing && processInfo && (
          <Card className="mb-4" size="small">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{processInfo.completedCycles}</div>
                  <div className="text-xs text-gray-500">Cycles Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{processInfo.currentCycle}</div>
                  <div className="text-xs text-gray-500">Current Cycle</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {formatDuration(Math.floor(processInfo.duration / 1000))}
                  </div>
                  <div className="text-xs text-gray-500">Runtime</div>
                </div>
                {processInfo.lastCycleResult && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {processInfo.lastCycleResult.successRate}
                    </div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {processInfo.status === 'running_cycle' ? (
                    <span className="text-blue-600">🔄 RUNNING</span>
                  ) : processInfo.status === 'waiting' ? (
                    <span className="text-green-600">⏳ WAITING</span>
                  ) : processInfo.status === 'running' ? (
                    <span className="text-gray-600">📊 READY</span>
                  ) : (
                    <span className="text-red-600">⚠️ {processInfo.status.toUpperCase()}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Backend Process
                </div>
              </div>
            </div>
          </Card>
        )}

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