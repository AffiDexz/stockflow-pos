// Dashboard metric card with a colored icon tile.
const TILES = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  amber: 'bg-amber-500',
};

export default function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`${TILES[color]} w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
