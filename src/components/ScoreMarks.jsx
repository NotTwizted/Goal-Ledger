import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MASTERY_LEVELS, averageScore, parseMarkInput, unitScores } from '../lib/helpers';
import { useLedger } from '../lib/ledger';

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
      <span className={`px-1 py-0.5 rounded border font-mono tracking-wider text-[8px] ${MASTERY_LEVELS[unit.mastery || 0].color}`}>
        {MASTERY_LEVELS[unit.mastery || 0].stamp}
      </span>
    </button>
  );
}

// The expanded half: every mark recorded, and a field to add another.
// Adding a mark is everyday recording and stays available; removing one
// discards evidence, so it waits for Edit like the other deletions.
export function ScorePanel({ unit, onAdd, onRemove }) {
  const { editing } = useLedger();
  const [draft, setDraft] = useState('');
  const scores = unitScores(unit);

  const parsed = parseMarkInput(draft);

  const submit = () => {
    if (!parsed) return;
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
              className={`inline-flex items-center gap-1 pl-2 py-0.5 bg-white border border-stone-300 rounded-full ${editing ? 'pr-1' : 'pr-2'}`}
            >
              {score.total > 0 && (
                <span className="font-mono text-[11px] text-stone-800">{score.scored}/{score.total}</span>
              )}
              <span className={`font-mono text-[11px] ${score.total > 0 ? 'text-stone-500' : 'text-stone-800'}`}>
                {score.percent}%
              </span>
              {score.label && <span className="text-[9px] text-stone-400">{score.label}</span>}
              {editing && (
                <button
                  onClick={() => onRemove(score.id)}
                  title="Remove this mark"
                  className="p-0.5 text-stone-300 hover:text-rose-600"
                >
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="45/60 or 75%"
          title="Enter marks out of a total, or a plain percentage"
          className="w-32 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button
          onClick={submit}
          disabled={!parsed}
          className="px-2 py-1 bg-stone-800 text-white rounded text-xs disabled:bg-stone-300"
        >
          <Plus size={12} />
        </button>
        {parsed && parsed.total > 0 && (
          <span className="font-mono text-[10px] text-stone-500">= {parsed.percent}%</span>
        )}
        {!draft.trim() && scores.length > 1 && (
          <span className="text-[10px] text-stone-400">averaged into {averageScore(unit)}%</span>
        )}
      </div>
    </div>
  );
}
