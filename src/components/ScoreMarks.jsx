import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MASTERY_LEVELS, averageScore, unitScores } from '../lib/helpers';

// The compact half: the average, how many marks it came from, and the stamp.
// Clicking opens the panel below.
export function ScoreSummary({ unit, open, onToggle }) {
  const average = averageScore(unit);
  const count = unitScores(unit).length;

  return (
    <button
      onClick={onToggle}
      title={count ? `${count} mark${count !== 1 ? 's' : ''} recorded` : 'No marks yet'}
      className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${
        open ? 'border-stone-400 bg-stone-100' : 'border-transparent'
      }`}
    >
      <span className="font-mono text-xs text-stone-700 w-9 text-right">
        {average === null ? '—' : `${average}%`}
      </span>
      <span className="font-mono text-[9px] text-stone-400 w-7 text-left">
        {count > 1 ? `avg ${count}` : count === 1 ? '1 mark' : ''}
      </span>
      <span className={`px-1 py-0.5 rounded border font-mono tracking-wider text-[8px] ${MASTERY_LEVELS[unit.mastery || 0].color}`}>
        {MASTERY_LEVELS[unit.mastery || 0].stamp}
      </span>
    </button>
  );
}

// The expanded half: every mark recorded, and a field to add another.
export function ScorePanel({ unit, onAdd, onRemove }) {
  const [draft, setDraft] = useState('');
  const scores = unitScores(unit);

  const submit = () => {
    if (draft.trim() === '') return;
    onAdd(draft);
    setDraft('');
  };

  return (
    <div className="mt-2 ml-8 p-2.5 bg-stone-50 border border-stone-200 rounded">
      {scores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {scores.map(score => (
            <span
              key={score.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white border border-stone-300 rounded-full"
            >
              <span className="font-mono text-[11px] text-stone-700">{score.percent}%</span>
              {score.label && <span className="text-[9px] text-stone-400">{score.label}</span>}
              <button
                onClick={() => onRemove(score.id)}
                title="Remove this mark"
                className="p-0.5 text-stone-300 hover:text-rose-600"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          max="100"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Add a mark %"
          className="w-28 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button onClick={submit} className="px-2 py-1 bg-stone-800 text-white rounded text-xs">
          <Plus size={12} />
        </button>
        {scores.length > 1 && (
          <span className="text-[10px] text-stone-400">
            averaged into {averageScore(unit)}%
          </span>
        )}
      </div>
    </div>
  );
}
