import { CheckCircle2, CircleDot, FileText } from 'lucide-react';
import { formatDateTime, formatShortDate } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import { buildWeeklyReport } from '../lib/report';

export default function ReportDetailPage({ subjectId }) {
  const { subjects, weekOffset } = useLedger();
  const { weekStart, weekEnd, reports } = buildWeeklyReport(subjects, weekOffset);
  const report = reports.find(r => r.subject.id === subjectId);

  return (
    <div className="p-6">
      <p className="text-xs text-stone-500 mb-4 -mt-2">
        {formatShortDate(weekStart)} – {formatShortDate(new Date(weekEnd.getTime() - 86400000))}
      </p>

      {report && report.papers.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-mono tracking-wider text-stone-400 mb-1.5">PAPERS SAT</p>
          <div className="flex flex-col gap-2">
            {report.papers.map(pp => (
              <div key={pp.id} className="flex items-center gap-2 p-3 bg-white border border-stone-300 rounded-lg">
                <FileText size={15} className="shrink-0 text-stone-500" />
                <span className="text-sm font-medium text-stone-900">{pp.label}</span>
                <span className="text-xs text-stone-500">{pp.paper}</span>
                {pp.code && (
                  <span className="font-mono text-[10px] text-stone-400 border border-stone-300 rounded px-1 py-0.5">
                    {pp.code}
                  </span>
                )}
                <span className="flex-1" />
                <span className="font-mono text-[10px] text-stone-400">
                  {pp.mistakes} mistake{pp.mistakes !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!report ? (
        <div className="text-center py-16 text-stone-400 font-serif text-sm">
          Nothing completed here in this week.
        </div>
      ) : report.groups.length === 0 ? (
        <div className="text-center py-8 text-stone-400 font-serif text-sm">
          No topics ticked off this week.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {report.groups.map(g => (
            <div key={g.key} className="flex items-start gap-2 p-3 bg-white border border-stone-300 rounded-lg">
              {g.kind === 'mastered'
                ? <CheckCircle2 size={16} className="shrink-0 text-emerald-700 mt-0.5" />
                : <CircleDot size={16} className="shrink-0 text-amber-600 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-stone-900">
                    {g.wholeTopic ? g.topicName : g.subtopicName}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono tracking-wider ${
                    g.kind === 'mastered' ? 'border-emerald-500 text-emerald-700' : 'border-amber-500 text-amber-700'
                  }`}>
                    {g.kind === 'mastered' ? 'MASTERED' : 'COVERED'}
                  </span>
                  {g.wholeTopic && g.hadSubtopics && (
                    <span className="px-1.5 py-0.5 rounded border border-stone-300 text-stone-500 text-[9px] font-mono tracking-wider">
                      FULL TOPIC
                    </span>
                  )}
                </div>
                {!g.wholeTopic && <p className="text-xs text-stone-500">{g.topicName}</p>}
              </div>
              <span className="shrink-0 text-[10px] font-mono text-stone-400">{formatDateTime(g.latest)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
