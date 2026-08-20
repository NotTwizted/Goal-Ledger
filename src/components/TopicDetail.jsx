import { useState } from 'react';
import { Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { MASTERY_THRESHOLD, STATUS_META, averageScore, formatDateTime, isMastered } from '../lib/helpers';
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

  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const StatusIcon = STATUS_META[topic.status].icon;
  const latestTest = (topic.unitTests || [])[(topic.unitTests || []).length - 1];

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
        const record = await extractUnitTest(files[i], topic.name, subtopicNames);
        next = mutate.addUnitTestRecord(next, subject.id, topic.id, record);
      } catch (e) {
        failed.push(files[i].name);
      }
      setTestProgress({ done: i + 1, total: files.length });
    }

    if (next !== subjects) updateSubjects(next);
    setTestProgress(null);
    if (failed.length) {
      setTestError(failed.length === files.length
        ? `Couldn't read ${failed.length === 1 ? 'that test' : 'any of those tests'} — try a clearer photo or PDF.`
        : `Added ${files.length - failed.length} of ${files.length}. Couldn't read: ${failed.join(', ')}.`);
    }
  };

  return (
    <div className="bg-white border border-stone-300 rounded-lg p-5">
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
        <h2 className="flex-1 font-serif text-xl text-stone-900 leading-tight">{topic.name}</h2>
        <span className="shrink-0 font-mono text-xs text-stone-500">{percent}%</span>
      </div>

      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: accent }} />
      </div>

      {/* The topic carries its own marks — what the papers said about it as a
          whole — alongside the per-subtopic detail below. */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {hasSubtopics && <span className="text-[11px] text-stone-500">Whole topic</span>}
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
        <div className="flex flex-col divide-y divide-stone-100 mb-3">
          {topic.subtopics.map(st => {
            const SubIcon = STATUS_META[st.status].icon;
            return (
              <div key={st.id} className="py-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSubjects(mutate.cycleSubtopicStatus(subjects, subject.id, topic.id, st.id))}
                    title={isMastered(st)
                      ? `Mastered — averaging ${averageScore(st)}%`
                      : `${STATUS_META[st.status].label} · green at ${MASTERY_THRESHOLD}%`}
                    className={`shrink-0 ${STATUS_META[st.status].ring}`}
                  >
                    <SubIcon size={17} />
                  </button>
                  <span className={`flex-1 text-sm leading-snug ${st.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
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
                      className="shrink-0 p-1 text-stone-300 hover:text-rose-600"
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
            className="flex-1 min-w-0 border border-stone-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
            onKeyDown={e => e.key === 'Enter' && submitSubtopic()}
          />
          <button onClick={submitSubtopic} className="shrink-0 px-2.5 py-1.5 bg-stone-800 text-white rounded text-xs">
            <Plus size={13} />
          </button>
        </div>
      )}

      {editing && hasSubtopics && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <label data-tappable className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
            {testProgress ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            {testProgress
              ? (testProgress.total > 1 ? `Reading ${testProgress.done} of ${testProgress.total}…` : 'Analyzing…')
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
            <span className="text-[10px] font-mono text-stone-400">
              {topic.unitTests.length} test{topic.unitTests.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {testError && <p className="text-xs text-rose-600 mt-2">{testError}</p>}

      {latestTest && (() => {
        // The same reading a past paper gets, for the most recent test on this
        // topic — where the marks went and what to do about it.
        const { summary, areas, lost, score } = paperFeedback({ ...latestTest, questions: latestTest.details });
        return (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <div className="flex items-baseline gap-2 mb-1.5">
              <p className="text-[10px] font-mono tracking-wider text-stone-400">
                LATEST UNIT TEST · {formatDateTime(latestTest.uploadedAt)}
              </p>
              {score && <span className="font-mono text-[10px] text-stone-500">{score.scored}/{score.available} · {score.percent}%</span>}
            </div>
            {summary && <p className="text-xs text-stone-700 leading-relaxed">{summary}</p>}
            {areas.map((area, i) => (
              <div key={i} className="mt-2">
                <p className="text-xs font-medium text-stone-800">
                  {area.topic}
                  {lost.find(l => l.topic === area.topic) && (
                    <span className="ml-1.5 font-mono text-[10px] text-stone-400">
                      −{lost.find(l => l.topic === area.topic).lost} marks
                    </span>
                  )}
                </p>
                {area.problem && <p className="text-xs text-stone-600 leading-relaxed">{area.problem}</p>}
                {area.action && <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">→ {area.action}</p>}
              </div>
            ))}
          </div>
        );
      })()}

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
