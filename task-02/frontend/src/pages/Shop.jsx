import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import api, { apiError } from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState('');

  const { add } = useCart();
  const toast = useToast();

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (availability) params.availability = availability;

    setLoading(true);
    const t = setTimeout(() => {
      api
        .get('/products', { params })
        .then(({ data }) => setProducts(data))
        .catch((e) => toast.error(apiError(e)))
        .finally(() => setLoading(false));
    }, 250); // debounce
    return () => clearTimeout(t);
  }, [search, categoryId, minPrice, maxPrice, availability]);

  function addToCart(p) {
    if (p.availableStock < 1) return toast.error('Out of stock.');
    add(p, 1);
    toast.success(`${p.name} added to cart.`);
  }

  function reset() {
    setSearch(''); setCategoryId(''); setMinPrice(''); setMaxPrice(''); setAvailability('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Shop</h1>
        <p className="text-slate-500 text-sm mt-0.5">Browse products, filter, and add to your cart.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <aside className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 h-fit space-y-5">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <SlidersHorizontal size={18} /> Filters
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Search</label>
            <div className="relative mt-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product name..." className="input pl-9" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input mt-1">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Price range (Rs.)</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="input" />
              <span className="text-slate-400">–</span>
              <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="input" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="input mt-1">
              <option value="">All</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>

          <button onClick={reset} className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg py-2 hover:bg-slate-50">
            Reset filters
          </button>
        </aside>

        {/* Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <p className="text-slate-400">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-slate-400">No products match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((p) => {
                const out = p.availableStock < 1;
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                    <Link to={`/products/${p.id}`} className="block aspect-[4/3] bg-slate-100 overflow-hidden">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition" loading="lazy" />}
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-[11px] font-medium text-violet-600 uppercase tracking-wide">{p.category?.name}</span>
                      <Link to={`/products/${p.id}`} className="font-semibold text-slate-800 hover:text-violet-600 mt-0.5">{p.name}</Link>
                      <p className="text-lg font-bold text-slate-800 mt-1">{money(p.price)}</p>
                      <span className={`inline-block w-fit mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${out ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {out ? 'Out of stock' : `${p.availableStock} in stock`}
                      </span>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={out}
                        className="mt-4 inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
