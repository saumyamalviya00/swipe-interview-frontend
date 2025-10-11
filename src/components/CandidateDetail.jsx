import React, { useEffect, useState } from "react";
import { Card, Descriptions, List, Typography, Spin, message } from "antd";
import { fetchCandidateProfile, fetchCandidateChat, fetchCandidateSummary } from "../api/interviewer";

const { Title, Paragraph } = Typography;

export default function CandidateDetail({ candidateId }) {
  const [profile, setProfile] = useState(null);
  const [chat, setChat] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, ch, s] = await Promise.all([
        fetchCandidateProfile(candidateId),
        fetchCandidateChat(candidateId),
        fetchCandidateSummary(candidateId),
      ]);
      setProfile(p || null);
      setChat(ch || []);
      setSummary(s || null);
    } catch (err) {
      console.error(err);
      message.error("Failed to load candidate details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>Profile</Title>
        {profile ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Name">{profile.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{profile.phone}</Descriptions.Item>
            <Descriptions.Item label="Score">{profile.score ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Resume">{profile.resume_text ? <Paragraph ellipsis={{ rows: 3 }}>{profile.resume_text}</Paragraph> : "-"}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Paragraph>No profile available.</Paragraph>
        )}
      </Card>

      <Card title="Chat History" style={{ marginBottom: 16 }}>
        {chat.length === 0 ? (
          <Paragraph>No chat history available.</Paragraph>
        ) : (
          <List
            size="small"
            dataSource={chat}
            renderItem={(m) => (
              <List.Item>
                <List.Item.Meta
                  title={`${m.from} • ${new Date(m.timestamp).toLocaleString()}`}
                  description={m.message}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="AI Summary">
        {summary ? (
          <>
            <Title level={5}>Final Score: {summary.final_score ?? summary.score ?? "-"}</Title>
            <Paragraph>{summary.summary ?? summary.text ?? "-"}</Paragraph>
          </>
        ) : (
          <Paragraph>No summary available.</Paragraph>
        )}
      </Card>
    </div>
  );
}
