import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import api, { apiError } from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { money, formatDate } from '../lib/format';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (e) {
      setError(apiError(e));
    }
  }
  useEffect(() => { load(); }, [id]);

  async function cancel() {
    setCancelling(true);
    try {
      const { data } = await api.post(`/orders/${id}/cancel`);
      setOrder(data.order);
      setConfirmCancel(false);
      toast.success(data.refundSimulated ? 'Order cancelled and refund simulated.' : 'Order cancelled, stock restored.');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setCancelling(false);
    }
  }

  if (error) return <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>;
  if (!order) return <div className="text-slate-400">Loading order...</div>;

  const canCancel = order.status === 'RESERVED' || order.status === 'PAID';
  const payment = order.payments?.[order.payments.length - 1];

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate('/orders')} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to orders
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{order.reference}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Placed {formatDate(order.createdAt)} · {order.customer}</p>
        </div>
        {canCancel && (
          <button onClick={() => setConfirmCancel(true)} className="inline-flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50">
            <Ban size={16} /> Cancel Order
          </button>
        )}
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard label="Order Status"><StatusBadge status={order.status} /></InfoCard>
        <InfoCard label="Reservation Status"><StatusBadge status={order.reservations?.[0]?.status} /></InfoCard>
        <InfoCard label="Payment Status"><StatusBadge status={payment?.status} /></InfoCard>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium text-right">Unit Price</th>
              <th className="px-5 py-3 font-medium text-right">Qty</th>
              <th className="px-5 py-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="px-5 py-3 text-slate-700 font-medium">{it.name}</td>
                <td className="px-5 py-3 text-right text-slate-600">{money(it.unitPrice)}</td>
                <td className="px-5 py-3 text-right text-slate-600">{it.quantity}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-700">{money(Number(it.unitPrice) * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100">
              <td colSpan={3} className="px-5 py-3 text-right font-semibold text-slate-600">Total</td>
              <td className="px-5 py-3 text-right font-bold text-slate-800">{money(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Reservations */}
      {order.reservations?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Reservations</h2>
          <div className="space-y-2">
            {order.reservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Qty {r.quantity} · expires {formatDate(r.expiresAt)}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={confirmCancel}
        title="Cancel order"
        onClose={() => setConfirmCancel(false)}
        footer={
          <>
            <button onClick={() => setConfirmCancel(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Keep order</button>
            <button onClick={cancel} disabled={cancelling} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {cancelling ? 'Cancelling...' : 'Confirm cancel'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Cancel <strong>{order.reference}</strong>? Reserved or sold stock will be restored
          {order.status === 'PAID' && ' and a refund will be simulated'}.
        </p>
      </Modal>
    </div>
  );
}

function InfoCard({ label, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {children}
    </div>
  );
}
