// src/pages/Interviewee.jsx
import React from "react";
import { Card, Button } from "antd";

export default function Interviewee() {
  return (
    <div>
      <Card title="Interviewee" style={{ maxWidth: 900 }}>
        <p>This is the Interviewee tab (chat). We'll add resume upload, start interview, timers next.</p>
        <Button type="primary">(placeholder) Start interview</Button>
      </Card>
    </div>
  );
}
