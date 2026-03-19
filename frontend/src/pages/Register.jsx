import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", form);
      alert("✅ Registered successfully!");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-primary via-[#3a2d8a] to-dark text-light font-poppins">
      <div className="bg-dark w-[400px] p-10 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(108,99,255,0.4)] text-center">
        <h1 className="text-primary text-3xl font-bold mb-6">Chatzz 💬</h1>

        {error && <p className="text-red-400 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
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

          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={form.email}
            onChange={handleChange}
            className="p-3 rounded-md bg-[#1b1b1b] text-light border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />

          <button
            type="submit"
            className="bg-primary hover:bg-[#7b72ff] text-white font-semibold py-3 rounded-lg transition"
          >
            Register
          </button>

          <p className="text-sm mt-3">
            Already have an account?{" "}
            <span
              className="text-[#a094ff] cursor-pointer hover:underline"
              onClick={() => navigate("/")}
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
