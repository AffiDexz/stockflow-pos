import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';

export default function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState('');
  const [order, setOrder] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [paying, setPaying] = useState(false);
  const idempotencyKey = useRef(null);

  // Redirect if the cart is empty and no order has been placed.
  useEffect(() => {
    if (items.length === 0 && !order) navigate('/products');
  }, [items, order, navigate]);

  async function reserve() {
    setReserving(true);
    try {
      const payload = {
        customer: customer.trim() || 'Guest',
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
      const { data } = await api.post('/orders', payload);
      idempotencyKey.current = crypto.randomUUID();
      setOrder(data);
      clear();
      toast.success('Stock reserved for 5 minutes.');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setReserving(false);
    }
  }

  async function pay(outcome) {
    setPaying(true);
    try {
      const { data } = await api.post(`/orders/${order.id}/payment`, {
        outcome,
        idempotencyKey: idempotencyKey.current,
      });
      setOrder(data.order);
      if (data.order.status === 'PAID') toast.success('Payment successful — order confirmed.');
      else if (data.order.status === 'FAILED') toast.error('Payment failed — stock released.');
      else if (data.order.status === 'EXPIRED') toast.info('Payment timed out — reservation expired.');
      setTimeout(() => navigate(`/orders/${order.id}`), 1200);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Order Summary</h2>
        <div className="divide-y divide-slate-100">
          {(order?.items || items).map((i) => (
            <div key={i.productId || i.id} className="flex justify-between py-2 text-sm">
              <span className="text-slate-600">
                {i.name} <span className="text-slate-400">× {i.quantity}</span>
              </span>
              <span className="font-medium text-slate-700">
                {money((Number(i.price ?? i.unitPrice)) * i.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 mt-2 pt-3 flex justify-between font-bold text-slate-800">
          <span>Total</span>
          <span>{money(order?.totalAmount ?? total)}</span>
        </div>
      </div>

      {/* Step 1: reserve */}
      {!order && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label className="block mb-4">
            <span className="text-sm font-medium text-slate-600">Customer name (optional)</span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Guest"
              className="input mt-1"
            />
          </label>
          <button
            onClick={reserve}
            disabled={reserving}
            className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {reserving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {reserving ? 'Reserving stock...' : 'Reserve Stock & Continue'}
          </button>
        </div>
      )}

      {/* Step 2: reservation info + payment */}
      {order && (
        <>
          <ReservationBanner order={order} />

          {order.status === 'RESERVED' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-1">Simulate Payment</h2>
              <p className="text-sm text-slate-500 mb-4">
                Choose an outcome. Clicking the same button twice is safe — duplicate payments are prevented.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PayButton onClick={() => pay('success')} disabled={paying} color="bg-emerald-600 hover:bg-emerald-700" icon={CheckCircle2} label="Pay Successfully" />
                <PayButton onClick={() => pay('failure')} disabled={paying} color="bg-red-600 hover:bg-red-700" icon={XCircle} label="Simulate Failure" />
                <PayButton onClick={() => pay('timeout')} disabled={paying} color="bg-amber-600 hover:bg-amber-700" icon={Clock} label="Simulate Timeout" />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-slate-600">Redirecting to order details...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReservationBanner({ order }) {
  const reservation = order.reservations?.[0];
  const [left, setLeft] = useState('');

  useEffect(() => {
    if (!reservation || order.status !== 'RESERVED') return;
    const tick = () => {
      const ms = new Date(reservation.expiresAt).getTime() - Date.now();
      if (ms <= 0) { setLeft('00:00'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [reservation, order.status]);

  return (
    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-violet-600 text-white flex items-center justify-center">
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-violet-800">
          Order {order.reference} · Stock reserved
        </p>
        <p className="text-xs text-violet-600">
          {order.status === 'RESERVED'
            ? `Reservation expires in ${left} if payment is not completed.`
            : `Order status: ${order.status}`}
        </p>
      </div>
    </div>
  );
}

function PayButton({ onClick, disabled, color, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 text-white px-3 py-2.5 rounded-lg text-sm font-medium ${color} disabled:opacity-50`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
