import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Zap } from 'lucide-react';
import api, { apiError } from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';

const FILTERS = ['ALL', 'ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED'];

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expiring, setExpiring] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations');
      setReservations(data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function runExpiry() {
    setExpiring(true);
    try {
      const { data } = await api.post('/reservations/expire');
      toast.success(`Expiry sweep complete — ${data.expiredOrders} order(s) expired.`);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setExpiring(false);
    }
  }

  const filtered = filter === 'ALL' ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reservations</h1>
          <p className="text-slate-500 text-sm mt-0.5">Stock held against pending orders (5-minute window).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={runExpiry} disabled={expiring} className="inline-flex items-center gap-2 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
            <Zap size={15} /> {expiring ? 'Running...' : 'Run Expiry Sweep'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 -mt-2">
        Reservations also expire automatically via a background job. Use the sweep button to trigger it on demand for a demo.
      </p>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-400">Loading reservations...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-slate-400">No reservations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium text-right">Qty</th>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Expires</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">#{r.id}</td>
                    <td className="px-5 py-3 text-slate-700 font-medium">{r.product?.name}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{r.quantity}</td>
                    <td className="px-5 py-3">
                      <Link to={`/orders/${r.orderId}`} className="text-blue-600 hover:underline">
                        {r.order?.reference || `#${r.orderId}`}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.expiresAt)}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
