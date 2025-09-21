"use client";

import React, { useState } from "react";
import { Button, Input, Upload, Tag, Space, notification, Card, Select, DatePicker, Switch, Divider } from "antd";
import { UploadOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

interface PostContent {
  text: string;
  images: File[];
  links: string[];
  hashtags: string[];
}

interface PostTarget {
  type: 'page' | 'group' | 'profile';
  id: string;
  name: string;
}

export default function AutoPostTab() {
  const [postContent, setPostContent] = useState<PostContent>({
    text: "",
    images: [],
    links: [],
    hashtags: []
  });
  
  const [targets, setTargets] = useState<PostTarget[]>([]);
  const [newTarget, setNewTarget] = useState({ type: 'page' as const, id: '', name: '' });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<any>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [loading, setLoading] = useState(false);
  const [cookiesFileName, setCookiesFileName] = useState<string | null>(null);
  const [cookiesContent, setCookiesContent] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      notification.error({ message: 'Only image files are allowed!' });
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      notification.error({ message: 'Image must be smaller than 10MB!' });
      return false;
    }

    setPostContent(prev => ({
      ...prev,
      images: [...prev.images, file]
    }));

    notification.success({ message: `Added image: ${file.name}` });
    return false; // Prevent upload
  };

  const removeImage = (index: number) => {
    setPostContent(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addHashtag = (hashtag: string) => {
    if (hashtag && !postContent.hashtags.includes(hashtag)) {
      setPostContent(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtag.startsWith('#') ? hashtag : `#${hashtag}`]
      }));
    }
  };

  const removeHashtag = (hashtag: string) => {
    setPostContent(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const addTarget = () => {
    if (newTarget.id && newTarget.name) {
      setTargets(prev => [...prev, { ...newTarget }]);
      setNewTarget({ type: 'page', id: '', name: '' });
      notification.success({ message: `Added target: ${newTarget.name}` });
    }
  };

  const removeTarget = (index: number) => {
    setTargets(prev => prev.filter((_, i) => i !== index));
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

  const handlePost = async () => {
    if (!postContent.text.trim()) {
      notification.error({ message: "Please enter post content." });
      return;
    }
    if (targets.length === 0) {
      notification.error({ message: "Please add at least one target." });
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual posting logic with backend API
      const postData = {
        content: postContent,
        targets,
        privacy,
        scheduleTime: scheduleEnabled && scheduleTime ? scheduleTime.toISOString() : null,
        recurring: recurring !== 'none' ? recurring : null,
        cookies: cookiesContent
      };

      console.log('Post data:', postData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      notification.success({
        message: scheduleEnabled ? "Post scheduled successfully!" : "Post published successfully!",
        description: `Posted to ${targets.length} target(s)`,
        duration: 10,
      });

      // Reset form after successful post
      setPostContent({ text: "", images: [], links: [], hashtags: [] });
      
    } catch (error) {
      console.error('Post error:', error);
      notification.error({
        message: "Failed to publish post",
        description: error instanceof Error ? error.message : String(error),
        duration: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card title="Create Auto Post">
        {/* Post Content */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">Post Content</label>
          <TextArea
            rows={6}
            value={postContent.text}
            onChange={(e) => setPostContent(prev => ({ ...prev, text: e.target.value }))}
            placeholder="What's on your mind? Write your post content here..."
            showCount
            maxLength={63206}
            className="mb-3"
          />
          
          {/* Hashtags */}
          <div className="mb-3">
            <label className="block mb-2 text-sm font-medium text-gray-600">Hashtags</label>
            <Space wrap>
              {postContent.hashtags.map((hashtag, index) => (
                <Tag key={index} closable onClose={() => removeHashtag(hashtag)} color="blue">
                  {hashtag}
                </Tag>
              ))}
              <Input
                placeholder="Add hashtag..."
                size="small"
                style={{ width: 120 }}
                onPressEnter={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  if (value) {
                    addHashtag(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </Space>
          </div>
        </div>

        {/* Media Upload */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">Images</label>
          <Upload
            beforeUpload={handleImageUpload}
            showUploadList={false}
            accept="image/*"
            multiple
          >
            <Button icon={<UploadOutlined />} type="dashed">
              Upload Images
            </Button>
          </Upload>
          
          {postContent.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {postContent.images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="absolute top-1 right-1 bg-red-500 text-white hover:bg-red-600"
                    onClick={() => removeImage(index)}
                  />
                  <div className="text-xs text-gray-500 mt-1 truncate">{file.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Targets */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">Post Targets</label>
          
          {/* Add Target */}
          <div className="mb-3 p-3 border border-gray-200 rounded">
            <Space>
              <Select
                value={newTarget.type}
                onChange={(value) => setNewTarget(prev => ({ ...prev, type: value }))}
                style={{ width: 100 }}
              >
                <Option value="page">Page</Option>
                <Option value="group">Group</Option>
                <Option value="profile">Profile</Option>
              </Select>
              <Input
                placeholder="Target ID"
                value={newTarget.id}
                onChange={(e) => setNewTarget(prev => ({ ...prev, id: e.target.value }))}
                style={{ width: 200 }}
              />
              <Input
                placeholder="Target Name"
                value={newTarget.name}
                onChange={(e) => setNewTarget(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: 200 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addTarget}
                disabled={!newTarget.id || !newTarget.name}
              >
                Add
              </Button>
            </Space>
          </div>

          {/* Target List */}
          <div className="space-y-2">
            {targets.length === 0 && (
              <div className="text-gray-400 italic text-center py-4">
                No targets added yet
              </div>
            )}
            {targets.map((target, index) => (
              <Card key={index} size="small">
                <div className="flex items-center justify-between">
                  <div>
                    <Tag color={target.type === 'page' ? 'blue' : target.type === 'group' ? 'green' : 'orange'}>
                      {target.type.toUpperCase()}
                    </Tag>
                    <span className="font-medium">{target.name}</span>
                    <span className="text-gray-500 ml-2">({target.id})</span>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeTarget(index)}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Divider />

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Privacy */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Privacy</label>
            <Select
              value={privacy}
              onChange={setPrivacy}
              style={{ width: '100%' }}
            >
              <Option value="public">🌍 Public</Option>
              <Option value="friends">👥 Friends</Option>
              <Option value="private">🔒 Only Me</Option>
            </Select>
          </div>

          {/* Recurring */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Recurring</label>
            <Select
              value={recurring}
              onChange={setRecurring}
              style={{ width: '100%' }}
            >
              <Option value="none">No Repeat</Option>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </div>
        </div>

        {/* Schedule */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Switch
              checked={scheduleEnabled}
              onChange={setScheduleEnabled}
            />
            <label className="font-medium text-gray-700">Schedule Post</label>
          </div>
          
          {scheduleEnabled && (
            <DatePicker
              value={scheduleTime}
              onChange={(time) => setScheduleTime(time)}
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: 200 }}
              placeholder="Select date and time"
            />
          )}
        </div>

        {/* Authentication */}
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
                <Tag closable onClose={removeCookies} color="success">
                  ✓ {cookiesFileName}
                </Tag>
              ) : (
                <span className="text-gray-400 text-sm">
                  No cookies file loaded - required for Facebook authentication
                </span>
              )}
            </div>
          </Space>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Ready to post to {targets.length} target(s)
            {scheduleEnabled && scheduleTime && ` at ${scheduleTime.format('YYYY-MM-DD HH:mm')}`}
          </div>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handlePost}
            disabled={!postContent.text.trim() || targets.length === 0}
            icon={scheduleEnabled ? <CalendarOutlined /> : undefined}
          >
            {loading 
              ? 'Processing...' 
              : scheduleEnabled 
                ? 'Schedule Post' 
                : 'Publish Now'
            }
          </Button>
        </div>
      </Card>
    </div>
  );
}