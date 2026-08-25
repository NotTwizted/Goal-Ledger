import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Deletions are one click next to controls used constantly, so each one asks
// first and says exactly what is about to go.
export default function ConfirmDialog({ title, body, confirmLabel = 'Delete', onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-stone-900 border-2 border-stone-800 dark:border-stone-600 rounded-xl p-5 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle size={18} className="shrink-0 text-rose-700 dark:text-rose-400 mt-0.5" />
          <h2 className="font-serif text-lg text-stone-900 dark:text-stone-100 leading-tight">{title}</h2>
        </div>
        {body && <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 ml-7">{body}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="px-3 py-1.5 text-sm text-white bg-rose-700 rounded font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
