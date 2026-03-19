import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api", // backend base URL
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
