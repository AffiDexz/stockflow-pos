const MAP = {
  PENDING: 'bg-amber-100 text-amber-700',
  RESERVED: 'bg-violet-100 text-violet-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
  EXPIRED: 'bg-slate-200 text-slate-600',
  REFUNDED: 'bg-teal-100 text-teal-700',
  ACTIVE: 'bg-violet-100 text-violet-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  RELEASED: 'bg-slate-200 text-slate-600',
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  TIMEOUT: 'bg-amber-100 text-amber-700',
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const cls = MAP[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
