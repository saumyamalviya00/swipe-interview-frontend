import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Radio, Card } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";

const Signup = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await axios.post("http://localhost:8000/api/auth/signup", values);
      message.success("Signup successful! Please login.");
      navigate("/login");
    } catch (err) {
      console.log(err);
      message.error(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "50px auto" }}>
      <Card>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Create Account</h2>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ role: "interviewee" }}>
          <Form.Item 
            label="I am a" 
            name="role" 
            rules={[{ required: true, message: 'Please select your role' }]}
          >
            <Radio.Group size="large" style={{ width: '100%' }}>
              <Radio.Button value="interviewee" style={{ width: '50%', textAlign: 'center' }}>
                <UserOutlined /> Interviewee
              </Radio.Button>
              <Radio.Button value="interviewer" style={{ width: '50%', textAlign: 'center' }}>
                <TeamOutlined /> Interviewer
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input size="large" placeholder="Enter your full name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input size="large" placeholder="Enter your email" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input size="large" placeholder="Enter your phone number" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password size="large" placeholder="Create a password (min 6 characters)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Create Account
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            Already have an account? <a onClick={() => navigate('/login')}>Login here</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Signup;
