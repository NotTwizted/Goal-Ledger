import { useState } from 'react';
import { X } from 'lucide-react';
import { STATUS_META } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { goalUnit } from '../lib/goals';
import ConfirmDialog from './ConfirmDialog';

// A goal is measured against a target: what you can do now against what you
// are aiming for. Reaching the target completes it — there is no equivalent
// of a mark scheme to judge it against.
export default function GoalRow({ subject, topic }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const [confirming, setConfirming] = useState(false);
  const StatusIcon = STATUS_META[topic.status].icon;

  const unit = goalUnit(subject, topic);
  const target = Number(topic.target) || 0;
  const current = Number(topic.current) || 0;
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : null;

  const set = (field, value) =>
    updateSubjects(mutate.setGoalProgress(subjects, subject.id, topic.id, field, value));

  const field = (label, name, value) => (
    <label className="flex items-center gap-1.5" title={`${label}${unit ? `, in ${unit}` : ''}`}>
      <span className="text-[11px] text-stone-500">{label}</span>
      <input
        type="number"
        min="0"
        value={value === null || value === undefined ? '' : value}
        onChange={e => set(name, e.target.value)}
        className="w-16 border border-stone-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
      />
      {unit && <span className="text-[11px] text-stone-400">{unit}</span>}
    </label>
  );

  return (
    <div className="p-3 bg-white border border-stone-300 rounded-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={() => target === 0 && updateSubjects(mutate.cycleGoalStatus(subjects, subject.id, topic.id))}
          title={target > 0
            ? `${current} of ${target}${unit ? ` ${unit}` : ''} — reaching the target completes it`
            : STATUS_META[topic.status].label}
          className={`shrink-0 ${STATUS_META[topic.status].ring} ${target > 0 ? 'cursor-default' : ''}`}
        >
          <StatusIcon size={20} />
        </button>
        <span className={`flex-1 text-sm ${topic.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
          {topic.name}
        </span>
        {percent !== null && (
          <span className="shrink-0 font-mono text-xs text-stone-500">{percent}%</span>
        )}
        {editing && (
          <button onClick={() => setConfirming(true)} className="p-1 text-stone-300 hover:text-rose-600">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 ml-8 flex-wrap">
        {field('Now', 'current', topic.current)}
        {field('Aiming for', 'target', topic.target)}
      </div>

      {percent !== null && (
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mt-2 ml-8">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, backgroundColor: percent >= 100 ? '#047857' : '#b45309' }}
          />
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete "${topic.name}"?`}
          body="The goal and the progress recorded against it will be removed."
          onConfirm={() => {
            updateSubjects(mutate.deleteTopic(subjects, subject.id, topic.id));
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
