import { createContext, useContext, useState, type ReactNode } from 'react';
import { CircleCheck, TriangleAlert, Inbox, X } from 'lucide-react';
const ToastContext = createContext<(message: string, error?: boolean) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; error: boolean }[]>([]);
  function notify(message: string, error = false) {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, message, error }]);
    setTimeout(() => setToasts((items) => items.filter((t) => t.id !== id)), 6000);
  }
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            className={'toast ' + (t.error ? 'toast-error' : '')}
            key={t.id}
            role={t.error ? 'alert' : 'status'}
          >
            {t.error ? <TriangleAlert size={20} /> : <CircleCheck size={20} />}
            <span>{t.message}</span>
            <button
              className="icon-button"
              aria-label="Fechar notificação"
              onClick={() => setToasts((items) => items.filter((i) => i.id !== t.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function Loading({ label = 'A carregar dados…' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="loading-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
export function Failure({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <TriangleAlert />
      <h3>Não foi possível carregar os dados</h3>
      <p>{error.message}</p>
      <button className="button secondary" onClick={retry}>
        Tentar novamente
      </button>
    </div>
  );
}
export function Empty({
  title = 'Ainda não há transacções',
  message = 'O primeiro passo para organizar as suas finanças começa aqui.',
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
