// src/App.jsx
import React from "react";
import { Layout, Menu } from "antd";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import Interviewee from "./pages/Interviewee";
import InterviewerDashboard from "./pages/InterviewerDashboard";


const { Header, Content } = Layout;

export default function App() {
  const location = useLocation();
  const selectedKey = location.pathname === "/dashboard" ? "2" : "1";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            marginRight: 24,
            whiteSpace: "nowrap",
          }}
        >
          Swipe AI Interview
        </div>

        {/* Add this wrapper to force menu to expand */}
        <div style={{ flex: 1 }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={[
              { key: "1", label: <Link to="/">Interviewee</Link> },
              { key: "2", label: <Link to="/dashboard">Interviewer</Link> },
            ]}
          />
        </div>
      </Header>


      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Interviewee />} />
          <Route path="/dashboard" element={<InterviewerDashboard />} />
        </Routes>
      </Content>
    </Layout>
  );
}
