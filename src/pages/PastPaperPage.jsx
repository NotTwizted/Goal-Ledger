import { AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { formatDateTime } from '../lib/helpers';
import { getPaperCode } from '../lib/syllabus';
import { paperFeedback } from '../lib/feedback';

export default function PastPaperPage({ subject, pastPaper }) {
  const mistakes = pastPaper.mistakes || [];
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
              Built from the mistakes recorded against this paper. Papers uploaded from now on are read for
              feedback at the time, which gives more than this.
            </p>
          )}
        </div>
      </div>

      <p className="text-[10px] font-mono tracking-wider text-stone-400 mb-1.5">
        EVERY MISTAKE ({mistakes.length})
      </p>
      {mistakes.length === 0 ? (
        <div className="text-center py-10 text-stone-400 font-serif text-sm">
          No mistakes were identified in this paper.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mistakes.map((m, i) => (
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
                    −{m.marksLost}{m.marksAvailable ? ` of ${m.marksAvailable}` : ''}
                  </span>
                )}
              </div>
              {m.mistake && <p className="text-sm text-stone-700">{m.mistake}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
