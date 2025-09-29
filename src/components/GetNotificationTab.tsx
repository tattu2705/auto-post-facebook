import React, { useState } from "react";
import { Card, Typography, InputNumber, Upload, Button, Form, Space, message } from "antd";
import { BellOutlined, FileOutlined } from "@ant-design/icons";
import uploadService, { getNotificationLinks } from "../services/upload-service";

const { Title, Text } = Typography;

export default function GetNotificationTab() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[]>([]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    setResult([]);
    try {
      const file = values.cookieFile && values.cookieFile[0] ? values.cookieFile[0].originFileObj : null;
      const data = await getNotificationLinks(values.count, file);
      if (data && data.success && Array.isArray(data.links)) {
        setResult(data.links);
        message.success('Fetched notification links!');
      } else {
        message.error(data?.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setLoading(false);
      message.error('Failed to fetch notifications');
      return;
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <Card>
        <Title level={3}>
          <BellOutlined className="mr-2" /> Get Notification Link
        </Title>
        <Text type="secondary">
          Retrieve Top Facebook notification links using your cookie file
        </Text>
        <Form
          form={form}
          layout="vertical"
          className="mt-6 max-w-md"
          onFinish={handleFinish}
        >
          <Form.Item
            label="Number of notifications"
            name="count"
            rules={[{ required: true, message: "Please enter the number of notifications" }]}
          >
            <InputNumber min={1} max={100} style={{ width: "100%" }} placeholder="Enter count" />
          </Form.Item>
          <Form.Item
            label="Cookie File"
            name="cookieFile"
            rules={[{ required: true, message: "Please upload your cookie file" }]}
            valuePropName="fileList"
            getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept=".json,.txt">
              <Button icon={<FileOutlined />}>Select Cookie File</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Get Notification Links
            </Button>
          </Form.Item>
        </Form>
        {result.length > 0 && (
          <Card className="mt-6" title="Notification Links">
            <ul>
              {result.map((link, idx) => (
                <li key={idx}>
                  <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Card>
    </div>
  );
}
