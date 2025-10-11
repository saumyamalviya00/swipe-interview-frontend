// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await api.post("/auth/login", values);
      const token = res.data.access_token;

      // Store JWT in localStorage
      localStorage.setItem("access_token", token);
      // Reset any cached interview state
      localStorage.removeItem("swipe_interview_state");

      message.success("Login successful!");
      // Force a page reload to ensure clean state
      window.location.href = "/";
    } catch (err) {
      console.log(err);
      message.error(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>Login</h2>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
