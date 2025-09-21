'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Space, message } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { SignInData } from '../../services/auth-service';

const { Title, Text, Link } = Typography;

interface LoginFormProps {
  onSwitchToSignUp?: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onSwitchToSignUp, onLoginSuccess }: LoginFormProps) {
  const [form] = Form.useForm();
  const { signIn, loading } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (values: SignInData) => {
    try {
      setSubmitLoading(true);
      await signIn(values);
      
      // Clear form after successful login
      form.resetFields();
      
      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      // Error handling is done in AuthContext
      console.error('Login error:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleForgotPassword = () => {
    message.info('Password reset functionality will be implemented soon!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-gray-900">
            Sign In
          </Title>
          <Text type="secondary">
            Welcome back! Please sign in to your account
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          size="large"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              {
                required: true,
                message: 'Please enter your email!',
              },
              {
                type: 'email',
                message: 'Please enter a valid email address!',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Email address"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: 'Please enter your password!',
              },
              {
                min: 6,
                message: 'Password must be at least 6 characters!',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              autoComplete="current-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item className="mb-6">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-base font-semibold"
              loading={submitLoading || loading}
              disabled={loading}
            >
              {submitLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <Button
            type="link"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-500 p-0"
          >
            Forgot your password?
          </Button>
        </div>

        {onSwitchToSignUp && (
          <>
            <Divider className="my-6">
              <Text type="secondary" className="text-sm">
                Or
              </Text>
            </Divider>

            <div className="text-center">
              <Space>
                <Text type="secondary">Don't have an account?</Text>
                <Button
                  type="link"
                  onClick={onSwitchToSignUp}
                  className="text-blue-600 hover:text-blue-500 p-0 font-semibold"
                >
                  Create Account
                </Button>
              </Space>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}