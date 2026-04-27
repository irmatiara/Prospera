import { Link } from "react-router-dom";

export default function Dashboard({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
      <div style={{
        width: "240px",
        background: "var(--blue-primary)",
        color: "white",
        padding: "20px"
      }}>
        <h2>Prospera</h2>

        <div style={{ marginTop: "30px" }}>
          <NavItem to="/products" label="📦 Products" />
          <NavItem to="/inventory" label="⚠ Inventory" />
          <NavItem to="/transactions" label="💰 Transactions" />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "25px" }}>
        {children}
      </div>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <Link to={to} style={{
      display: "block",
      color: "white",
      padding: "10px",
      borderRadius: "8px",
      textDecoration: "none",
      marginBottom: "10px"
    }}>
      {label}
    </Link>
  );
}