import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const styles = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  error: { icon: XCircle, bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  info: { icon: Info, bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => {
          const s = styles[t.type];
          const Icon = s.icon;
          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden`}>
              <div className={`w-1 self-stretch ${s.bar}`} />
              <div className={`flex items-start gap-2 py-3 pr-2 flex-1 ${s.text}`}>
                <Icon size={18} className="mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700 flex-1">{t.message}</p>
                <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
