import React from 'react';
import {Link} from 'react-router-dom';
import {categories,peso,getProductImage} from '../data';

export default function Home({products}){
  const arrivals=products.slice(0,4);
  return <div className="page">
    <section className="hero hero-home">
      <div className="hero-model" aria-hidden="true"/>
      <div className="hero-copy">
        <div className="text-uppercase small fw-semibold" style={{letterSpacing:'.2em'}}>Style made simple</div>
        <h1>Modern Wardrobe Essentials</h1>
        <p>Modern wardrobe essentials designed for everyday confidence.</p>
        <Link to="/shop" className="btn btn-soft">Shop Now <i className="bi bi-arrow-right ms-2"/></Link>
      </div>
    </section>
    <section className="mt-5">
      <div className="d-flex justify-content-between align-items-end mb-3"><h2 className="section-title m-0">Shop by Category</h2><Link to="/shop" className="small text-dark">View all</Link></div>
      <div className="row g-3">{categories.map(c=><div className="col-6 col-md-3" key={c.name}><Link to={`/category/${c.name}`} className="text-decoration-none text-dark"><div className="category-card"><img src={c.image} alt={c.name}/><div className="label">{c.name}</div></div></Link></div>)}</div>
    </section>
    <section className="mt-5">
      <div className="d-flex justify-content-between align-items-end mb-3"><h2 className="section-title m-0">New Arrivals</h2><Link to="/shop" className="small text-dark">Shop all</Link></div>
      <div className="shop-grid">{arrivals.map(p=><Link to={`/product/${p.id}`} key={p.id} className="text-decoration-none text-dark"><div className="product-card"><img className="product-image" src={getProductImage(p)} alt={p.name}/><div className="product-body"><div className="product-name">{p.name}</div><div className="price">{peso(p.price)}</div></div></div></Link>)}</div>
    </section>
    <div className="footer">Thread & Co. · Look good. Feel good.</div>
  </div>
}
