import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("isLogin", "true");
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        nav("/products");
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || "Login gagal");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">
        <h2>Welcome to Prospera</h2>
        <p className="subtitle">Ready to Prosper</p>

        <input className="input" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />

        <input className="input" placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)} />
          
        <div> 
          <button className="button" onClick={login}>
            Login
          </button>
        </div> 
      </div>
    </div>
  )};

const wrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh"
}