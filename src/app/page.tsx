"use client";

import React, { useState } from "react";
import { Layout, Menu, Card, Typography, Avatar, Dropdown, Button, Space } from "antd";
import { 
  MessageOutlined, 
  SendOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  FacebookOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined
} from "@ant-design/icons";
import AutoCommentTab from "../components/AutoCommentTab";
import AutoPostTab from "../components/AutoPostTab";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import '@ant-design/v5-patch-for-react-19';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

type MenuKey = 'comment' | 'post' | 'analytics' | 'settings';

export default function Home() {
  const [selectedKey, setSelectedKey] = useState<MenuKey>('comment');
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleSignOut,
    },
  ];

  const menuItems = [
    {
      key: 'comment',
      icon: <MessageOutlined />,
      label: 'Auto Comment',
    },
    {
      key: 'post',
      icon: <SendOutlined />,
      label: 'Auto Post',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      disabled: true, // Coming soon
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      disabled: true, // Coming soon
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'comment':
        return <AutoCommentTab />;
      case 'post':
        return <AutoPostTab />;
      case 'analytics':
        return (
          <div className="p-6">
            <Card>
              <div className="text-center py-12">
                <BarChartOutlined className="text-6xl text-gray-300 mb-4" />
                <Title level={3} className="text-gray-500">Analytics Dashboard</Title>
                <Text type="secondary">Coming soon - Track your automation performance</Text>
              </div>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <Card>
              <div className="text-center py-12">
                <SettingOutlined className="text-6xl text-gray-300 mb-4" />
                <Title level={3} className="text-gray-500">Settings</Title>
                <Text type="secondary">Coming soon - Configure your automation preferences</Text>
              </div>
            </Card>
          </div>
        );
      default:
        return <AutoCommentTab />;
    }
  };

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={250}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
        }}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar 
              size={40} 
              style={{ backgroundColor: '#1890ff' }}
              icon={<FacebookOutlined />}
            />
            {!collapsed && (
              <div>
                <Title level={4} className="mb-0 text-gray-800">
                  FB Automation
                </Title>
                <Text type="secondary" className="text-xs">
                  Social Media Tools
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key as MenuKey)}
          style={{ 
            border: 'none',
            marginTop: 16,
          }}
          className="custom-menu"
        />

        {/* Footer info */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4 mb-10">
            <Card size="small" className="bg-blue-50 border-blue-200 ">
              <div className="text-center">
                <Text type="secondary" className="text-xs">
                  Version 1.0.0
                </Text>
                <br />
                <Text type="secondary" className="text-xs">
                  Made by Tat Tu Nguyen
                </Text>
              </div>
            </Card>
          </div>
        )}
      </Sider>

      {/* Main Content */}
      <Layout>
        {/* Header */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div className="flex justify-between h-full">
            <div>
              <Title level={2} className="mb-0 text-gray-800">
                {menuItems.find(item => item.key === selectedKey)?.label}
              </Title>
              <Text type="secondary">
                {selectedKey === 'comment' && 'Automatically comment on Facebook posts'}
                {selectedKey === 'post' && 'Schedule and publish Facebook posts'}
                {selectedKey === 'analytics' && 'View automation performance metrics'}
                {selectedKey === 'settings' && 'Configure automation settings'}
              </Text>
            </div>
            
            <div className="flex items-center space-x-4">
              <Card size="small" className="bg-green-50 border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Text type="secondary" className="text-xs">
                    System Online
                  </Text>
                </div>
              </Card>

              {/* User Profile Dropdown */}
              <Dropdown
                menu={{ 
                  items: userMenuItems.map(item => ({
                    ...item,
                    onClick: item.onClick || undefined
                  }))
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="text" className="h-auto p-2">
                  <Space>
                    <Avatar 
                      size={32} 
                      src={user?.avatar_url}
                      icon={!user?.avatar_url && <UserOutlined />}
                      style={{ backgroundColor: user?.avatar_url ? undefined : '#1890ff' }}
                    />
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.subscription_plan || 'Free Plan'}
                      </div>
                    </div>
                  </Space>
                </Button>
              </Dropdown>
            </div>
          </div>
        </Header>

        {/* Page Content */}
        <Content style={{ 
          background: '#f5f5f5',
          overflow: 'auto'
        }}>
          {renderContent()}
        </Content>
      </Layout>

      <style jsx global>{`
        .custom-menu .ant-menu-item {
          margin: 4px 8px !important;
          border-radius: 8px !important;
          height: 48px !important;
          line-height: 48px !important;
        }
        
        .custom-menu .ant-menu-item:hover {
          background-color: #f0f9ff !important;
          color: #1890ff !important;
        }
        
        .custom-menu .ant-menu-item-selected {
          background-color: #e6f7ff !important;
          color: #1890ff !important;
          font-weight: 600 !important;
        }
        
        .custom-menu .ant-menu-item-disabled {
          opacity: 0.5 !important;
        }
        
        .ant-layout-sider-trigger {
          background: #f8f9fa !important;
          color: #666 !important;
          border-top: 1px solid #e8e8e8 !important;
        }
        
        .ant-layout-sider-trigger:hover {
          background: #e9ecef !important;
          color: #1890ff !important;
        }
      `}</style>
    </Layout>
    </ProtectedRoute>
  );
}
