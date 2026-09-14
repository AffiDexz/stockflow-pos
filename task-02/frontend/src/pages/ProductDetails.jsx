import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Minus, Plus } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((e) => setError(apiError(e)));
  }, [id]);

  if (error) return <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>;
  if (!product) return <div className="text-slate-400">Loading product...</div>;

  const out = product.availableStock < 1;

  function addToCart() {
    if (out) return toast.error('Out of stock.');
    add(product, qty);
    toast.success(`${qty} × ${product.name} added to cart.`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to shop
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl border border-slate-200 p-6">
        <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden">
          {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">{product.category?.name}</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">{product.name}</h1>
          <p className="text-2xl font-bold text-slate-800 mt-3">{money(product.price)}</p>

          <span className={`inline-block w-fit mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${out ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {out ? 'Out of stock' : `${product.availableStock} in stock`}
          </span>

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed mt-4">{product.description}</p>
          )}

          {!out && (
            <div className="flex items-center gap-3 mt-6">
              <div className="flex items-center border border-slate-200 rounded-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-l-lg"><Minus size={15} /></button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.availableStock, q + 1))} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-r-lg"><Plus size={15} /></button>
              </div>
            </div>
          )}

          <button
            onClick={addToCart}
            disabled={out}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40"
          >
            <ShoppingCart size={16} /> Add to Cart
          </button>

          <Link to="/cart" className="mt-3 text-center text-sm text-violet-600 hover:underline">Go to cart →</Link>
        </div>
      </div>
    </div>
  );
}
