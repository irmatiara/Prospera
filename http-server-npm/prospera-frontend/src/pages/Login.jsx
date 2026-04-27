import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const login = (e) => {
    e.preventDefault();
    localStorage.setItem("user", email);
    nav("/products");
  };

  return (
    <div style={wrapper}>
      <form onSubmit={login} className="card" style={{ width: 300 }}>
        <h2 style={{ marginBottom: 20 }}>Login</h2>

        <input className="input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

        <button className="button" style={{ width: "100%", marginTop: 10 }}>
          Login
        </button>
      </form>
    </div>
  );
}

const wrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh"
};