// src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message } from "antd";

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", values);
      const token = res.data.access_token;

      // Store JWT in localStorage
      localStorage.setItem("access_token", token);

      message.success("Login successful!");
      navigate("/"); // go to Interviewee page
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
