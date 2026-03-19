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
    <div>
      <h1>Frontend Connected ✅</h1>
      <p>Message from backend: {msg}</p>
    </div>
  );
}

export default App;
