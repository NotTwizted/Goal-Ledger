import { AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { formatDateTime } from '../lib/helpers';
import { getPaperCode } from '../lib/syllabus';
import { paperFeedback } from '../lib/feedback';

export default function PastPaperPage({ subject, pastPaper }) {
  const mistakes = pastPaper.mistakes || [];
  // Papers recorded before questions were kept in full still have their
  // mistakes, so the report falls back to those.
  const questions = (pastPaper.questions || []).length
    ? pastPaper.questions
    : mistakes.map(m => ({
      question: m.question,
      topic: m.topic,
      mistake: m.mistake,
      marksAvailable: Number(m.marksAvailable) || 0,
      marksScored: Math.max(0, (Number(m.marksAvailable) || 0) - (Number(m.marksLost) || 0)),
    }));
  const { summary, areas, lost, score, source } = paperFeedback(pastPaper);
  const code = subject?.category === 'study'
    ? getPaperCode(subject.level, subject.name, subject.board)
    : null;

  return (
    <div className="p-6">
      {/* Exactly which paper this is, before anything is said about it. */}
      <div className="mb-5 p-4 bg-white border border-stone-300 rounded-lg">
        <div className="flex items-start gap-2 flex-wrap">
          <FileText size={18} className="shrink-0 text-stone-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-lg text-stone-900 leading-tight">
              {pastPaper.session && pastPaper.year
                ? `${pastPaper.session} ${pastPaper.year}`
                : pastPaper.year || 'Undated paper'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {[subject?.name, pastPaper.paper, code].filter(Boolean).join(' · ')}
            </p>
          </div>
          {score && (
            <div className="text-right shrink-0">
              <p className="font-mono text-lg text-stone-900 leading-none">{score.percent}%</p>
              <p className="font-mono text-[10px] text-stone-400 mt-1">{score.scored}/{score.available}</p>
            </div>
          )}
        </div>
        <p className="text-[10px] font-mono text-stone-400 mt-2">
          {pastPaper.fileName} · uploaded {formatDateTime(pastPaper.uploadedAt)}
        </p>
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-mono tracking-wider text-stone-400 mb-1.5">FEEDBACK ON THIS PAPER</p>

        <div className="p-4 bg-white border-l-4 border border-stone-300 rounded-lg" style={{ borderLeftColor: '#b45309' }}>
          {summary && <p className="text-sm text-stone-800 leading-relaxed">{summary}</p>}

          {areas.length > 0 && (
            <div className="flex flex-col gap-3 mt-3">
              {areas.map((area, i) => (
                <div key={i} className="pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                    <p className="text-sm font-medium text-stone-900">{area.topic}</p>
                    {lost.find(l => l.topic === area.topic) && (
                      <span className="font-mono text-[10px] text-stone-400">
                        −{lost.find(l => l.topic === area.topic).lost} marks
                      </span>
                    )}
                  </div>
                  {area.problem && <p className="text-xs text-stone-600 leading-relaxed ml-5">{area.problem}</p>}
                  {area.action && (
                    <p className="flex items-start gap-1.5 text-xs text-stone-800 leading-relaxed ml-5 mt-1.5">
                      <ArrowRight size={12} className="shrink-0 mt-0.5 text-emerald-700" />
                      <span>{area.action}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {source === 'derived' && areas.length > 0 && (
            <p className="text-[10px] text-stone-400 mt-3 pt-3 border-t border-stone-100">
              Worked out from the marks on this paper. Uploading it to be read instead — the button beside
              Scan — gives feedback on what the answers actually got wrong, rather than only where the
              marks went.
            </p>
          )}
        </div>
      </div>

      <p className="text-[10px] font-mono tracking-wider text-stone-400 mb-1.5">
        EVERY QUESTION ({questions.length})
      </p>
      {questions.length === 0 ? (
        <div className="text-center py-10 text-stone-400 font-serif text-sm">
          No questions were recorded for this paper.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {questions.map((q, i) => {
            const available = Number(q.marksAvailable) || 0;
            const scored = Number(q.marksScored) || 0;
            const lost = Math.max(0, available - scored);
            const percent = available > 0 ? Math.round((scored / available) * 100) : null;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 border rounded-lg ${
                  lost > 0 ? 'bg-white border-stone-300' : 'bg-emerald-50 border-emerald-200'
                }`}
              >
                <span className="w-8 shrink-0 font-mono text-xs text-stone-500">Q{q.question || i + 1}</span>
                <span className="shrink-0 font-mono text-xs text-stone-800 w-14">
                  {scored}/{available}
                </span>
                {/* How much of the question was earned, at a glance down the page. */}
                <span className="w-16 shrink-0 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${percent ?? 0}%`, backgroundColor: lost > 0 ? '#b45309' : '#047857' }}
                  />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-stone-700 truncate">
                    {q.subtopic || q.topic || <span className="text-stone-400">no topic set</span>}
                  </span>
                  {q.mistake && <span className="block text-xs text-stone-500 truncate">{q.mistake}</span>}
                </span>
                {lost > 0 && (
                  <span className="shrink-0 font-mono text-[10px] text-rose-700 border border-rose-300 rounded px-1.5 py-0.5">
                    −{lost}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
