'use client';

import React from 'react';
import { Card, Typography, Avatar, Space, Tag, Button } from 'antd';
import { UserOutlined, CrownOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function UserWelcomeCard() {
  const { user } = useAuth();

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'premium':
        return 'gold';
      case 'pro':
        return 'purple';
      case 'basic':
        return 'blue';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
      style={{ padding: '24px' }}
    >
      <div className="flex items-center justify-between">
        <Space size="large" align="center">
          <Avatar 
            size={64} 
            src={user.avatar_url}
            icon={!user.avatar_url && <UserOutlined />}
            style={{ 
              backgroundColor: user.avatar_url ? undefined : '#1890ff',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          
          <div>
            <Title level={3} className="mb-1 text-gray-800">
              Welcome back, {user.name}! 👋
            </Title>
            <Space direction="vertical" size="small">
              <Space>
                <Text type="secondary">
                  <CalendarOutlined className="mr-1" />
                  Member since {formatDate(user.created_at)}
                </Text>
              </Space>
              <Space>
                <Tag 
                  icon={<CrownOutlined />} 
                  color={getSubscriptionColor(user.subscription_plan)}
                  className="font-semibold"
                >
                  {user.subscription_plan.toUpperCase()} PLAN
                </Tag>
                <Text type="secondary" className="text-sm">
                  {user.email}
                </Text>
              </Space>
            </Space>
          </div>
        </Space>

        <div className="text-right">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <Text type="secondary" className="text-xs block mb-1">
              Quick Stats
            </Text>
            <div className="grid grid-cols-1 gap-1 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">0</div>
                <div className="text-xs text-gray-500">Comments Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}