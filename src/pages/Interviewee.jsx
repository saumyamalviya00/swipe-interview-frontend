import React, { useEffect, useState, useRef } from "react";
import { message, Button, Card, Upload, Progress, Input, Avatar, Badge, Space, Tag, Typography, Divider, Steps, Modal, Tooltip, notification, Result, Statistic } from "antd";
import { UploadOutlined, ClockCircleOutlined, CheckCircleOutlined, TrophyOutlined, UserOutlined, PlayCircleOutlined, SendOutlined, FileTextOutlined, ThunderboltOutlined, FireOutlined, RocketOutlined, SmileOutlined, LikeOutlined, StarOutlined } from "@ant-design/icons";
import axios from "../api/axios";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Countdown } = Statistic;

const STORAGE_KEY = "swipe_interview_state";

const Interviewee = () => {
  const [profile, setProfile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [questionsDone, setQuestionsDone] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [timer, setTimer] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [interviewResults, setInterviewResults] = useState(null);

  const timerRef = useRef(null);
  const typingTimerRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/candidate/profile");
      setProfile(res.data);
      if (res.data.resume_text) setResumeText(res.data.resume_text);
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401) {
        // Unauthorized - token invalid or expired
        localStorage.removeItem("access_token");
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/login";
        return;
      }
      message.error(err.response?.data?.detail || "Failed to fetch profile");
    }
  };

  const checkInterviewStatus = async () => {
    try {
      console.log("Checking interview status...");
      const res = await axios.get("/interview/status");
      console.log("Interview status response:", res.data);
      
      if (res.data.status === "completed") {
        console.log("Interview is completed, showing start button");
        setInterviewStarted(false);
        return;
      }

      // Load saved state first
      const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
      console.log("Saved state from localStorage:", savedState);

      setInterviewStarted(true);
      const qa_pairs = res.data.qa_pairs || [];
      const currentQuestionIndex = res.data.current_question;
      console.log("Current question index from backend:", currentQuestionIndex);
      console.log("QA pairs:", qa_pairs);

      if (qa_pairs.length > 0 && currentQuestionIndex < qa_pairs.length) {
        const currentQ = qa_pairs[currentQuestionIndex];
        console.log("Current question:", currentQ);
        
        setCurrentQuestion(currentQ);
        setQuestionsDone(currentQuestionIndex); // Update to use the backend's current_question
        setTotalQuestions(res.data.total_questions || 6);
        
        if (savedState?.interviewStarted) {
          setAnswer(savedState.answer || "");
          const difficulty = currentQ.difficulty || 'medium';
          const savedTimer = savedState.timer || getTimeForDifficulty(difficulty);
          console.log("Setting timer to:", savedTimer);
          setTimer(savedTimer);
          startTimer(savedTimer);
        } else {
          // Start new timer for this question
          const difficulty = currentQ.difficulty || 'medium';
          const newTimer = getTimeForDifficulty(difficulty);
          console.log("Setting new timer:", newTimer);
          setTimer(newTimer);
          startTimer(newTimer);
        }
      } else {
        console.log("No questions found, resetting interview");
        setInterviewStarted(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.log("Error checking interview status:", err);
      if (err.response?.status === 404) {
        console.log("No active interview found");
        setInterviewStarted(false);
        localStorage.removeItem(STORAGE_KEY);
      } else if (err.response?.status === 401) {
        console.log("Unauthorized, redirecting to login");
        localStorage.removeItem("access_token");
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/login";
      } else {
        console.error("Unexpected error:", err);
        message.error("Failed to check interview status");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    checkInterviewStatus();
    
    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'Enter' && answer.trim() && interviewStarted) {
        handleSubmit(answer);
      }
      if (e.key === 'Escape' && showTips) {
        setShowTips(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [answer, interviewStarted, showTips]);

  const saveState = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleUpload = async ({ file }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/candidate/upload_resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Resume uploaded successfully!");
      setResumeText(res.data.resume_text);
    } catch (err) {
      console.log(err);
      message.error(err.response?.data?.detail || "Failed to upload resume");
    }
  };

  const getTimeForDifficulty = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return 20;
      case "medium":
        return 60;
      case "hard":
        return 120;
      default:
        return 60;
    }
  };

  const startTimer = (duration) => {
    setTimer(duration);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(""); // auto-submit empty answer
          return 0;
        }
        const newTimer = prev - 1;
        saveState({
          interviewStarted,
          currentQuestion,
          answer,
          questionsDone,
          totalQuestions,
          timer: newTimer,
        });
        return newTimer;
      });
    }, 1000);
  };

  const handleStartInterview = async () => {
    try {
      console.log("Starting new interview...");
      // Clear any existing state
      localStorage.removeItem(STORAGE_KEY);
      
      const res = await axios.post("/interview/start");
      console.log("Start interview response:", res.data);
      
      if (!res.data.next_question) {
        throw new Error("No question received from server");
      }

      const q = res.data.next_question;
      const duration = getTimeForDifficulty(q.difficulty || 'medium');

      // Set all states at once to avoid race conditions
      setCurrentQuestion(q);
      setQuestionsDone(0);
      setTotalQuestions(res.data.total_questions || 6);
      setAnswer("");
      setTimer(duration);
      setInterviewStarted(true);

      // Start timer after states are set
      startTimer(duration);

      // Save to localStorage
      const newState = {
        interviewStarted: true,
        currentQuestion: q,
        answer: "",
        questionsDone: 0,
        totalQuestions: res.data.total_questions || 6,
        timer: duration,
      };
      console.log("Saving initial state:", newState);
      saveState(newState);
    } catch (err) {
      console.error("Error starting interview:", err);
      setInterviewStarted(false);
      localStorage.removeItem(STORAGE_KEY);
      message.error(err.response?.data?.detail || "Failed to start interview");
    }
  };

  const handleSubmit = async (ans) => {
    if (!currentQuestion) return;
    clearInterval(timerRef.current);

    // Show motivational message
    if (ans.trim().length > 50) {
      showMotivationalMessage();
      setStreak(prev => prev + 1);
    }

    try {
      const res = await axios.post("/interview/answer", { answer: ans });
      if (res.data.next_question) {
        const q = res.data.next_question;
        setCurrentQuestion(q);
        setAnswer("");
        setQuestionsDone(res.data.questions_done);
        startTimer(getTimeForDifficulty(q.difficulty));

        saveState({
          interviewStarted: true,
          currentQuestion: q,
          answer: "",
          questionsDone: res.data.questions_done,
          totalQuestions,
          timer: getTimeForDifficulty(q.difficulty),
        });
      } else if (res.data.message === "Interview completed") {
        // Store results data
        setInterviewResults({
          score: res.data.score,
          totalQuestions: res.data.questions_done,
          qa_pairs: res.data.qa_pairs || []
        });
        setShowResults(true);
        setShowConfetti(true);
        setCurrentQuestion(null);
        setAnswer("");
        setQuestionsDone(res.data.questions_done);
        setInterviewStarted(false);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.log(err);
      message.error(err.response?.data?.detail || "Failed to submit answer");
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  const getTimerColor = () => {
    if (timer > 60) return '#52c41a';
    if (timer > 30) return '#faad14';
    return '#ff4d4f';
  };

  const getMotivationalMessage = () => {
    const messages = [
      { icon: <FireOutlined />, text: "You're on fire! Keep going!", color: '#ff4d4f' },
      { icon: <RocketOutlined />, text: "Excellent answer! You're doing great!", color: '#1890ff' },
      { icon: <ThunderboltOutlined />, text: "Lightning fast! Amazing work!", color: '#faad14' },
      { icon: <StarOutlined />, text: "Star performance! Keep it up!", color: '#722ed1' },
      { icon: <LikeOutlined />, text: "Nailed it! You're crushing this!", color: '#52c41a' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const showMotivationalMessage = () => {
    const msg = getMotivationalMessage();
    notification.success({
      message: msg.text,
      icon: <span style={{ color: msg.color }}>{msg.icon}</span>,
      placement: 'topRight',
      duration: 2,
    });
    setShowMotivation(true);
    setTimeout(() => setShowMotivation(false), 2000);
  };

  const handleTyping = (value) => {
    setAnswer(value);
    setIsTyping(true);
    
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    saveState({
      interviewStarted,
      currentQuestion,
      answer: value,
      questionsDone,
      totalQuestions,
      timer,
    });
  };

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card loading style={{ width: 400 }} />
    </div>
  );

  // Results Page
  if (showResults && interviewResults) {
    const { score, totalQuestions, qa_pairs } = interviewResults;
    const percentage = Math.round((score / 100) * 100);
    
    // Calculate statistics
    const avgScorePerQuestion = qa_pairs.length > 0 ? Math.round(score / qa_pairs.length) : 0;
    const difficultyCounts = {
      easy: qa_pairs.filter(q => q.difficulty === 'easy').length,
      medium: qa_pairs.filter(q => q.difficulty === 'medium').length,
      hard: qa_pairs.filter(q => q.difficulty === 'hard').length
    };
    
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
        {/* Celebration Header */}
        <Card 
          style={{ 
            marginBottom: 24, 
            borderRadius: 16,
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            border: 'none',
            boxShadow: '0 10px 30px rgba(82, 196, 26, 0.3)',
            textAlign: 'center'
          }}
        >
          <TrophyOutlined style={{ fontSize: 80, color: '#fff', marginBottom: 16 }} />
          <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
            🎉 Interview Completed! 🎉
          </Title>
          <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
            Great job, {profile.name}! Here are your results.
          </Text>
        </Card>

        {/* Score Overview */}
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Title level={1} style={{ fontSize: 72, margin: 0, color: '#52c41a' }}>
              {score}
            </Title>
            <Text type="secondary" style={{ fontSize: 20 }}>
              Out of 100 Points
            </Text>
            <div style={{ marginTop: 24 }}>
              <Progress 
                percent={percentage} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
                strokeWidth={20}
                style={{ maxWidth: 600, margin: '0 auto' }}
              />
            </div>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' }}>
            <Statistic 
              title="Questions Answered" 
              value={totalQuestions} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
          
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)' }}>
            <Statistic 
              title="Average Score/Question" 
              value={avgScorePerQuestion} 
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
          
          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)' }}>
            <Statistic 
              title="Completion Rate" 
              value={percentage} 
              suffix="%" 
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>

          <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' }}>
            <Statistic 
              title="Performance" 
              value={score >= 70 ? "Excellent" : score >= 50 ? "Good" : "Fair"} 
              prefix={<SmileOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
          </Card>
        </div>

        {/* Difficulty Breakdown */}
        <Card 
          title={<><ThunderboltOutlined /> Question Difficulty Breakdown</>}
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Easy Questions</Text>
                <Text strong>{difficultyCounts.easy}</Text>
              </div>
              <Progress 
                percent={(difficultyCounts.easy / totalQuestions) * 100} 
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Medium Questions</Text>
                <Text strong>{difficultyCounts.medium}</Text>
              </div>
              <Progress 
                percent={(difficultyCounts.medium / totalQuestions) * 100} 
                strokeColor="#faad14"
                showInfo={false}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>Hard Questions</Text>
                <Text strong>{difficultyCounts.hard}</Text>
              </div>
              <Progress 
                percent={(difficultyCounts.hard / totalQuestions) * 100} 
                strokeColor="#ff4d4f"
                showInfo={false}
              />
            </div>
          </Space>
        </Card>

        {/* Individual Question Scores */}
        <Card 
          title={<><FileTextOutlined /> Question-by-Question Performance</>}
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {qa_pairs.map((qa, index) => (
              <Card 
                key={index}
                size="small"
                style={{ 
                  background: qa.score >= 15 ? '#f6ffed' : qa.score >= 10 ? '#fffbe6' : '#fff1f0',
                  border: `1px solid ${qa.score >= 15 ? '#b7eb8f' : qa.score >= 10 ? '#ffe58f' : '#ffccc7'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong>Q{index + 1}:</Text> {qa.question}
                    <div style={{ marginTop: 8 }}>
                      <Tag color={getDifficultyColor(qa.difficulty)}>
                        {qa.difficulty?.toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 16 }}>
                    <Title level={3} style={{ margin: 0, color: qa.score >= 15 ? '#52c41a' : qa.score >= 10 ? '#faad14' : '#ff4d4f' }}>
                      {qa.score || 0}/20
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>points</Text>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Card>

        {/* Thank You Message */}
        <Card 
          style={{ 
            borderRadius: 12, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
            border: '2px solid #ffa39e'
          }}
        >
          <Title level={3}>
            <SmileOutlined /> Thank You for Your Time!
          </Title>
          <Paragraph style={{ fontSize: 16 }}>
            Your interview has been successfully submitted and is under review. 
            Our team will get back to you shortly with the next steps.
          </Paragraph>
          <Paragraph type="secondary">
            Keep up the great work! 🚀
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => {
              setShowResults(false);
              setInterviewResults(null);
              window.location.reload();
            }}
            style={{ marginTop: 16 }}
          >
            Take Another Interview
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      {/* Animated Header Section */}
      <Card 
        className="profile-card-header"
        style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Avatar 
            size={80} 
            icon={<UserOutlined />}
            style={{ 
              background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
              border: '4px solid rgba(255,255,255,0.3)'
            }}
          />
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              {profile.name}
            </Title>
            <Space size={16} style={{ marginTop: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>📧 {profile.email}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>📱 {profile.phone}</Text>
            </Space>
          </div>
          {resumeText && (
            <Badge count={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
              <Tag color="success" icon={<FileTextOutlined />}>Resume Uploaded</Tag>
            </Badge>
          )}
        </div>
      </Card>

      {/* Resume Upload Section */}
      {!resumeText && (
        <Card 
          style={{ 
            marginBottom: 24, 
            borderRadius: 12,
            border: '2px dashed #d9d9d9',
            textAlign: 'center'
          }}
          className="upload-card"
        >
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={4}>Upload Your Resume</Title>
          <Paragraph type="secondary">
            Upload your resume to get personalized interview questions
          </Paragraph>
          <Upload
            customRequest={handleUpload}
            accept=".pdf,.doc,.docx"
            showUploadList={false}
          >
            <Button 
              type="primary" 
              size="large"
              icon={<UploadOutlined />}
              style={{ 
                borderRadius: 8,
                height: 48,
                minWidth: 200
              }}
            >
              Choose File
            </Button>
          </Upload>
        </Card>
      )}

      {resumeText && (
        <Card 
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span>Resume Preview</span>
            </Space>
          }
          extra={
            <Upload
              customRequest={handleUpload}
              accept=".pdf,.doc,.docx"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} size="small">
                Re-upload
              </Button>
            </Upload>
          }
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Paragraph 
            ellipsis={{ rows: 4, expandable: true, symbol: 'Read more' }}
            style={{ 
              maxHeight: 120, 
              overflow: 'auto',
              background: '#fafafa',
              padding: 12,
              borderRadius: 8,
              whiteSpace: 'pre-wrap'
            }}
          >
            {resumeText}
          </Paragraph>
        </Card>
      )}

      {/* Interview Section */}
      {!interviewStarted ? (
        <Card 
          style={{ 
            borderRadius: 16,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            border: 'none',
            overflow: 'hidden',
            position: 'relative'
          }}
          className="start-interview-card"
        >
          {/* Floating elements background */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(24,144,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            background: 'radial-gradient(circle, rgba(250,173,20,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <TrophyOutlined style={{ fontSize: 72, color: '#faad14', marginBottom: 24 }} />
            <Title level={2}>Ready to Begin Your Interview?</Title>
            <Paragraph style={{ fontSize: 16, marginBottom: 24, maxWidth: 600, margin: '0 auto 24px' }}>
              You'll be asked <Text strong>{totalQuestions} questions</Text>. Answer them to the best of your ability.
              Each question has a time limit based on its difficulty.
            </Paragraph>
            
            {/* Feature highlights */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16, 
              margin: '32px 0',
              textAlign: 'left'
            }}>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}>
                <Space>
                  <ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div>
                    <Text strong>Timed Questions</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Adaptive time limits</Text>
                  </div>
                </Space>
              </Card>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}>
                <Space>
                  <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  <div>
                    <Text strong>Auto-Save</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Never lose progress</Text>
                  </div>
                </Space>
              </Card>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 8 }}>
                <Space>
                  <RocketOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>
                    <Text strong>Smart Tips</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Helpful suggestions</Text>
                  </div>
                </Space>
              </Card>
            </div>

            <Space size="large" style={{ marginBottom: 24 }}>
              <Tag color="green" style={{ padding: '8px 16px', fontSize: 14 }}>
                <SmileOutlined /> Easy: 20s
              </Tag>
              <Tag color="orange" style={{ padding: '8px 16px', fontSize: 14 }}>
                <ThunderboltOutlined /> Medium: 60s
              </Tag>
              <Tag color="red" style={{ padding: '8px 16px', fontSize: 14 }}>
                <FireOutlined /> Hard: 120s
              </Tag>
            </Space>
            
            <Divider />
            
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleStartInterview}
              disabled={!resumeText}
              style={{ 
                height: 56,
                minWidth: 220,
                fontSize: 18,
                borderRadius: 12,
                boxShadow: resumeText ? '0 4px 12px rgba(24, 144, 255, 0.4)' : 'none',
                marginBottom: 16
              }}
              className="start-btn-pulse"
            >
              Start Interview Now
            </Button>
            
            {!resumeText && (
              <div style={{ 
                background: '#fff2e8',
                border: '1px solid #ffbb96',
                borderRadius: 8,
                padding: '12px 16px',
                marginTop: 16
              }}>
                <Text type="warning">
                  ⚠️ Please upload your resume first to begin
                </Text>
              </div>
            )}
            
            {resumeText && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                ✨ Press the button above or hit Enter to begin
              </Text>
            )}
          </div>
        </Card>
      ) : currentQuestion ? (
        <div>
          {/* Progress Steps */}
          <Card style={{ marginBottom: 16, borderRadius: 12 }}>
            <Steps
              current={questionsDone}
              size="small"
              items={Array.from({ length: totalQuestions }, (_, i) => ({
                title: `Q${i + 1}`,
                status: i < questionsDone ? 'finish' : i === questionsDone ? 'process' : 'wait'
              }))}
            />
          </Card>

          {/* Question Card */}
          <Card 
            style={{ 
              marginBottom: 16, 
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
                <Badge count={questionsDone + 1} style={{ backgroundColor: '#1890ff' }}>
                  <Tag color="blue" style={{ padding: '4px 12px', fontSize: 14 }}>
                    Question {questionsDone + 1} of {totalQuestions}
                  </Tag>
                </Badge>
                <Space>
                  <Tag 
                    color={getDifficultyColor(currentQuestion.difficulty)}
                    style={{ padding: '4px 12px', fontSize: 14 }}
                  >
                    {(currentQuestion.difficulty || 'medium').toUpperCase()}
                  </Tag>
                  <Tag 
                    icon={<ClockCircleOutlined />}
                    color={timer > 30 ? 'default' : 'error'}
                    style={{ 
                      padding: '4px 12px', 
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: getTimerColor()
                    }}
                  >
                    {timer}s
                  </Tag>
                </Space>
              </Space>

              <Divider style={{ margin: '16px 0' }} />

              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 20
                }}
              >
                <Title level={4} style={{ margin: 0 }}>
                  {currentQuestion.question || 'Loading question...'}
                </Title>
              </div>

              <div style={{ position: 'relative' }}>
                <TextArea
                  rows={8}
                  value={answer}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type your answer here... Be clear and concise."
                  style={{ 
                    fontSize: 16,
                    borderRadius: 8,
                    resize: 'vertical'
                  }}
                  autoFocus
                />

                {isTyping && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    left: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    <Text type="secondary" style={{ fontSize: 12 }}>typing...</Text>
                  </div>
                )}
              </div>

              <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
                <Space wrap>
                  <Badge count={answer.length} overflowCount={999} showZero style={{ backgroundColor: '#1890ff' }}>
                    <Tag>Characters</Tag>
                  </Badge>
                  <Badge count={answer.trim().split(/\s+/).filter(w => w).length} overflowCount={999} showZero style={{ backgroundColor: '#52c41a' }}>
                    <Tag>Words</Tag>
                  </Badge>
                  {answer.length > 100 && <Tag color="success" icon={<CheckCircleOutlined />}>Good length!</Tag>}
                  {answer.length > 200 && <Tag color="purple" icon={<StarOutlined />}>Excellent!</Tag>}
                  {streak > 0 && (
                    <Tag color="orange" icon={<FireOutlined />}>
                      {streak} streak 🔥
                    </Tag>
                  )}
                </Space>
                <Space>
                  <Tooltip title="Press Ctrl+Enter to submit">
                    <Text type="secondary" style={{ fontSize: 12 }}>⌨️ Ctrl+↵</Text>
                  </Tooltip>
                  <Tooltip title="Quick tips">
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => setShowTips(!showTips)}
                    >
                      {showTips ? 'Hide' : 'Show'} Tips
                    </Button>
                  </Tooltip>
                </Space>
              </Space>
            </div>

            <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
              <div style={{ flex: 1, maxWidth: 400 }}>
                <Progress
                  percent={Math.round((questionsDone / totalQuestions) * 100)}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  status="active"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {questionsDone} of {totalQuestions} completed
                </Text>
              </div>
              <Space>
                <Tooltip title="Skip this question">
                  <Button
                    size="large"
                    onClick={() => handleSubmit("")}
                    style={{ 
                      height: 48,
                      borderRadius: 8,
                    }}
                  >
                    Skip
                  </Button>
                </Tooltip>
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => handleSubmit(answer)}
                  disabled={!answer.trim()}
                  loading={false}
                  style={{ 
                    height: 48,
                    minWidth: 160,
                    borderRadius: 8,
                    fontSize: 16,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  className="submit-btn-animated"
                >
                  Submit Answer
                </Button>
              </Space>
            </Space>
          </Card>

          {/* Animated Stats Card */}
          <Card 
            style={{ 
              marginTop: 16,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
            }}
          >
            <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
              <Statistic
                title="Questions Done"
                value={questionsDone}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
              <Divider type="vertical" style={{ height: 60 }} />
              <Statistic
                title="Remaining"
                value={totalQuestions - questionsDone}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Divider type="vertical" style={{ height: 60 }} />
              <Statistic
                title="Time Left"
                value={timer}
                suffix="sec"
                valueStyle={{ color: getTimerColor() }}
              />
            </Space>
          </Card>

          {/* Helpful Tips Card */}
          {showTips && (
            <Card 
              title={
                <Space>
                  <SmileOutlined style={{ color: '#faad14' }} />
                  <span>Quick Tips</span>
                </Space>
              }
              size="small"
              extra={
                <Button type="link" size="small" onClick={() => setShowTips(false)}>
                  Close
                </Button>
              }
              style={{ 
                marginTop: 16,
                borderRadius: 8,
                background: '#fffbf0',
                border: '1px solid #ffe58f',
                animation: 'slideInRight 0.5s ease'
              }}
            >
              <Space direction="vertical" size={8}>
                <Text type="secondary">• Type your answer in the text area below</Text>
                <Text type="secondary">• Aim for 100+ characters for better evaluation</Text>
                <Text type="secondary">• Structure: Introduction → Main Points → Conclusion</Text>
                <Text type="secondary">• You can skip questions if needed</Text>
                <Text type="secondary">• Your progress is auto-saved continuously</Text>
              </Space>
            </Card>
          )}
        </div>
      ) : (
        <Card 
          style={{ 
            marginTop: 20, 
            borderRadius: 12,
            textAlign: 'center'
          }}
          loading
        >
          <p>Loading interview session...</p>
        </Card>
      )}
    </div>
  );
};

export default Interviewee;
