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
      message.error(err.response?.data?.detail || "Failed to fetch profile");
    }
  };

  useEffect(() => {
    fetchProfile();

    // Restore state from localStorage
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (savedState && savedState.interviewStarted) {
      setInterviewStarted(true);
      setCurrentQuestion(savedState.currentQuestion);
      setAnswer(savedState.answer);
      setQuestionsDone(savedState.questionsDone);
      setTotalQuestions(savedState.totalQuestions);
      setTimer(savedState.timer);
      startTimer(savedState.timer);
    }

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
      const res = await axios.post("/interview/start");
      const q = res.data.next_question;
      setCurrentQuestion(q);
      setQuestionsDone(res.data.questions_done);
      setTotalQuestions(res.data.total_questions);
      setInterviewStarted(true);
      setAnswer("");
      const duration = getTimeForDifficulty(q.difficulty);
      startTimer(duration);

      saveState({
        interviewStarted: true,
        currentQuestion: q,
        answer: "",
        questionsDone: res.data.questions_done,
        totalQuestions: res.data.total_questions,
        timer: duration,
      });
    } catch (err) {
      console.log(err);
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
      ) : (
        <Card title={`Question ${questionsDone + 1} of ${totalQuestions}`} style={{ marginTop: 20 }}>
          <p><strong>Q:</strong> {currentQuestion.question}</p>
          <p>Difficulty: {currentQuestion.difficulty}</p>
          <p>⏳ Time left: {timer}s</p>

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
      )}
    </div>
  );
};

export default Interviewee;
