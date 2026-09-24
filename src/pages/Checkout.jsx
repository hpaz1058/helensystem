import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { peso } from '../data';
import ConfirmModal from '../components/ConfirmModal';

export default function Checkout({ user, items, onPlaceOrder }) {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: user?.displayName || '', phone: '', address: '',
    paymentMethod: 'Cash on Delivery', gcashReference: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    setBusy(true);
    try {
      const order = await onPlaceOrder({ ...form, total, items });
      setSuccess(order);
    } catch (err) {
      setError(err.message || 'Unable to place order.');
    } finally {
      setBusy(false);
    }
  };

  return <>
    <div className="page">
      <h1 className="serif page-title">Checkout</h1>
      {!items.length ? <div className="empty">Your cart is empty.</div> :
        <div className="row g-4 mt-1">
          <div className="col-lg-7">
            <form className="info-card p-4" onSubmit={submit}>
              <h5 className="serif mb-3">Delivery details</h5>
              <div className="mb-3"><label className="form-label">Customer name</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="mb-3"><label className="form-label">Phone number</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
              <div className="mb-3"><label className="form-label">Delivery address</label><textarea className="form-control" rows="3" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required /></div>
              <div className="mb-3"><label className="form-label">Payment method</label><select className="form-select" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value, gcashReference: e.target.value === 'GCash' ? form.gcashReference : '' })}><option>Cash on Delivery</option><option>GCash</option></select></div>
              {form.paymentMethod === 'GCash' && <div className="mb-3"><label className="form-label">GCash reference number</label><input className="form-control" value={form.gcashReference} onChange={e => setForm({ ...form, gcashReference: e.target.value })} required /></div>}
              <button className="btn btn-darksoft w-100 mt-2" disabled={busy}>{busy ? 'Placing order…' : 'Place Order'}</button>
            </form>
          </div>
          <div className="col-lg-5">
            <div className="info-card p-4">
              <h5 className="serif">Order summary</h5>
              {items.map(i => <div className="d-flex justify-content-between gap-3 py-2 border-bottom" key={i.id}><span>{i.name} × {i.quantity}</span><span>{peso(i.price * i.quantity)}</span></div>)}
              <div className="d-flex justify-content-between fw-bold fs-5 pt-3"><span>Total</span><span>{peso(total)}</span></div>
            </div>
          </div>
        </div>}
    </div>
    <ConfirmModal
      open={Boolean(error)}
      title="Unable to place order"
      message={error}
      confirmText="Close"
      icon="bi-exclamation-circle"
      onCancel={() => setError('')}
      onConfirm={() => setError('')}
    />
    <ConfirmModal
      open={Boolean(success)}
      title="Order confirmed"
      message={success ? `Your order #${String(success.id).slice(-6)} has been placed successfully.` : ''}
      confirmText="View my orders"
      cancelText="Continue shopping"
      icon="bi-check2-circle"
      onCancel={() => nav('/shop')}
      onConfirm={() => nav('/orders')}
    />
  </>;
}
