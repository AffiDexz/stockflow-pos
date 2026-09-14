import { NavLink } from 'react-router-dom';
import { Store, ShoppingCart, ClipboardList, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const items = [
  { to: '/', label: 'Shop', icon: Store, end: true },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: true },
  { to: '/orders', label: 'Order History', icon: ClipboardList },
];

export default function Sidebar() {
  const { count } = useCart();
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center text-white">
            <ShoppingBag size={20} />
          </div>
          <p className="font-extrabold text-slate-800 text-lg">
            Shop<span className="text-violet-600">Flow</span>
          </p>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-snug">
          E-Commerce Checkout &amp; Payment System
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && count > 0 && (
                <span className="bg-violet-600 text-white text-[11px] font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

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
