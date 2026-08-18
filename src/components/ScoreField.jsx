import { MASTERY_LEVELS } from '../lib/helpers';

// A score is the percentage of the marks achieved, so 100 is a clean sweep.
// The mastery stamp next to it is derived from that number.
export default function ScoreField({ value, mastery, onChange, compact = false }) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <input
          type="number"
          min="0"
          max="100"
          value={value === null || value === undefined ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder="score"
          className={`border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-400 ${
            compact ? 'w-14 pl-1 pr-3.5 py-0.5 text-[9px]' : 'w-20 pl-1.5 pr-4 py-0.5 text-[10px]'
          }`}
        />
        <span
          className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-stone-400 ${
            compact ? 'text-[8px]' : 'text-[9px]'
          }`}
        >
          %
        </span>
      </div>
      <span
        className={`rounded border font-mono tracking-wider ${MASTERY_LEVELS[mastery || 0].color} ${
          compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'
        }`}
      >
        {MASTERY_LEVELS[mastery || 0].stamp}
      </span>
    </div>
  );
}
