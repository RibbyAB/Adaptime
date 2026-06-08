import { useState, useEffect, useCallback, useRef } from 'react';

// ── Single Toast Item ──────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef    = useRef(null);
  const intervalRef = useRef(null);
  const DURATION    = toast.duration ?? 3500;

  const dismiss = useCallback(() => {
    setExiting(true);
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setTimeout(() => onRemove(toast.id), 250);
  }, [toast.id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, DURATION);

    // Shrink progress bar
    const step = 50; // update every 50ms
    intervalRef.current = setInterval(() => {
      setProgress(p => Math.max(0, p - (step / DURATION) * 100));
    }, step);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, [dismiss, DURATION]);

  const typeClass = toast.type === 'error' ? 'toast-error' : 'toast-success';
  const icon      = toast.type === 'error' ? '❌' : '✅';

  return (
    <div
      className={`toast ${typeClass} ${exiting ? 'exiting' : ''}`}
      onClick={dismiss}
      title="Klik untuk menutup"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <div
        className="toast-progress"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Toast Container ────────────────────────────────────────────────────────
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// ── useToast Hook ──────────────────────────────────────────────────────────
let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
