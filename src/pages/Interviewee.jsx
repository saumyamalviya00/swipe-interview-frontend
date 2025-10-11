import React, { useEffect, useState, useRef } from "react";
import { message, Button, Card, Upload, Progress, Input } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "../api/axios";

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

  const timerRef = useRef(null);

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
    return () => clearInterval(timerRef.current);
  }, []);

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
        message.success(`Interview completed! Score: ${res.data.score}`);
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

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "50px auto" }}>
      <Card title="Candidate Profile">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone:</strong> {profile.phone}</p>
      </Card>

      <Upload
        customRequest={handleUpload}
        accept=".pdf,.doc,.docx"
        showUploadList={false}
        style={{ marginTop: 20 }}
      >
        <Button icon={<UploadOutlined />} style={{ marginTop: 10 }}>
          Upload Resume
        </Button>
      </Upload>

      {resumeText && (
        <Card title="Extracted Resume Text" style={{ marginTop: 20 }}>
          <pre>{resumeText}</pre>
        </Card>
      )}

      {!interviewStarted ? (
        <Button
          type="primary"
          style={{ marginTop: 20 }}
          onClick={handleStartInterview}
        >
          Start Interview
        </Button>
      ) : currentQuestion ? (
        <Card title={`Question ${questionsDone + 1} of ${totalQuestions}`} style={{ marginTop: 20 }}>
          <p><strong>Q:</strong> {currentQuestion.question || 'Loading question...'}</p>
          <p>Difficulty: {currentQuestion.difficulty || 'medium'}</p>
          <p>⏳ Time left: {timer}s</p>
          <p className="text-muted">Attempted: {questionsDone} questions</p>

          <Input.TextArea
            rows={4}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              saveState({
                interviewStarted,
                currentQuestion,
                answer: e.target.value,
                questionsDone,
                totalQuestions,
                timer,
              });
            }}
            placeholder="Type your answer here..."
          />
          <Button
            type="primary"
            style={{ marginTop: 10 }}
            onClick={() => handleSubmit(answer)}
          >
            Submit Answer
          </Button>

          <Progress
            percent={(questionsDone / totalQuestions) * 100}
            style={{ marginTop: 10 }}
          />
        </Card>
      ) : (
        <Card style={{ marginTop: 20 }}>
          <p>Loading interview session...</p>
        </Card>
      )}
    </div>
  );
};

export default Interviewee;
