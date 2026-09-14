import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError } from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { money, timeAgo } from '../lib/format';

const FILTERS = ['ALL', 'RESERVED', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Order History</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your past orders and their current status.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-400">Loading orders...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-slate-400">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Order ID</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">{o.reference}</td>
                    <td className="px-5 py-3 text-slate-600">{o.customer}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{money(o.totalAmount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3"><StatusBadge status={o.payments?.[o.payments.length - 1]?.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{timeAgo(o.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/orders/${o.id}`} className="text-violet-600 hover:underline">View</Link>
                    </td>
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
