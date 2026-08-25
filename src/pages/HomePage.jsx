import { BellOff, ChevronLeft, ChevronRight, GraduationCap, Target } from 'lucide-react';
import { formatShortDate } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import { buildSummary, buildWeeklyReport } from '../lib/report';
import { navigate, paths } from '../lib/router';
import { subjectAccent } from '../lib/palette';

// Home is the weekly report. Studies and General goals are reached from the
// header, which is on every page rather than only this one.
export default function HomePage() {
  const { subjects, weekOffset, setWeekOffset, notifPermission } = useLedger();
  const { weekStart, weekEnd, reports, completedCount, masteredCount, paperCount } = buildWeeklyReport(subjects, weekOffset);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="p-1.5 rounded text-stone-600 dark:text-stone-400"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="font-serif text-base text-stone-900 dark:text-stone-100">Weekly report</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {formatShortDate(weekStart)} – {formatShortDate(new Date(weekEnd.getTime() - 86400000))}
          </p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
            {weekOffset === 0 ? 'This week · ' : ''}{masteredCount} mastered · {completedCount - masteredCount} covered
            {paperCount > 0 && ` · ${paperCount} paper${paperCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={weekOffset >= 0}
          className="p-1.5 rounded text-stone-600 dark:text-stone-400 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {notifPermission === 'denied' && (
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-500 mb-4">
          <BellOff size={12} /> Notifications are blocked — enable them in your browser's site settings to get deadline reminders.
        </p>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-16 text-stone-400 dark:text-stone-500 font-serif text-sm">
          Nothing completed in this week yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map(({ subject: s, groups, papers }) => (
            <button
              key={s.id}
              onClick={() => navigate(paths.report(s.id))}
              className="text-left p-4 bg-white dark:bg-stone-900 border-l-4 border border-stone-300 dark:border-stone-700 rounded-lg transition-colors"
              style={{ borderLeftColor: subjectAccent(s) }}
            >
              <div className="flex items-center gap-2">
                {s.category === 'study'
                  ? <GraduationCap size={16} className="shrink-0" style={{ color: subjectAccent(s) }} />
                  : <Target size={16} className="shrink-0" style={{ color: subjectAccent(s) }} />}
                <h3 className="font-serif text-base text-stone-900 dark:text-stone-100 flex-1 truncate">{s.name}</h3>
                <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500 shrink-0">
                  {groups.length} item{groups.length !== 1 ? 's' : ''}
                  {papers.length > 0 && ` · ${papers.length} paper${papers.length !== 1 ? 's' : ''}`}
                </span>
                <ChevronRight size={16} className="text-stone-400 dark:text-stone-500 shrink-0" />
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">{buildSummary(groups, papers)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
