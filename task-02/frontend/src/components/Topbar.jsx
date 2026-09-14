import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Topbar() {
  const navigate = useNavigate();
  const { count } = useCart();
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="w-full max-w-xl">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/?search=${encodeURIComponent(e.target.value)}`);
            }}
            className="w-full bg-slate-100 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </div>

      {/* Right-corner cluster: cart + account */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* Cart */}
        <button
          onClick={() => navigate('/cart')}
          className="relative p-2.5 rounded-lg hover:bg-slate-100 text-slate-600"
          aria-label="Cart"
          title="Cart"
        >
          <ShoppingCart size={20} />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
              {count}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-2" />

        {/* Account (customer) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center font-semibold text-sm">
              G
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">Guest</p>
              <p className="text-[11px] text-slate-400">Customer</p>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-semibold">
                  G
                </div>
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Guest</p>
                  <p className="text-xs text-slate-400 truncate">Shopping as guest</p>
                </div>
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Account</span>
                <span className="font-medium text-slate-700">Customer</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs border-t border-slate-100">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-700">
                  {now.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })} ·{' '}
                  {now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-600 border-t border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                System online
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}