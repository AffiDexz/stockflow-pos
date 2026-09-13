import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { money } from '../lib/format';

export default function Cart() {
  const { items, setQty, remove, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Cart</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <ShoppingCart size={26} />
          </div>
          <p className="mt-4 text-slate-600 font-medium">Your cart is empty</p>
          <p className="text-sm text-slate-400 mt-1">Add some products to get started.</p>
          <Link to="/products" className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {items.map((i) => (
            <div key={i.productId} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{i.name}</p>
                <p className="text-sm text-slate-500">{money(i.price)} each</p>
              </div>

              <div className="flex items-center border border-slate-200 rounded-lg">
                <button onClick={() => setQty(i.productId, i.quantity - 1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-l-lg">
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{i.quantity}</span>
                <button onClick={() => setQty(i.productId, i.quantity + 1)} disabled={i.quantity >= i.availableStock} className="p-2 text-slate-500 hover:bg-slate-100 rounded-r-lg disabled:opacity-30">
                  <Plus size={15} />
                </button>
              </div>

              <p className="w-28 text-right font-semibold text-slate-800">{money(i.price * i.quantity)}</p>

              <button onClick={() => remove(i.productId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={money(total)} />
            <Row label="Tax" value={money(0)} />
            <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold text-slate-800 text-base">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Stock is reserved for 5 minutes once you check out.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
