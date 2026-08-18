import { formatDateTime, scoreFromMarks } from '../lib/helpers';

export default function PastPaperPage({ pastPaper }) {
  const mistakes = pastPaper.mistakes || [];

  return (
    <div className="p-6">
      <p className="text-xs font-mono text-stone-400 mb-4 -mt-2">
        {formatDateTime(pastPaper.uploadedAt)} · {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''}
      </p>
      {mistakes.length === 0 ? (
        <div className="text-center py-16 text-stone-400 font-serif text-sm">
          No mistakes were identified in this paper.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mistakes.map((m, i) => {
            const score = typeof m.marksLost === 'number' ? scoreFromMarks(m.marksLost, m.marksAvailable) : null;
            return (
              <div key={i} className="p-3 bg-white border border-stone-300 rounded-lg">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  {m.question && <span className="font-mono text-[10px] text-stone-400">Q{m.question}</span>}
                  {m.topic && (
                    <span className="px-1.5 py-0.5 rounded border border-stone-300 text-stone-600 text-[10px] font-mono">
                      {m.topic}
                    </span>
                  )}
                  {typeof m.marksLost === 'number' && (
                    <span className="px-1.5 py-0.5 rounded border border-rose-300 text-rose-700 text-[10px] font-mono">
                      {m.marksAvailable ? `${m.marksAvailable - m.marksLost}/${m.marksAvailable}` : `-${m.marksLost}`}
                      {score !== null && ` · ${score}%`}
                    </span>
                  )}
                </div>
                {m.mistake && <p className="text-sm text-stone-700">{m.mistake}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
