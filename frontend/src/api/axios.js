import axios from "axios";

const API = axios.create({
  baseURL: "https://realtime-chat-app-1-p6hq.onrender.com", // backend base URL
});

// Attach token automatically (for protected routes later)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
