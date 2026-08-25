import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileWarning, Loader2, X } from 'lucide-react';
import { renderPdfPage } from '../lib/pdfscan';
import { getPaperFile } from '../lib/paperfiles';
import { useLedger } from '../lib/ledger';

// The question itself, drawn from the paper it was printed in.
//
// The paper comes from this device if it is here and from the account's
// storage if it is not, so a phone signed in later shows the same picture as
// the laptop that uploaded it. A paper that is in neither place says so rather
// than showing a broken frame.
export default function QuestionPicture({ title, subtitle, questions, onClose }) {
  const { userId } = useLedger();
  const [index, setIndex] = useState(0);
  const [state, setState] = useState({ status: 'loading' });

  const current = questions[index];

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      const file = await getPaperFile(current.paperId, userId);
      if (cancelled) return;
      if (!file) {
        setState({ status: 'missing' });
        return;
      }
      try {
        const { url } = await renderPdfPage(file, current.page);
        if (!cancelled) setState({ status: 'ready', url });
      } catch (e) {
        if (!cancelled) setState({ status: 'failed', message: e.message });
      }
    })();

    return () => { cancelled = true; };
  }, [current.paperId, current.page, userId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < questions.length - 1) setIndex(i => i + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, index, questions.length]);

  const scored = current.marksScored !== null && current.marksScored !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-stone-900 border-2 border-stone-800 dark:border-stone-600 rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-lg text-stone-900 dark:text-stone-100 leading-tight">{title}</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {subtitle ? `${subtitle} · ` : ''}Q{current.question} · {current.paperLabel} {current.paper}
            </p>
          </div>
          {scored && (
            <span className="shrink-0 font-mono text-sm text-stone-700 dark:text-stone-300">
              {current.marksScored}/{current.marksAvailable}
            </span>
          )}
          <button onClick={onClose} className="shrink-0 p-1 text-stone-400 dark:text-stone-500 hover:text-stone-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-stone-100 dark:bg-stone-800 p-4 flex items-center justify-center min-h-[240px]">
          {state.status === 'loading' && (
            <span className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <Loader2 size={16} className="animate-spin" /> Drawing page {current.page}…
            </span>
          )}

          {state.status === 'missing' && (
            <div className="max-w-sm text-center">
              <FileWarning size={20} className="mx-auto text-stone-400 dark:text-stone-500 mb-2" />
              <p className="text-sm text-stone-700 dark:text-stone-300">This paper could not be found.</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                It is neither on this device nor in your account's papers — either it was added
                before papers were kept, or it never finished uploading. Adding it again will fix it;
                your marks stay as they are.
              </p>
            </div>
          )}

          {state.status === 'failed' && (
            <p className="max-w-sm text-center text-sm text-rose-600 dark:text-rose-400">{state.message}</p>
          )}

          {state.status === 'ready' && (
            <img src={state.url} alt={`Question ${current.question}, page ${current.page}`}
              className="max-w-full rounded shadow-sm" />
          )}
        </div>

        {current.mistake && (
          <p className="px-4 py-2.5 text-xs text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-700 leading-relaxed">
            {current.mistake}
          </p>
        )}

        {questions.length > 1 && (
          <div className="p-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <button
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 rounded disabled:text-stone-300 disabled:border-stone-200"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
              {index + 1} of {questions.length} on this topic
            </span>
            <button
              onClick={() => setIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 rounded disabled:text-stone-300 disabled:border-stone-200"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
