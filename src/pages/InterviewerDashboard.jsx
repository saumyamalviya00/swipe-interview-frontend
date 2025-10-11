import React, { useEffect, useState } from "react";
import { Row, Col, Card, List, Avatar, Input, Spin, message, Typography } from "antd";
import { fetchCandidates } from "../api/interviewer";
import CandidateDetail from "../components/CandidateDetail";

const { Title } = Typography;
const { Search } = Input;

export default function InterviewerDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCandidates() {
    setLoading(true);
    try {
      const data = await fetchCandidates();
      if (Array.isArray(data)) {
        data.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        setCandidates(data);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  const filtered = candidates.filter((c) =>
    (c.name || "").toLowerCase().includes(filter.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Row gutter={16} style={{ padding: 20 }}>
      <Col xs={24} md={8}>
        <Card
          title={<Title level={4} style={{ margin: 0 }}>Candidates</Title>}
          extra={<Search placeholder="Search name or email" onSearch={(v) => setFilter(v)} onChange={(e) => setFilter(e.target.value)} style={{ width: 220 }} />}
          bodyStyle={{ padding: 8, maxHeight: "75vh", overflow: "auto" }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filtered}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedId(item.id)}
                  key={item.id}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{(item.name || "C").charAt(0).toUpperCase()}</Avatar>}
                    title={<div style={{ display: "flex", justifyContent: "space-between" }}><span>{item.name}</span><span style={{ fontWeight: 700 }}>{item.score ?? 0}</span></div>}
                    description={item.email}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Col>

      <Col xs={24} md={16}>
        {selectedId ? (
          <CandidateDetail candidateId={selectedId} />
        ) : (
          <Card>
            <div style={{ textAlign: "center", padding: 60 }}>
              <Title level={4}>Select a candidate to view details</Title>
            </div>
          </Card>
        )}
      </Col>
    </Row>
  );
}

