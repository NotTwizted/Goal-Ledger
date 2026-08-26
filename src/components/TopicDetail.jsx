import { useState } from 'react';
import { CircleDot, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { MASTERY_THRESHOLD, STATUS_META, averageScore, formatDateTime, isMastered, unitScores } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractUnitTest } from '../lib/uploads';
import { ScorePanel, ScoreSummary } from './ScoreMarks';
import ConfirmDialog from './ConfirmDialog';
import { paperFeedback } from '../lib/feedback';

// The right-hand pane: everything about the one topic selected in the list.
export default function TopicDetail({ subject, topic, accent, percent }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const [draft, setDraft] = useState('');
  const [testProgress, setTestProgress] = useState(null); // {done, total} while reading
  const [testError, setTestError] = useState('');
  const [pendingSubtopic, setPendingSubtopic] = useState(null);
  const [openScores, setOpenScores] = useState(null);
  const [coveringAll, setCoveringAll] = useState(false);

  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const StatusIcon = STATUS_META[topic.status].icon;
  const latestTest = (topic.unitTests || [])[(topic.unitTests || []).length - 1];
  // Only offered when it would do something, and it says how much.
  const coverableHere = mutate.coverableCount([topic]);

  const submitSubtopic = () => {
    updateSubjects(mutate.addSubtopic(subjects, subject.id, topic.id, draft));
    setDraft('');
  };

  // Read in turn, saved in one write, so a file that fails takes only itself
  // down and each test still contributes its own mark.
  const uploadUnitTests = async (files) => {
    if (!files.length) return;
    setTestError('');
    setTestProgress({ done: 0, total: files.length });

    const subtopicNames = (topic.subtopics || []).map(st => st.name);
    let next = subjects;
    const failed = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const record = await extractUnitTest(files[i], topic.name, subtopicNames,
          (part, parts) => setTestProgress({ done: i, total: files.length, part: part + 1, parts }));
        next = mutate.addUnitTestRecord(next, subject.id, topic.id, record);
      } catch (e) {
        failed.push({ name: files[i].name, reason: e.message });
      }
      setTestProgress({ done: i + 1, total: files.length });
    }

    if (next !== subjects) updateSubjects(next);
    setTestProgress(null);
    if (failed.length) {
      const reasons = [...new Set(failed.map(f => f.reason))].join(' ');
      setTestError(failed.length === files.length
        ? reasons
        : `Added ${files.length - failed.length} of ${files.length}. ${failed.map(f => f.name).join(', ')} failed: ${reasons}`);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-5">
      <div className="flex items-start gap-3 mb-1">
        {!hasSubtopics && (
          <button
            onClick={() => updateSubjects(mutate.cycleTopicStatus(subjects, subject.id, topic.id))}
            title={STATUS_META[topic.status].label}
            className={`shrink-0 mt-0.5 ${STATUS_META[topic.status].ring}`}
          >
            <StatusIcon size={20} />
          </button>
        )}
        <h2 className="flex-1 font-serif text-xl text-stone-900 dark:text-stone-100 leading-tight">{topic.name}</h2>
        <span className="shrink-0 font-mono text-xs text-stone-500 dark:text-stone-400">{percent}%</span>
      </div>

      <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: accent }} />
      </div>

      {/* The topic carries its own marks — what the papers said about it as a
          whole — alongside the per-subtopic detail below. */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {hasSubtopics && <span className="text-[11px] text-stone-500 dark:text-stone-400">Whole topic</span>}
          <ScoreSummary
            unit={topic}
            open={openScores === topic.id}
            onToggle={() => setOpenScores(id => (id === topic.id ? null : topic.id))}
          />
        </div>
        {openScores === topic.id && (
          <ScorePanel
            unit={topic}
            onAdd={v => updateSubjects(mutate.addUnitScore(subjects, subject.id, topic.id, null, v))}
            onRemove={id => updateSubjects(mutate.removeUnitScore(subjects, subject.id, topic.id, null, id))}
          />
        )}
      </div>

      {hasSubtopics && (
        <div className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800 mb-3">
          {(topic.subtopics || []).map(st => {
            const SubIcon = STATUS_META[st.status].icon;
            return (
              <div key={st.id} className="py-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSubjects(mutate.cycleSubtopicStatus(subjects, subject.id, topic.id, st.id))}
                    title={isMastered(st)
                      ? `Mastered — averaging ${averageScore(st)}%`
                      : unitScores(st).length
                        ? `Set by the marks recorded — averaging ${averageScore(st)}%, green at ${MASTERY_THRESHOLD}%. Remove them to change it.`
                        : `${STATUS_META[st.status].label} · green at ${MASTERY_THRESHOLD}%`}
                    className={`shrink-0 ${STATUS_META[st.status].ring}`}
                  >
                    <SubIcon size={17} />
                  </button>
                  <span className={`flex-1 text-sm leading-snug ${st.status === 'done' ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-800 dark:text-stone-200'}`}>
                    {st.name}
                  </span>
                  <ScoreSummary
                    unit={st}
                    open={openScores === st.id}
                    onToggle={() => setOpenScores(id => (id === st.id ? null : st.id))}
                  />
                  {editing && (
                    <button
                      onClick={() => setPendingSubtopic(st)}
                      className="shrink-0 p-1 text-stone-300 dark:text-stone-600 hover:text-rose-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {openScores === st.id && (
                  <ScorePanel
                    unit={st}
                    onAdd={v => updateSubjects(mutate.addUnitScore(subjects, subject.id, topic.id, st.id, v))}
                    onRemove={id => updateSubjects(mutate.removeUnitScore(subjects, subject.id, topic.id, st.id, id))}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="flex gap-2 pt-1">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add subtopic…"
            className="flex-1 min-w-0 border border-stone-300 dark:border-stone-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
            onKeyDown={e => e.key === 'Enter' && submitSubtopic()}
          />
          <button onClick={submitSubtopic} className="shrink-0 px-2.5 py-1.5 bg-stone-800 dark:bg-stone-700 text-white rounded text-xs">
            <Plus size={13} />
          </button>
        </div>
      )}

      {editing && hasSubtopics && coverableHere > 0 && (
        <button
          onClick={() => setCoveringAll(true)}
          className="w-full flex items-center justify-center gap-2 mt-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-xs text-stone-600 dark:text-stone-400"
        >
          <CircleDot size={13} /> Mark all {coverableHere} covered
        </button>
      )}

      {editing && hasSubtopics && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <label data-tappable className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 cursor-pointer">
            {testProgress ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            {testProgress
              ? (testProgress.parts > 1
                ? `Reading part ${testProgress.part} of ${testProgress.parts}…`
                : testProgress.total > 1 ? `Reading ${testProgress.done + 1} of ${testProgress.total}…` : 'Analyzing…')
              : 'Upload unit tests'}
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              disabled={!!testProgress}
              onChange={e => {
                uploadUnitTests(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
          </label>
          {(topic.unitTests || []).length > 0 && (
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
              {topic.unitTests.length} test{topic.unitTests.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {testError && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{testError}</p>}

      {latestTest && (() => {
        // The same reading a past paper gets, for the most recent test on this
        // topic — where the marks went and what to do about it.
        const { summary, areas, lost, score } = paperFeedback({ ...latestTest, questions: latestTest.details });
        return (
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-baseline gap-2 mb-1.5">
              <p className="text-[10px] font-mono tracking-wider text-stone-400 dark:text-stone-500">
                LATEST UNIT TEST · {formatDateTime(latestTest.uploadedAt)}
              </p>
              {score && <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">{score.scored}/{score.available} · {score.percent}%</span>}
            </div>
            {summary && <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">{summary}</p>}
            {areas.map((area, i) => (
              <div key={i} className="mt-2">
                <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                  {area.topic}
                  {lost.find(l => l.topic === area.topic) && (
                    <span className="ml-1.5 font-mono text-[10px] text-stone-400 dark:text-stone-500">
                      −{lost.find(l => l.topic === area.topic).lost} marks
                    </span>
                  )}
                </p>
                {area.problem && <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{area.problem}</p>}
                {area.action && <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed mt-0.5">→ {area.action}</p>}
              </div>
            ))}
          </div>
        );
      })()}

      {coveringAll && (
        <ConfirmDialog
          title={`Mark ${coverableHere} ${coverableHere === 1 ? 'subtopic' : 'subtopics'} as covered?`}
          body={`Everything under ${topic.name} that has not been started turns amber. Anything already covered, already mastered, or carrying marks is left as it is — and undoing this means clicking each one back yourself.`}
          confirmLabel="Mark them covered"
          tone="neutral"
          onConfirm={() => {
            updateSubjects(mutate.coverTopicSubtopics(subjects, subject.id, topic.id));
            setCoveringAll(false);
          }}
          onCancel={() => setCoveringAll(false)}
        />
      )}

      {pendingSubtopic && (
        <ConfirmDialog
          title={`Delete "${pendingSubtopic.name}"?`}
          body="Reloading the standard topics brings it back with the status and score you have recorded."
          onConfirm={() => {
            updateSubjects(mutate.deleteSubtopic(subjects, subject.id, topic.id, pendingSubtopic.id));
            setPendingSubtopic(null);
          }}
          onCancel={() => setPendingSubtopic(null)}
        />
      )}
    </div>
  );
}
