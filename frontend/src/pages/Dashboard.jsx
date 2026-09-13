import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, TrendingUp, Box, Clock, ArrowRight,
  Package, ShoppingCart, PlusCircle,
} from 'lucide-react';
import api, { apiError } from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { money, timeAgo } from '../lib/format';

const STATUS_DOTS = {
  PAID: 'bg-emerald-500',
  RESERVED: 'bg-blue-500',
  PENDING: 'bg-amber-500',
  FAILED: 'bg-red-500',
  EXPIRED: 'bg-slate-400',
  CANCELLED: 'bg-slate-300',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/products')])
      .then(([d, p]) => {
        setData(d.data);
        setProducts(p.data.slice(0, 6));
      })
      .catch((e) => setError(apiError(e)));
  }, []);

  if (error)
    return <div className="bg-red-50 text-red-700 rounded-lg p-4">{error} — is the backend running?</div>;
  if (!data) return <div className="text-slate-400">Loading dashboard...</div>;

  const totalForStatus = Object.values(data.statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Welcome back</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-1">Good day, Admin!</h1>
        <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your store today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} color="blue" label="Total Orders" value={data.totalOrders} />
        <StatCard icon={TrendingUp} color="green" label="Total Sales" value={money(data.totalSales)} />
        <StatCard icon={Box} color="purple" label="Available Stock" value={data.availableStock.toLocaleString()} sub="items in stock" />
        <StatCard icon={Clock} color="amber" label="Active Reservations" value={data.activeReservations} sub="currently held" />
      </div>

      {/* Order status + inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Order Status</h2>
          {Object.keys(data.statusCounts).length === 0 ? (
            <p className="text-sm text-slate-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.statusCounts).map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOTS[status] || 'bg-slate-400'}`} />
                      {status}
                    </span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STATUS_DOTS[status] || 'bg-slate-400'}`}
                      style={{ width: `${(count / totalForStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Inventory Overview</h2>
            <Link to="/products" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Available</th>
                  <th className="pb-2 font-medium text-right">Reserved</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 text-slate-700 font-medium">{p.name}</td>
                    <td className="py-2.5 text-right text-slate-600">{p.availableStock}</td>
                    <td className="py-2.5 text-right text-amber-600">{p.reservedStock}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-700">
                      {p.availableStock + p.reservedStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-slate-400">No orders yet. Add products to a cart and check out.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 font-medium text-slate-700">{o.reference}</td>
                    <td className="py-3 text-slate-600">{o.customer}</td>
                    <td className="py-3 text-right text-slate-700">{money(o.totalAmount)}</td>
                    <td className="py-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3"><StatusBadge status={o.payments?.[0]?.status} /></td>
                    <td className="py-3 text-slate-500">{timeAgo(o.createdAt)}</td>
                    <td className="py-3 text-right">
                      <Link to={`/orders/${o.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction to="/products" icon={PlusCircle} color="bg-blue-600" title="Add Product" sub="Create a new product" />
        <QuickAction to="/products" icon={ShoppingCart} color="bg-emerald-500" title="New Order" sub="Add items & check out" />
        <QuickAction to="/reservations" icon={Package} color="bg-violet-500" title="Reservations" sub="View held stock" />
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, color, title, sub }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition">
      <div className={`${color} w-11 h-11 rounded-lg flex items-center justify-center text-white shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <ArrowRight size={18} className="text-slate-300" />
    </Link>
  );
}
