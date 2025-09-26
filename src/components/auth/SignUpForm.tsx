'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Space, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { SignUpData } from '../../types';

const { Title, Text } = Typography;

interface SignUpFormProps {
  onSwitchToLogin?: () => void;
  onSignUpSuccess?: () => void;
}

export default function SignUpForm({ onSwitchToLogin, onSignUpSuccess }: SignUpFormProps) {
  const [form] = Form.useForm();
  const { signUp, loading } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (values: SignUpData & { agreeToTerms: boolean }) => {
    try {
      setSubmitLoading(true);
      
      // Remove agreeToTerms from the data sent to API
      const { agreeToTerms, ...signUpData } = values;
      
      await signUp(signUpData);
      
      // Clear form after successful signup
      form.resetFields();
      
      // Call success callback if provided
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } catch (error) {
      // Error handling is done in AuthContext
      console.error('Sign up error:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-gray-900">
            Create Account
          </Title>
          <Text type="secondary">
            Join us today! Please fill in your information to get started
          </Text>
        </div>

        <Form
          form={form}
          name="signup"
          onFinish={handleSubmit}
          size="large"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            rules={[
              {
                required: true,
                message: 'Please enter your full name!',
              },
              {
                min: 2,
                message: 'Name must be at least 2 characters!',
              },
              {
                max: 50,
                message: 'Name cannot exceed 50 characters!',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Full name"
              autoComplete="name"
            />
          </Form.Item>

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
              prefix={<MailOutlined className="text-gray-400" />}
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
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number!',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              autoComplete="new-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: 'Please confirm your password!',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm password"
              autoComplete="new-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="agreeToTerms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions!')),
              },
            ]}
            className="mb-6"
          >
            <Checkbox>
              <Text type="secondary" className="text-sm">
                I agree to the{' '}
                <Button type="link" className="p-0 text-blue-600 hover:text-blue-500">
                  Terms and Conditions
                </Button>{' '}
                and{' '}
                <Button type="link" className="p-0 text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Button>
              </Text>
            </Checkbox>
          </Form.Item>

          <Form.Item className="mb-6">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-base font-semibold"
              loading={submitLoading || loading}
              disabled={loading}
            >
              {submitLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Form.Item>
        </Form>

        {onSwitchToLogin && (
          <>
            <Divider className="my-6">
              <Text type="secondary" className="text-sm">
                Already have an account?
              </Text>
            </Divider>

            <div className="text-center">
              <Button
                type="link"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-500 font-semibold w-full h-12 text-base"
                size="large"
              >
                Sign In Instead
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}