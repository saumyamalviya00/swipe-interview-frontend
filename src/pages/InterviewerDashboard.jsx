import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  List,
  Avatar,
  Input,
  Spin,
  message,
  Typography,
  Button,
  Space,
  Statistic,
  Tag,
  Dropdown,
  Tooltip,
} from "antd";
import { DownloadOutlined, ReloadOutlined, SwapOutlined, MoreOutlined } from "@ant-design/icons";
import { fetchCandidates } from "../api/interviewer";
import CandidateDetail from "../components/CandidateDetail";

const { Title } = Typography;
const { Search } = Input;

export default function InterviewerDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);

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
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
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

  const total = candidates.length;
  const scheduled = candidates.filter((c) => c.status === "scheduled").length;
  const completed = candidates.filter((c) => c.status === "completed").length;
  const declined = candidates.filter((c) => c.status === "declined").length;

  const filtered = candidates
    .filter((c) =>
      (c.name || "").toLowerCase().includes(filter.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(filter.toLowerCase())
    )
    .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter));

  const displayList = filtered.slice().sort((a, b) => (sortAsc ? (a.score ?? 0) - (b.score ?? 0) : (b.score ?? 0) - (a.score ?? 0)));

  function handleCandidateAction(action, item) {
    // simple client-side actions placeholder
    if (action === "message") {
      message.info(`Open chat with ${item.name}`);
    } else if (action === "schedule") {
      message.success(`Scheduled interview for ${item.name}`);
    } else if (action === "hire") {
      message.success(`${item.name} marked as Hired`);
    } else if (action === "reject") {
      message.error(`${item.name} marked as Rejected`);
    }
  }

  function exportCSV() {
    if (!candidates || candidates.length === 0) {
      message.info("No candidates to export");
      return;
    }
    const header = ["id", "name", "email", "phone", "score"].join(",") + "\n";
    const rows = candidates
      .map((c) => [c.id, c.name, c.email, c.phone || "", c.score || 0].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidates.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 20 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={6}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
            <Statistic title="Total Candidates" value={total} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card bodyStyle={{ padding: 16, background: "linear-gradient(90deg,#e6f7ff,#bae7ff)" }} style={{ borderRadius: 12 }}>
            <Statistic title="Scheduled" value={scheduled} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card bodyStyle={{ padding: 16, background: "linear-gradient(90deg,#f6ffed,#d9f7be)" }} style={{ borderRadius: 12 }}>
            <Statistic title="Completed" value={completed} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card bodyStyle={{ padding: 16, background: "linear-gradient(90deg,#fff1f0,#ffccc7)" }} style={{ borderRadius: 12 }}>
            <Statistic title="Declined" value={declined} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 12, maxHeight: "74vh", overflow: "auto" }}
            title={<Title level={4} style={{ margin: 0 }}>Candidates</Title>}
            extra={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Button icon={<DownloadOutlined />} onClick={exportCSV} type="primary">
                  Export
                </Button>
                <Button icon={<ReloadOutlined />} onClick={loadCandidates} />
                <Button icon={<SwapOutlined />} onClick={() => setSortAsc((s) => !s)} title="Toggle sort" />
              </div>
            }
          >
            <div className="controls">
              <Search className="search-full" placeholder="Search candidates or email" onSearch={(v) => setFilter(v)} onChange={(e) => setFilter(e.target.value)} />
            </div>

            <div className="status-filters">
              <Button type={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')}>All</Button>
              <Button type={statusFilter === 'scheduled' ? 'primary' : 'default'} onClick={() => setStatusFilter('scheduled')}>Scheduled</Button>
              <Button type={statusFilter === 'completed' ? 'primary' : 'default'} onClick={() => setStatusFilter('completed')}>Completed</Button>
              <Button type={statusFilter === 'declined' ? 'primary' : 'default'} onClick={() => setStatusFilter('declined')}>Declined</Button>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
            ) : (
              <List
                grid={{ gutter: 12, column: 1 }}
                dataSource={displayList}
                renderItem={(item) => (
                  <List.Item key={item.id} style={{ padding: 8 }}>
                    <Card
                      hoverable
                      onClick={() => setSelectedId(item.id)}
                      bodyStyle={{ padding: 12 }}
                      className={"candidate-card"}
                      style={{ width: "100%", borderRadius: 10, transition: "transform 200ms, box-shadow 200ms", boxShadow: item.id === selectedId ? "0 10px 30px rgba(24,144,255,0.12)" : undefined, transform: item.id === selectedId ? "translateY(-6px)" : undefined }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                                    <Avatar size={48} src={item.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(item.email || item.id)}`} className="candidate-avatar">{(!item.avatar && (item.name || "C").charAt(0).toUpperCase())}</Avatar>
                          <div style={{ marginLeft: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{item.name}</div>
                            <div style={{ color: "rgba(0,0,0,0.45)" }}>{item.email}</div>
                            <div style={{ marginTop: 6 }}>
                              <div className="sparkline" title={`Score: ${item.score ?? 0}`}>
                                <div className="sparkline-bar" style={{ width: `${Math.min(Math.max(item.score ?? 0, 0), 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <Tooltip title={`Score: ${item.score ?? 0}`}>
                            <div className={"score-badge"} style={{ fontWeight: 800, fontSize: 18, color: "#1890ff" }}>{item.score ?? 0}</div>
                          </Tooltip>
                          <div style={{ marginTop: 6 }}>
                            <Dropdown menu={{ items: [
                              { key: 'message', label: 'Message' },
                              { key: 'schedule', label: 'Schedule' },
                              { key: 'hire', label: 'Mark as Hired' },
                              { key: 'reject', label: 'Reject' },
                            ], onClick: ({ key }) => handleCandidateAction(key, item) }} trigger={["click"]}>
                              <Button shape="circle" size="small" icon={<MoreOutlined />} />
                            </Dropdown>
                          </div>
                          <div style={{ marginTop: 6 }}>
                            {item.status === "scheduled" && <Tag color="blue">Scheduled</Tag>}
                            {item.status === "completed" && <Tag color="green">Completed</Tag>}
                            {item.status === "declined" && <Tag color="red">Declined</Tag>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card style={{ borderRadius: 12 }}> 
            {selectedId ? (
              <CandidateDetail candidateId={selectedId} />
            ) : (
              <div style={{ textAlign: "center", padding: 80 }}>
                <Title level={4}>Select a candidate to view details</Title>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

