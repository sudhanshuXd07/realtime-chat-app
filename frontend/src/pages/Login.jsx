import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("✅ Login successful!");
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-primary via-[#3a2d8a] to-dark text-light font-poppins">
      <div className="bg-dark w-[400px] p-10 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(108,99,255,0.4)] text-center">
        <h1 className="text-primary text-3xl font-bold mb-6">Chatzz 💬</h1>

        {error && <p className="text-red-400 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={form.email}
            onChange={handleChange}
            className="p-3 rounded-md bg-[#1b1b1b] text-light border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="p-3 rounded-md bg-[#1b1b1b] text-light border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />

          <div className="text-left text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label>Show Password</label>
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-[#7b72ff] text-white font-semibold py-3 rounded-lg transition"
          >
            Login
          </button>

          <p className="text-sm mt-3">
            Don’t have an account?{" "}
            <span
              className="text-[#a094ff] cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
