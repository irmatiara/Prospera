import { useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";

export default function Inventory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/products")
      .then(res => res.json())
      .then(setItems);
  }, []);

  return (
    <Dashboard>
      <h2>Inventory Alerts</h2>

      {items.map(i => {
        const low = i.stock < 10;

        return (
          <div key={i.id} className="card" style={{
            borderLeft: low ? "5px solid red" : "5px solid var(--green-primary)"
          }}>
            <b>{i.name}</b>  
            <div>Stock: {i.stock}</div>

            {low && <span style={{ color: "red" }}>⚠ Low Stock</span>}
          </div>
        );
      })}
    </Dashboard>
  );
}