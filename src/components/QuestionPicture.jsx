import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileWarning, Loader2, X } from 'lucide-react';
import { renderPdfPage } from '../lib/pdfscan';
import { getPaperFile } from '../lib/paperfiles';

// The question itself, drawn from the paper it was printed in.
//
// Which is only possible where the paper is: the file stays on the device that
// uploaded it, so a phone signed into the same account has the marks but not
// the picture. That is said outright rather than shown as a broken frame.
export default function QuestionPicture({ title, subtitle, questions, onClose }) {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState({ status: 'loading' });

  const current = questions[index];

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      const file = await getPaperFile(current.paperId);
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
  }, [current.paperId, current.page]);

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
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white border-2 border-stone-800 rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-200 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-lg text-stone-900 leading-tight">{title}</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {subtitle ? `${subtitle} · ` : ''}Q{current.question} · {current.paperLabel} {current.paper}
            </p>
          </div>
          {scored && (
            <span className="shrink-0 font-mono text-sm text-stone-700">
              {current.marksScored}/{current.marksAvailable}
            </span>
          )}
          <button onClick={onClose} className="shrink-0 p-1 text-stone-400 hover:text-stone-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-stone-100 p-4 flex items-center justify-center min-h-[240px]">
          {state.status === 'loading' && (
            <span className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 size={16} className="animate-spin" /> Drawing page {current.page}…
            </span>
          )}

          {state.status === 'missing' && (
            <div className="max-w-sm text-center">
              <FileWarning size={20} className="mx-auto text-stone-400 mb-2" />
              <p className="text-sm text-stone-700">This paper is not on this device.</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Your marks and feedback are on your account and follow you everywhere; the paper
                itself is eight megabytes and stays where it was uploaded. Upload it here too and the
                question will show.
              </p>
            </div>
          )}

          {state.status === 'failed' && (
            <p className="max-w-sm text-center text-sm text-rose-600">{state.message}</p>
          )}

          {state.status === 'ready' && (
            <img src={state.url} alt={`Question ${current.question}, page ${current.page}`}
              className="max-w-full rounded shadow-sm" />
          )}
        </div>

        {current.mistake && (
          <p className="px-4 py-2.5 text-xs text-stone-600 border-t border-stone-200 leading-relaxed">
            {current.mistake}
          </p>
        )}

        {questions.length > 1 && (
          <div className="p-3 border-t border-stone-200 flex items-center justify-between">
            <button
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-stone-600 border border-stone-300 rounded disabled:text-stone-300 disabled:border-stone-200"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="font-mono text-[11px] text-stone-400">
              {index + 1} of {questions.length} on this topic
            </span>
            <button
              onClick={() => setIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-stone-600 border border-stone-300 rounded disabled:text-stone-300 disabled:border-stone-200"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
