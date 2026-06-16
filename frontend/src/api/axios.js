import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://realtime-chat-app-1-p6hq.onrender.com/api",
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    // #region agent log
    fetch('http://127.0.0.1:7553/ingest/a0c42aab-7475-43a0-8a56-ebfbce0f7080',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8315b0'},body:JSON.stringify({sessionId:'8315b0',location:'axios.js:responseError',message:'API request failed',data:{url:err.config?.url,status:err.response?.status,msg:err.response?.data?.msg,error:err.response?.data?.error},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    return Promise.reject(err);
  }
);

export default API;