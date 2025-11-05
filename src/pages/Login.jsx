// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await api.post("/auth/login", values);
      const { access_token, role, name, email } = res.data;

      // Store JWT and user info in localStorage
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user_role", role || "interviewee");
      localStorage.setItem("user_name", name || "");
      localStorage.setItem("user_email", email || "");
      
      // Reset any cached interview state
      localStorage.removeItem("swipe_interview_state");

      message.success(`Welcome back, ${name}!`);
      
      // Redirect based on role
      if (role === "interviewer") {
        window.location.href = "/interviewer";
      } else {
        window.location.href = "/interviewee";
      }
    } catch (err) {
      console.log(err);
      message.error(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: '#888' }}>Sign in to continue to your dashboard</p>
        </div>
        
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item 
            label="Email" 
            name="email" 
            rules={[{ required: true, type: "email", message: 'Please enter a valid email' }]}
          >
            <Input 
              size="large" 
              prefix={<UserOutlined />} 
              placeholder="Enter your email" 
            />
          </Form.Item>
          <Form.Item 
            label="Password" 
            name="password" 
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              size="large" 
              prefix={<LockOutlined />} 
              placeholder="Enter your password" 
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Sign In
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            Don't have an account? <a onClick={() => navigate('/signup')}>Sign up here</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
