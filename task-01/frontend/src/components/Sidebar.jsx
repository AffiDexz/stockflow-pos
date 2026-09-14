import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Clock,
  Box,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const groups = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Sales',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/cart', label: 'Cart', icon: ShoppingCart, badgeKey: 'cart' },
      { to: '/orders', label: 'Orders', icon: ClipboardList },
    ],
  },
  {
    label: 'Inventory',
    items: [{ to: '/reservations', label: 'Reservations', icon: Clock }],
  },
];

export default function Sidebar() {
  const { count } = useCart();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Box size={20} />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-slate-800 text-lg">
              StockFlow <span className="text-blue-600">POS</span>
            </p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-snug">
          Concurrency-Safe Order &amp; Inventory Management System
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {item.badgeKey === 'cart' && count > 0 && (
                      <span className="bg-blue-600 text-white text-[11px] font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System status */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-medium text-slate-700">System Online</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">All services running smoothly</p>
        </div>
        <p className="text-[11px] text-slate-300 mt-3 px-1">v1.0.0</p>
      </div>
    </aside>
  );
}
