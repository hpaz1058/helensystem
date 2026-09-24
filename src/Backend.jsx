// Adapted from the provided Backend.jsx. The original component used
// GET/POST http://localhost:8080/api/product; this version keeps that
// REST shape while adding refresh/error handling for the Thread & Co. app.
import { useEffect, useState } from 'react';

export default function Backend() {
  const [product, setProduct] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const api_url = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/product`;

  const loadProducts = async () => {
    const response = await fetch(api_url);
    const data = await response.json();
    setProduct(data.products || data);
  };

  useEffect(() => { loadProducts().catch(console.error); }, []);

  async function formSubmit(e) {
    e.preventDefault();
    try {
      await fetch(api_url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,price:Number(price)}) });
      setName(''); setPrice(''); await loadProducts();
    } catch (err) { console.log(err); }
  }

  return <div className="page"><h1 className="serif">Product API</h1><form onSubmit={formSubmit} className="info-card p-3 mb-4"><input className="form-control mb-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required/><input className="form-control mb-2" type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" required/><button className="btn btn-darksoft">Submit</button></form><div className="admin-table"><table className="table"><thead><tr><th>Name</th><th>Price</th></tr></thead><tbody>{product.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.price}</td></tr>)}</tbody></table></div></div>;
}
