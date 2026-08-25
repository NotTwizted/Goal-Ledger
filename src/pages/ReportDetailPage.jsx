import { useState } from 'react';
import { CheckCircle2, CircleDot, FileText, Image as ImageIcon } from 'lucide-react';
import { formatDateTime, formatShortDate } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import { buildWeeklyReport } from '../lib/report';
import { questionsFor } from '../lib/questionpages';
import QuestionPicture from '../components/QuestionPicture';

export default function ReportDetailPage({ subjectId }) {
  const { subjects, weekOffset } = useLedger();
  const { weekStart, weekEnd, reports } = buildWeeklyReport(subjects, weekOffset);
  const report = reports.find(r => r.subject.id === subjectId);
  const [showing, setShowing] = useState(null);

  // A row is worth clicking only where there is a question behind it — a topic
  // ticked off by hand was never on a paper, and offering a picture of nothing
  // is worse than offering none.
  const questionsForGroup = (g) =>
    questionsFor(report?.subject, g.topicName, g.wholeTopic ? null : g.subtopicName);

  return (
    <div className="p-6">
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 -mt-2">
        {formatShortDate(weekStart)} – {formatShortDate(new Date(weekEnd.getTime() - 86400000))}
      </p>

      {report && report.papers.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-mono tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">PAPERS SAT</p>
          <div className="flex flex-col gap-2">
            {report.papers.map(pp => (
              <div key={pp.id} className="flex items-center gap-2 p-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg">
                <FileText size={15} className="shrink-0 text-stone-500 dark:text-stone-400" />
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{pp.label}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400">{pp.paper}</span>
                {pp.code && (
                  <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 border border-stone-300 dark:border-stone-700 rounded px-1 py-0.5">
                    {pp.code}
                  </span>
                )}
                <span className="flex-1" />
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                  {pp.needsMarks ? 'marks not added yet' : `${pp.mistakes} mistake${pp.mistakes !== 1 ? 's' : ''}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!report ? (
        <div className="text-center py-16 text-stone-400 dark:text-stone-500 font-serif text-sm">
          Nothing completed here in this week.
        </div>
      ) : report.groups.length === 0 ? (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500 font-serif text-sm">
          No topics ticked off this week.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {report.groups.map(g => {
            const questions = questionsForGroup(g);
            return (
            <div
              key={g.key}
              data-tappable={questions.length ? '' : undefined}
              onClick={questions.length
                ? () => setShowing({ title: g.wholeTopic ? g.topicName : g.subtopicName, subtitle: g.wholeTopic ? null : g.topicName, questions })
                : undefined}
              title={questions.length ? 'See the question' : undefined}
              className={`flex items-start gap-2 p-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg ${
                questions.length ? 'cursor-pointer' : ''
              }`}
            >
              {g.kind === 'mastered'
                ? <CheckCircle2 size={16} className="shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                : <CircleDot size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {g.wholeTopic ? g.topicName : g.subtopicName}
                  </p>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono tracking-wider ${
                    g.kind === 'mastered' ? 'border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-amber-500 dark:border-amber-600 text-amber-700 dark:text-amber-400'
                  }`}>
                    {g.kind === 'mastered' ? 'MASTERED' : 'COVERED'}
                  </span>
                  {g.wholeTopic && g.hadSubtopics && (
                    <span className="px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-[9px] font-mono tracking-wider">
                      FULL TOPIC
                    </span>
                  )}
                </div>
                {!g.wholeTopic && <p className="text-xs text-stone-500 dark:text-stone-400">{g.topicName}</p>}
              </div>
              {questions.length > 0 && (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-stone-400 dark:text-stone-500 mt-0.5">
                  <ImageIcon size={12} />
                  {questions.length > 1 ? questions.length : ''}
                </span>
              )}
              <span className="shrink-0 text-[10px] font-mono text-stone-400 dark:text-stone-500">{formatDateTime(g.latest)}</span>
            </div>
            );
          })}
        </div>
      )}

      {showing && (
        <QuestionPicture
          title={showing.title}
          subtitle={showing.subtitle}
          questions={showing.questions}
          onClose={() => setShowing(null)}
        />
      )}
    </div>
  );
}
