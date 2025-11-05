import React, { useEffect, useState, useRef } from "react";
import { Card, Descriptions, List, Typography, Spin, message, Progress, Button, Space, Avatar, Rate, Input, Tooltip } from "antd";
import { fetchCandidateProfile, fetchCandidateChat, fetchCandidateSummary } from "../api/interviewer";

const { Title, Paragraph } = Typography;

export default function CandidateDetail({ candidateId }) {
  const [profile, setProfile] = useState(null);
  const [chat, setChat] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [chatFilter, setChatFilter] = useState("");
  const [composer, setComposer] = useState("");
  const chatRef = useRef(null);
  const resumeRef = useRef(null);

  useEffect(() => {
    if (!candidateId) return;
    loadAll();
    // load notes and rating from localStorage
    setNotes(localStorage.getItem(`notes_${candidateId}`) || "");
    setRating(Number(localStorage.getItem(`rating_${candidateId}`)) || 0);
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

  useEffect(() => {
    // whenever chat changes, scroll to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  if (loading) return <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>;

  function copySummary() {
    const text = summary?.summary || summary?.text || "";
    if (!text) return message.info("No summary to copy");
    navigator.clipboard.writeText(text).then(() => message.success("Summary copied to clipboard"));
  }

  function saveNotes() {
    if (!candidateId) return;
    localStorage.setItem(`notes_${candidateId}`, notes);
    message.success("Notes saved");
  }

  function onRate(v) {
    setRating(v);
    if (candidateId) localStorage.setItem(`rating_${candidateId}`, v);
    message.success("Rating saved");
  }

  function sendMessage() {
    const text = composer?.trim();
    if (!text) return;
    const msg = { from: 'interviewer', message: text, timestamp: Date.now() };
    setChat((s) => [...s, msg]);
    setComposer("");
    message.success("Message sent (local)");
    // TODO: call backend API to persist/send
  }

  function copyTimestamp(ts) {
    const t = new Date(ts).toLocaleString();
    navigator.clipboard.writeText(t).then(() => message.info("Timestamp copied"));
  }

  function jumpToResume() {
    if (resumeRef.current) resumeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      <Card style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', padding: 0 }} className="profile-card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16 }}>
          <div className="avatar-ring">
            <Avatar size={72} style={{ background: 'linear-gradient(135deg,#ffd6e7,#ffd6b8)', color: '#111', fontSize: 28 }}>{(profile?.name || 'C').charAt(0).toUpperCase()}</Avatar>
          </div>
          <div style={{ flex: 1 }}>
            <div className="profile-name" style={{ fontSize: 20 }}>{profile?.name || '-'}</div>
            <div className="profile-meta" style={{ marginTop: 6 }}>{profile?.email || '-'} • {profile?.phone || '-'}</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 140 }}>
                <Progress percent={Math.min(Math.max(profile?.score || 0, 0), 100)} status="active" />
              </div>
              <div style={{ fontWeight: 800 }} className="score-badge">{profile?.score ?? '-'}</div>
            </div>
          </div>
          <div style={{ padding: 12, textAlign: 'right' }}>
            <Space direction="vertical">
              <Button size="small" onClick={() => window.open(`mailto:${profile?.email}`)}>Email</Button>
              <Button size="small" onClick={() => window.open(`tel:${profile?.phone}`)}>Call</Button>
              <Button size="small" onClick={jumpToResume}>Jump to Resume</Button>
            </Space>
          </div>
        </div>
        <div style={{ padding: '0 16px 14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="small-muted">Your rating</div>
            <Rate value={rating} onChange={onRate} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button size="small" onClick={() => { navigator.clipboard.writeText(profile?.email || ''); message.success('Email copied'); }}>Copy Email</Button>
          </div>
        </div>
      </Card>

      <Card title={<span><span className="title-dot" /> Chat History</span>} style={{ marginBottom: 16, borderRadius: 10 }} bodyStyle={{ padding: 12 }} className="chat-card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Input.Search placeholder="Search messages" allowClear onSearch={(v) => setChatFilter(v)} onChange={(e) => setChatFilter(e.target.value)} style={{ flex: 1 }} />
        </div>
        {chat.length === 0 ? (
          <Paragraph>No chat history available.</Paragraph>
        ) : (
          <div className="chat-list chat-scroll" ref={chatRef} style={{ maxHeight: 320, overflow: 'auto', padding: 6 }}>
            {chat.filter(m => !chatFilter || (m.message || '').toLowerCase().includes(chatFilter.toLowerCase())).map((m, idx) => (
              <div key={idx} className={`chat-row ${m.from === 'candidate' ? 'row-left' : 'row-right'}`}>
                <div className={`bubble ${m.from === 'candidate' ? 'bubble-left' : 'bubble-right'}`}>
                  <div className="chat-meta">{m.from} • <span className="chat-time">{new Date(m.timestamp).toLocaleString()}</span> <Tooltip title="Copy timestamp"><Button size="small" type="link" onClick={() => copyTimestamp(m.timestamp)}>Copy</Button></Tooltip></div>
                  <div className="chat-body" style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Input.TextArea value={composer} onChange={(e) => setComposer(e.target.value)} rows={2} placeholder="Type a message..." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button type="primary" onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </Card>

      <div ref={resumeRef}>
        <Card title="Resume Preview" style={{ marginBottom: 16, borderRadius: 10 }} bodyStyle={{ padding: 12 }}>
          {profile?.resume_text ? <Paragraph style={{ maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{profile.resume_text}</Paragraph> : <Paragraph>No resume available.</Paragraph>}
        </Card>
      </div>

  <Card title="AI Summary" style={{ borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={5} style={{ marginBottom: 6 }}>Final Score: {summary?.final_score ?? summary?.score ?? "-"}</Title>
            <div className="small-muted">Model summary of the candidate performance</div>
          </div>
          <div>
            <Space>
              <Button size="small" onClick={copySummary}>Copy</Button>
              <Button size="small" onClick={() => { const blob = new Blob([summary?.summary || summary?.text || ""], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `summary-${candidateId}.txt`; a.click(); URL.revokeObjectURL(url); }}>Download</Button>
            </Space>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>{summary ? <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{summary.summary ?? summary.text ?? "-"}</Paragraph> : <Paragraph>No summary available.</Paragraph>}</div>
      </Card>
    </div>
  );
}
