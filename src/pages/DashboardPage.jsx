import { useState } from 'react';
import { BookOpen, GraduationCap, Plus, Target, Trash2 } from 'lucide-react';
import {
  MASTERY_LEVELS,
  computeMastery,
  computeProgress,
  daysUntil,
  mathsComponentTag,
  uid,
} from '../lib/helpers';
import { LEVELS, MATHS_COMPONENTS, OTHER, SUBJECT_BOARDS, getPaperCode } from '../lib/syllabus';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { navigate, paths } from '../lib/router';

const SORT_OPTIONS = [
  { key: 'mastery', label: '% Mastered' },
  { key: 'alphabetical', label: 'Alphabetical' },
];

export default function DashboardPage({ category }) {
  const { subjects, updateSubjects } = useLedger();
  const isStudyCategory = category === 'study';

  const [showAdd, setShowAdd] = useState(false);
  const [sortOrder, setSortOrder] = useState('mastery');
  const [goalName, setGoalName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [level, setLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectCustom, setSubjectCustom] = useState('');
  const [board, setBoard] = useState('');
  const [boardCustom, setBoardCustom] = useState('');
  const [components, setComponents] = useState([]);

  const mathsNeedsComponent = isStudyCategory && subject === 'Maths' && (level === 'AS' || level === 'A Level');

  const resetForm = () => {
    setGoalName('');
    setTarget('');
    setDeadline('');
    setLevel('');
    setSubject('');
    setSubjectCustom('');
    setBoard('');
    setBoardCustom('');
    setComponents([]);
    setShowAdd(false);
  };

  const addSubject = () => {
    const name = isStudyCategory
      ? (subject === OTHER ? subjectCustom.trim() : subject)
      : goalName.trim();
    if (!name) return;
    if (isStudyCategory && !level) return;
    const boardName = board === OTHER ? boardCustom.trim() : board;
    if (isStudyCategory && !boardName) return;
    if (mathsNeedsComponent && components.length === 0) return;

    const spec = isStudyCategory
      ? [level, boardName, components.join(', ')].filter(Boolean).join(' · ')
      : '';

    updateSubjects([...subjects, {
      id: uid(),
      name,
      spec,
      category,
      level: isStudyCategory ? level : '',
      board: isStudyCategory ? boardName : '',
      components: isStudyCategory ? components : [],
      pastPapers: [],
      target: target.trim(),
      deadline,
      topics: [],
    }]);
    resetForm();
  };

  const toggleComponent = (comp) =>
    setComponents(prev => (prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]));

  const visibleSubjects = subjects.filter(s => s.category === category);
  const sortedSubjects = [...visibleSubjects].sort((a, b) => {
    if (sortOrder === 'alphabetical') return a.name.localeCompare(b.name);
    return computeMastery(b.topics) - computeMastery(a.topics);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        {sortedSubjects.length > 1 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500">Sort:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortOrder(opt.key)}
                className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                  sortOrder === opt.key ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-600 border-stone-300 hover:border-stone-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : <span />}

        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-stone-50 rounded text-sm font-medium hover:bg-stone-700"
        >
          <Plus size={16} /> {isStudyCategory ? 'Subject' : 'Goal'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 border-2 border-dashed border-stone-400 rounded-lg bg-white">
          <div className="flex flex-col gap-2">
            {!isStudyCategory && (
              <input
                autoFocus
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                placeholder="Goal name (e.g. Deadlift 100kg, Learn Spanish)"
                className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            )}

            {isStudyCategory && (
              <>
                <select
                  value={level}
                  onChange={e => {
                    setLevel(e.target.value);
                    setSubject('');
                    setSubjectCustom('');
                    setBoard('');
                    setBoardCustom('');
                    setComponents([]);
                  }}
                  className="border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  <option value="">Level…</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <select
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setBoard(''); setBoardCustom(''); setComponents([]); }}
                  disabled={!level}
                  className="border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400"
                >
                  <option value="">Subject…</option>
                  {level && Object.keys(SUBJECT_BOARDS[level]).map(s => <option key={s} value={s}>{s}</option>)}
                  {level && <option value={OTHER}>{OTHER}</option>}
                </select>

                {subject === OTHER && (
                  <input
                    value={subjectCustom}
                    onChange={e => setSubjectCustom(e.target.value)}
                    placeholder="Type the subject name"
                    className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                )}

                <select
                  value={board}
                  onChange={e => setBoard(e.target.value)}
                  disabled={!subject}
                  className="border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400"
                >
                  <option value="">Exam board…</option>
                  {level && subject && subject !== OTHER && (SUBJECT_BOARDS[level][subject] || []).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  {subject && <option value={OTHER}>{OTHER}</option>}
                </select>

                {board === OTHER && (
                  <input
                    value={boardCustom}
                    onChange={e => setBoardCustom(e.target.value)}
                    placeholder="Type the exam board"
                    className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                )}

                {mathsNeedsComponent && (
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Components — pick at least one (Pure, Mechanics, or Statistics)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MATHS_COMPONENTS.map(comp => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => toggleComponent(comp)}
                          className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                            components.includes(comp)
                              ? 'bg-stone-800 text-white border-stone-800'
                              : 'text-stone-600 border-stone-300 hover:border-stone-500'
                          }`}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>
                    {components.length === 0 && (
                      <p className="text-xs text-rose-600 mt-1">Select at least one component to continue.</p>
                    )}
                  </div>
                )}
              </>
            )}

            <input
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder={isStudyCategory ? 'Target grade (optional) — e.g. Grade A, 90%' : 'Target (optional) — e.g. Bench 100kg, CEFR B2'}
              className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />

            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 shrink-0">Deadline (optional)</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="border border-stone-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={addSubject}
                disabled={
                  (isStudyCategory && !(board === OTHER ? boardCustom.trim() : board)) ||
                  (mathsNeedsComponent && components.length === 0)
                }
                className="px-3 py-1.5 bg-stone-800 text-white rounded text-sm hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                Add goal
              </button>
              <button onClick={resetForm} className="px-3 py-1.5 text-stone-600 text-sm hover:bg-stone-100 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {sortedSubjects.length === 0 && !showAdd && (
        <div className="text-center py-16 text-stone-400 font-serif">
          <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
          {isStudyCategory
            ? 'No subjects yet. Add one to start tracking your progress.'
            : 'No goals yet. Add one to start tracking your progress.'}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sortedSubjects.map(s => {
          const progress = computeProgress(s.topics);
          const masteryLevel = MASTERY_LEVELS[Math.round(computeMastery(s.topics))];
          const isStudy = s.category === 'study';
          const code = isStudy ? getPaperCode(s.level, s.name, s.board) : null;

          return (
            <div
              key={s.id}
              data-tappable
              onClick={() => navigate(paths.subject(s.id))}
              className={`group relative p-4 bg-white border-l-4 border border-stone-300 rounded-lg cursor-pointer hover:border-stone-500 transition-colors ${
                isStudy ? 'border-l-indigo-800' : 'border-l-amber-600'
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); updateSubjects(mutate.deleteSubject(subjects, s.id)); }}
                className="absolute top-3 right-3 p-1 text-stone-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex items-baseline gap-2 pr-6">
                {isStudy
                  ? <GraduationCap size={14} className="text-indigo-800 shrink-0" />
                  : <Target size={14} className="text-amber-700 shrink-0" />}
                <h2 className="font-serif text-lg text-stone-900 flex-1 truncate">{s.name}{mathsComponentTag(s)}</h2>
                {code && (
                  <span className="shrink-0 font-mono text-[10px] text-stone-400 border border-stone-300 rounded px-1 py-0.5">
                    {code}
                  </span>
                )}
                <span className="shrink-0 font-mono text-xs text-stone-500">
                  {s.topics.length} {isStudy ? 'topic' : 'milestone'}{s.topics.length !== 1 ? 's' : ''}
                </span>
              </div>
              {s.spec && <p className="text-xs text-stone-500 mt-0.5 ml-5">{s.spec}</p>}
              {(s.target || s.deadline) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 ml-5 text-xs text-stone-500">
                  {s.target && <span>Target: {s.target}</span>}
                  {s.deadline && (() => {
                    const d = daysUntil(s.deadline);
                    return (
                      <span className={d < 0 ? 'text-rose-600' : d <= 7 ? 'text-amber-700' : ''}>
                        {d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? 'Due today' : `${d} days left`}
                      </span>
                    );
                  })()}
                </div>
              )}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isStudy ? 'bg-indigo-800' : 'bg-amber-600'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-stone-600 w-10 text-right">{progress}%</span>
              </div>
              {s.topics.length > 0 && (
                <div className={`mt-3 inline-block px-2 py-0.5 border rounded text-[10px] font-mono tracking-wider ${masteryLevel.color}`}>
                  AVG · {masteryLevel.stamp}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
