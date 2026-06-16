import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    axios.get("http://localhost:6000/")
      .then(res => setMsg(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-cream font-poppins p-8">
      <h1 className="text-2xl font-bold text-brown-light mb-2">Frontend Connected ✅</h1>
      <p className="text-cream-muted">Message from backend: {msg}</p>
    </div>
  );
}

export default App;
