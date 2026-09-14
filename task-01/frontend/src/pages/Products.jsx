import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ShoppingCart, Search } from 'lucide-react';
import api, { apiError } from '../api/axios';
import Modal from '../components/Modal';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';

const empty = { name: '', price: '', availableStock: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { add } = useCart();
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  }
  function openEdit(p) {
    setEditing(p);
    setForm({ name: p.name, price: p.price, availableStock: p.availableStock });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        availableStock: Number(form.availableStock),
      };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success('Product updated.');
      } else {
        await api.post('/products', payload);
        toast.success('Product created.');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api.delete(`/products/${confirmDelete.id}`);
      toast.success('Product deleted.');
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  function addToCart(p) {
    if (p.availableStock < 1) return toast.error('Out of stock.');
    add(p, 1);
    toast.success(`${p.name} added to cart.`);
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage products and add them to a cart.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {loading ? (
        <p className="text-slate-400">Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const out = p.availableStock < 1;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-800">{p.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmDelete(p)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800 mt-2">{money(p.price)}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${out ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {out ? 'Out of stock' : `${p.availableStock} available`}
                  </span>
                  {p.reservedStock > 0 && (
                    <span className="px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                      {p.reservedStock} reserved
                    </span>
                  )}
                </div>
                <button
                  onClick={() => addToCart(p)}
                  disabled={out}
                  className="mt-4 inline-flex items-center justify-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-slate-400 col-span-full">No products match your search.</p>
          )}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? 'Edit Product' : 'Add Product'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Wireless Headphones" />
          </Field>
          <Field label="Price (Rs.)">
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="0.00" />
          </Field>
          <Field label="Available Stock">
            <input type="number" min="0" value={form.availableStock} onChange={(e) => setForm({ ...form, availableStock: e.target.value })} className="input" placeholder="0" />
          </Field>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        title="Delete product"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={remove} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">Delete</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <strong>{confirmDelete?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
