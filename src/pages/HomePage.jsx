import { Bell, BellOff, ChevronLeft, ChevronRight, GraduationCap, Target } from 'lucide-react';
import { computeProgress, formatShortDate, mathsComponentTag } from '../lib/helpers';
import { getPaperCode } from '../lib/syllabus';
import { useLedger } from '../lib/ledger';
import { buildSummary, buildWeeklyReport } from '../lib/report';
import { navigate, paths } from '../lib/router';

const CATEGORIES = [
  { key: 'study', label: 'Studies', Icon: GraduationCap, accent: 'indigo', empty: 'No subjects yet' },
  { key: 'general', label: 'General goals', Icon: Target, accent: 'amber', empty: 'No goals yet' },
];

const PREVIEW_LIMIT = 4;

export default function HomePage() {
  const { subjects, weekOffset, setWeekOffset, notifPermission, requestNotificationPermission } = useLedger();
  const { weekStart, weekEnd, reports, completedCount } = buildWeeklyReport(subjects, weekOffset);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map(({ key, label, Icon, accent, empty }) => {
          const items = subjects.filter(s => s.category === key);
          const preview = items.slice(0, PREVIEW_LIMIT);
          const remaining = items.length - preview.length;
          const accentText = accent === 'indigo' ? 'text-indigo-800' : 'text-amber-700';
          const accentBorder = accent === 'indigo' ? 'border-indigo-800' : 'border-amber-600';

          return (
            <div key={key} className={`flex flex-col bg-white border-2 rounded-xl overflow-hidden ${accentBorder}`}>
              <button
                onClick={() => navigate(paths.category(key))}
                className="text-left p-4 pb-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon size={20} className={`${accentText} shrink-0`} />
                  <h2 className="font-serif text-base text-stone-900 flex-1 truncate">{label}</h2>
                  <ChevronRight size={16} className="text-stone-400 shrink-0" />
                </div>
              </button>

              <div className="flex-1 border-t border-stone-200 px-3 py-2">
                {items.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2">{empty}</p>
                ) : (
                  <div className="flex flex-col">
                    {preview.map(s => {
                      const code = key === 'study' ? getPaperCode(s.level, s.name, s.board) : null;
                      return (
                        <button
                          key={s.id}
                          onClick={() => navigate(paths.subject(s.id))}
                          className="flex items-center gap-2 py-1.5 text-left rounded px-1 -mx-1"
                        >
                          <span className="text-xs text-stone-700 flex-1 truncate">{s.name}{mathsComponentTag(s)}</span>
                          {code && (
                            <span className="font-mono text-[9px] text-stone-400 border border-stone-300 rounded px-1 py-0.5 shrink-0">
                              {code}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-stone-400 shrink-0">{computeProgress(s.topics)}%</span>
                        </button>
                      );
                    })}
                    {remaining > 0 && (
                      <button
                        onClick={() => navigate(paths.category(key))}
                        className="text-[10px] text-stone-400 text-left py-1 px-1 -mx-1"
                      >
                        +{remaining} more
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {notifPermission === 'default' && (
        <button
          onClick={requestNotificationPermission}
          className="w-full flex items-center justify-center gap-2 py-2 mb-4 border border-stone-300 rounded-lg text-xs text-stone-600 transition-colors"
        >
          <Bell size={14} /> Enable deadline reminders
        </button>
      )}
      {notifPermission === 'denied' && (
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 mb-4">
          <BellOff size={12} /> Notifications blocked — enable them in your browser's site settings to get deadline reminders.
        </p>
      )}

      <div className="border-t-2 border-stone-800 pt-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded text-stone-600"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="font-serif text-base text-stone-900">Weekly report</h2>
            <p className="text-xs text-stone-600">
              {formatShortDate(weekStart)} – {formatShortDate(new Date(weekEnd.getTime() - 86400000))}
            </p>
            <p className="text-[10px] text-stone-400 font-mono">
              {weekOffset === 0 ? 'This week · ' : ''}{completedCount} item{completedCount !== 1 ? 's' : ''} completed
            </p>
          </div>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded text-stone-600 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-14 text-stone-400 font-serif text-sm">
            Nothing completed in this week yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(({ subject: s, groups }) => (
              <button
                key={s.id}
                onClick={() => navigate(paths.report(s.id))}
                className={`text-left p-4 bg-white border-l-4 border border-stone-300 rounded-lg transition-colors ${
                  s.category === 'study' ? 'border-l-indigo-800' : 'border-l-amber-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {s.category === 'study'
                    ? <GraduationCap size={16} className="text-indigo-800 shrink-0" />
                    : <Target size={16} className="text-amber-700 shrink-0" />}
                  <h3 className="font-serif text-base text-stone-900 flex-1 truncate">{s.name}</h3>
                  <span className="font-mono text-[10px] text-stone-400 shrink-0">
                    {groups.length} item{groups.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight size={16} className="text-stone-400 shrink-0" />
                </div>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{buildSummary(groups)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
