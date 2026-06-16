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
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-black via-black-light to-brown-deeper font-poppins">
      <div className="bg-cream w-[400px] p-10 rounded-2xl border border-brown/20 shadow-card text-center">
        <h1 className="text-brown text-3xl font-bold mb-2">Chatzz 💬</h1>
        <p className="text-cream-dim text-sm mb-6">Create your account</p>

        {error && (
          <p className="text-brown-deeper bg-brown/10 border border-brown/30 rounded-lg px-3 py-2 mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <div className="text-left text-sm flex items-center gap-2 text-black">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="accent-brown"
            />
            <label>Show Password</label>
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={form.email}
            onChange={handleChange}
            className="auth-input"
            required
          />

          <button type="submit" className="auth-btn">
            Register
          </button>

          <p className="text-sm mt-3 text-black/70">
            Already have an account?{" "}
            <span className="auth-link" onClick={() => navigate("/")}>
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
