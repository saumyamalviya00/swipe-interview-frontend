// src/App.jsx
import React from "react";
import { Layout, Menu, Button } from "antd";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import Interviewee from "./pages/Interviewee";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const { Header, Content } = Layout;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = !!localStorage.getItem("access_token");
  const userRole = localStorage.getItem("user_role") || "interviewee";
  const userName = localStorage.getItem("user_name") || "User";
  
  const selectedKey =
    location.pathname === "/interviewer" || location.pathname === "/dashboard"
      ? "2"
      : location.pathname === "/login" || location.pathname === "/signup"
      ? null
      : "1";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("swipe_interview_state");
    navigate("/login");
  };

  // Build menu items based on user role
  const menuItems = [];
  if (userRole === "interviewee" || userRole === "interviewer") {
    if (userRole === "interviewee") {
      menuItems.push({ key: "1", label: <Link to="/interviewee">My Interview</Link> });
    }
    if (userRole === "interviewer") {
      menuItems.push({ key: "2", label: <Link to="/interviewer">Dashboard</Link> });
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {loggedIn && (
        <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
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

            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={menuItems}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "white" }}>
              <UserOutlined /> {userName}
            </span>
            <Button 
              type="text" 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              style={{ color: "white" }}
            >
              Logout
            </Button>
          </div>
        </Header>
      )}

      <Content style={{ padding: loggedIn ? 24 : 0 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/interviewee" element={<Interviewee />} />
          <Route path="/interviewer" element={<InterviewerDashboard />} />
          {/* Redirect old routes */}
          <Route path="/" element={<Interviewee />} />
          <Route path="/dashboard" element={<InterviewerDashboard />} />
        </Routes>
      </Content>
    </Layout>
  );
}
