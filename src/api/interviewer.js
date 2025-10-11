import axios from "./axios";

// axios baseURL already set to http://localhost:8000/api in src/api/axios.js
// so keep API_BASE empty to avoid doubling the /api prefix
const API_BASE = "";

function authHeaders() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCandidates() {
  const res = await axios.get(`${API_BASE}/interviewer/candidates`, { headers: authHeaders() });
  return res.data;
}

export async function fetchCandidateProfile(id) {
  const res = await axios.get(`${API_BASE}/interviewer/candidate/${id}`, { headers: authHeaders() });
  return res.data;
}

export async function fetchCandidateChat(id) {
  const res = await axios.get(`${API_BASE}/interviewer/candidate/${id}/chat`, { headers: authHeaders() });
  return res.data;
}

export async function fetchCandidateSummary(id) {
  const res = await axios.get(`${API_BASE}/interviewer/candidate/${id}/summary`, { headers: authHeaders() });
  return res.data;
}
