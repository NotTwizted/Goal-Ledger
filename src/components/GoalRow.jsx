import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { STATUS_META } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { effectiveTarget, goalUnit, inferredTarget } from '../lib/goals';
import ConfirmDialog from './ConfirmDialog';

// A goal is measured against a target: what you can do now against what you
// are aiming for. The target usually comes from the goal's own name — "do 10
// pullups" has already said it — so the field for it only appears when the
// name does not say, or when you are editing and want to override it.
//
// A goal can be broken into steps of its own: 1 pullup, then 4, then 7, then
// 10. When it has steps, the steps are what count towards completion.
export default function GoalRow({ subject, topic }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const [confirming, setConfirming] = useState(null);
  const [draft, setDraft] = useState('');

  const steps = topic.subtopics || [];
  const hasSteps = steps.length > 0;

  const set = (subtopicId, field, value) =>
    updateSubjects(mutate.setGoalProgress(subjects, subject.id, topic.id, subtopicId, field, value));

  const cycle = (subtopicId) =>
    updateSubjects(mutate.cycleGoalStatus(subjects, subject.id, topic.id, subtopicId));

  const addStep = () => {
    updateSubjects(mutate.addSubtopic(subjects, subject.id, topic.id, draft));
    setDraft('');
  };

  const percentOf = (unit) => {
    const target = Number(effectiveTarget(unit)) || 0;
    if (target <= 0) return null;
    return Math.min(100, Math.round(((Number(unit.current) || 0) / target) * 100));
  };

  const donePercent = hasSteps
    ? Math.round((steps.filter(s => s.status === 'done').length / steps.length) * 100)
    : percentOf(topic);

  // One line of controls: how many now, and what that is out of.
  const progressFields = (unit, subtopicId) => {
    const target = effectiveTarget(unit);
    const named = inferredTarget(unit.name) !== null && (unit.target === null || unit.target === undefined);
    const unitName = goalUnit(subject, unit);
    if (target === null && !editing) return null;

    return (
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500">
        <label className="flex items-center gap-1.5">
          <span>Now</span>
          <input
            type="number"
            min="0"
            value={unit.current === null || unit.current === undefined ? '' : unit.current}
            onChange={e => set(subtopicId, 'current', e.target.value)}
            className="w-16 border border-stone-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </label>

        {named && !editing && <span>of {target}{unitName ? ` ${unitName}` : ''}</span>}

        {(editing || !named) && (
          <label className="flex items-center gap-1.5">
            <span>of</span>
            <input
              type="number"
              min="0"
              placeholder={named ? String(target) : ''}
              value={unit.target === null || unit.target === undefined ? '' : unit.target}
              onChange={e => set(subtopicId, 'target', e.target.value)}
              className="w-16 border border-stone-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            {unitName && <span>{unitName}</span>}
          </label>
        )}
      </div>
    );
  };

  const circle = (unit, subtopicId) => {
    const Icon = STATUS_META[unit.status].icon;
    const target = effectiveTarget(unit);
    return (
      <button
        onClick={() => target === null && cycle(subtopicId)}
        title={target !== null
          ? `${Number(unit.current) || 0} of ${target} — reaching it completes this`
          : STATUS_META[unit.status].label}
        className={`shrink-0 ${STATUS_META[unit.status].ring} ${target !== null ? 'cursor-default' : ''}`}
      >
        <Icon size={subtopicId ? 17 : 20} />
      </button>
    );
  };

  return (
    <div className="p-3 bg-white border border-stone-300 rounded-lg">
      <div className="flex items-center gap-3">
        {circle(topic, null)}
        <span className={`flex-1 text-sm ${topic.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
          {topic.name}
        </span>
        {hasSteps && (
          <span className="shrink-0 font-mono text-[10px] text-stone-400">
            {steps.filter(s => s.status === 'done').length}/{steps.length}
          </span>
        )}
        {donePercent !== null && (
          <span className="shrink-0 font-mono text-xs text-stone-500">{donePercent}%</span>
        )}
        {editing && (
          <button onClick={() => setConfirming({ kind: 'goal' })} className="p-1 text-stone-300 hover:text-rose-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Steps take over the measuring, so the goal stops asking for its own. */}
      {!hasSteps && <div className="mt-2 ml-8">{progressFields(topic, null)}</div>}

      {hasSteps && (
        <div className="mt-2 ml-8 flex flex-col divide-y divide-stone-100">
          {steps.map(step => (
            <div key={step.id} className="py-2 first:pt-0">
              <div className="flex items-center gap-2">
                {circle(step, step.id)}
                <span className={`flex-1 text-sm ${step.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                  {step.name}
                </span>
                {percentOf(step) !== null && (
                  <span className="shrink-0 font-mono text-[11px] text-stone-400">{percentOf(step)}%</span>
                )}
                {editing && (
                  <button
                    onClick={() => setConfirming({ kind: 'step', step })}
                    className="shrink-0 p-1 text-stone-300 hover:text-rose-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="mt-1 ml-7">{progressFields(step, step.id)}</div>
            </div>
          ))}
        </div>
      )}

      {donePercent !== null && (
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mt-2 ml-8">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${donePercent}%`, backgroundColor: donePercent >= 100 ? '#047857' : '#b45309' }}
          />
        </div>
      )}

      {editing && (
        <div className="flex gap-2 mt-2 ml-8">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add a step — e.g. do 4 pullups"
            className="flex-1 min-w-0 border border-stone-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
            onKeyDown={e => e.key === 'Enter' && addStep()}
          />
          <button onClick={addStep} className="shrink-0 px-2.5 py-1.5 bg-stone-800 text-white rounded text-xs">
            <Plus size={13} />
          </button>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete "${confirming.kind === 'goal' ? topic.name : confirming.step.name}"?`}
          body={confirming.kind === 'goal' && hasSteps
            ? `Its ${steps.length} steps go with it.`
            : 'The progress recorded against it will be removed.'}
          onConfirm={() => {
            updateSubjects(confirming.kind === 'goal'
              ? mutate.deleteTopic(subjects, subject.id, topic.id)
              : mutate.deleteSubtopic(subjects, subject.id, topic.id, confirming.step.id));
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
