import React from 'react';
import { Link } from 'react-router-dom';

export default function Welcome(){
  return <div className="auth-page welcome-page" style={{padding:0}}>
    <section className="hero hero-welcome w-100 rounded-0" style={{minHeight:'100vh',borderRadius:0}}>
      <div className="hero-model" aria-hidden="true"/>
      <div className="hero-copy">
        <div className="text-uppercase small fw-semibold" style={{letterSpacing:'.28em'}}>Style made simple</div>
        <h1>Modern<br/>Wardrobe<br/>Essentials</h1>
        <p>Designed for everyday confidence.</p>
        <div className="d-flex flex-wrap gap-2 mt-4"><Link to="/shop" className="btn btn-soft text-decoration-none">Shop Collection <i className="bi bi-arrow-right ms-2"/></Link><Link to="/login" className="btn btn-outline-light rounded-pill px-4">Login</Link></div>
        <div className="row mt-5 g-3"><div className="col-4"><i className="bi bi-stars fs-4"/><div className="small mt-2">Build Your<br/>Wardrobe</div></div><div className="col-4"><i className="bi bi-sparkles fs-4"/><div className="small mt-2">Discover<br/>New Styles</div></div><div className="col-4"><i className="bi bi-heart fs-4"/><div className="small mt-2">Look Good,<br/>Feel Good</div></div></div>
      </div>
    </section>
  </div>
}
