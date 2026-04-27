import { useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");

  const fetchData = () => {
    fetch("http://127.0.0.1:5000/products")
      .then(res => res.json())
      .then(setProducts);
  };

  useEffect(fetchData, []);

  const add = async () => {
    await fetch("http://127.0.0.1:5000/products", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name, stock: Number(stock) })
    });
    setName(""); setStock("");
    fetchData();
  };

  return (
    <Dashboard>
      <h2>Products</h2>

      <div className="card">
        <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} />
        <button className="button" onClick={add}>Add</button>
      </div>

      <div style={{ marginTop: 20 }}>
        {products.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 10 }}>
            <b>{p.name}</b>  
            <div style={{ color: "var(--text-secondary)" }}>Stock: {p.stock}</div>
          </div>
        ))}
      </div>
    </Dashboard>
  );
}