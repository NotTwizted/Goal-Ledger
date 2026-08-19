import { useState } from 'react';
import { Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { STATUS_META } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractUnitTest } from '../lib/uploads';
import ScoreField from './ScoreField';
import { paperShade, progressColor, subjectAccent } from '../lib/palette';
import ConfirmDialog from './ConfirmDialog';

export default function TopicCard({ subject, topic }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const [draft, setDraft] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');
  const [pending, setPending] = useState(null);

  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
  const StatusIcon = STATUS_META[topic.status].icon;
  const doneCount = hasSubtopics ? topic.subtopics.filter(st => st.status === 'done').length : 0;
  const latestTest = (topic.unitTests || [])[(topic.unitTests || []).length - 1];

  // The card carries its paper's colour, and turns green once everything in it
  // is done — a state worth spotting from across a grid of twenty cards.
  const accent = paperShade(subjectAccent(subject), topic.paper || 'Paper 1');
  const unitTotal = hasSubtopics ? topic.subtopics.length : 1;
  const unitDone = hasSubtopics ? doneCount : (topic.status === 'done' ? 1 : 0);
  const percent = Math.round((unitDone / unitTotal) * 100);
  const barColor = progressColor(percent, accent);

  const submitSubtopic = () => {
    updateSubjects(mutate.addSubtopic(subjects, subject.id, topic.id, draft));
    setDraft('');
  };

  const uploadUnitTest = async (file) => {
    if (!file) return;
    setTestError('');
    setTestLoading(true);
    try {
      const record = await extractUnitTest(
        file,
        topic.name,
        (topic.subtopics || []).map(st => st.name)
      );
      updateSubjects(mutate.addUnitTestRecord(subjects, subject.id, topic.id, record));
    } catch (e) {
      setTestError(e.message && !e.message.startsWith('Unexpected')
        ? e.message
        : "Couldn't read that unit test — try a clearer photo or PDF.");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div
      className={`aspect-square border border-stone-300 border-t-4 rounded-lg p-3 flex flex-col overflow-hidden ${
        percent >= 100 ? 'bg-emerald-50' : 'bg-white'
      }`}
      style={{ borderTopColor: barColor }}
    >
      <div className="flex items-start gap-2 mb-1">
        {hasSubtopics ? (
          <span className="shrink-0 text-[10px] font-mono text-stone-500 border border-stone-300 rounded px-1.5 py-0.5">
            {doneCount}/{topic.subtopics.length}
          </span>
        ) : (
          <button
            onClick={() => updateSubjects(mutate.cycleTopicStatus(subjects, subject.id, topic.id))}
            title={STATUS_META[topic.status].label}
            className={`shrink-0 ${STATUS_META[topic.status].ring}`}
          >
            <StatusIcon size={16} />
          </button>
        )}
        <span className="flex-1 text-sm font-medium text-stone-900 leading-tight">{topic.name}</span>
        {editing && (
          <button
            onClick={() => setPending({ kind: 'topic' })}
            className="shrink-0 p-0.5 text-stone-300 hover:text-rose-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="h-1 bg-stone-200 rounded-full overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>

      {!hasSubtopics && (
        <div className="mb-1">
          <ScoreField
            value={topic.scorePercent}
            mastery={topic.mastery}
            onChange={v => updateSubjects(mutate.setTopicScore(subjects, subject.id, topic.id, v))}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-0.5">
        {(topic.subtopics || []).map(st => {
          const SubIcon = STATUS_META[st.status].icon;
          return (
            <div key={st.id} className="border-b border-stone-100 pb-1 last:border-b-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateSubjects(mutate.cycleSubtopicStatus(subjects, subject.id, topic.id, st.id))}
                  title={STATUS_META[st.status].label}
                  className={`shrink-0 ${STATUS_META[st.status].ring}`}
                >
                  <SubIcon size={13} />
                </button>
                <span className={`flex-1 text-[11px] leading-tight ${st.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                  {st.name}
                </span>
                {editing && (
                  <button
                    onClick={() => setPending({ kind: 'subtopic', subtopic: st })}
                    className="shrink-0 p-0.5 text-stone-300 hover:text-rose-600"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              <div className="mt-0.5 ml-[18px]">
                <ScoreField
                  compact
                  value={st.scorePercent}
                  mastery={st.mastery}
                  onChange={v => updateSubjects(mutate.setSubtopicScore(subjects, subject.id, topic.id, st.id, v))}
                />
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
      <div className="flex gap-1 mt-1 pt-1 border-t border-stone-100">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add subtopic…"
          className="flex-1 min-w-0 border border-stone-300 rounded px-1.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-stone-400"
          onKeyDown={e => e.key === 'Enter' && submitSubtopic()}
        />
        <button
          onClick={submitSubtopic}
          className="shrink-0 px-2 py-1 bg-stone-800 text-white rounded text-[10px]"
        >
          <Plus size={11} />
        </button>
      </div>
      )}

      {editing && hasSubtopics && (
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-100">
          <label data-tappable className="flex items-center gap-1 text-[9px] text-stone-500 cursor-pointer">
            {testLoading ? <Loader2 size={11} className="animate-spin" /> : <ImageIcon size={11} />}
            {testLoading ? 'Analyzing…' : 'Upload unit test'}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={testLoading}
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                uploadUnitTest(file);
                e.target.value = '';
              }}
            />
          </label>
          {(topic.unitTests || []).length > 0 && (
            <span className="text-[9px] font-mono text-stone-400">
              {topic.unitTests.length} test{topic.unitTests.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {testError && <p className="text-[9px] text-rose-600 mt-1">{testError}</p>}

      {hasSubtopics && (latestTest?.focus || []).length > 0 && (
        <p className="text-[9px] text-amber-700 mt-1 leading-tight">
          Focus: {latestTest.focus.join(', ')}
        </p>
      )}

      {pending?.kind === 'topic' && (
        <ConfirmDialog
          title={`Delete "${topic.name}"?`}
          body={hasSubtopics
            ? `All ${topic.subtopics.length} subtopics go with it. Reloading the standard topics brings them back with the progress you have recorded.`
            : 'Reloading the standard topics brings it back with the progress you have recorded.'}
          onConfirm={() => {
            updateSubjects(mutate.deleteTopic(subjects, subject.id, topic.id));
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}

      {pending?.kind === 'subtopic' && (
        <ConfirmDialog
          title={`Delete "${pending.subtopic.name}"?`}
          body="Reloading the standard topics brings it back with the status and score you have recorded."
          onConfirm={() => {
            updateSubjects(mutate.deleteSubtopic(subjects, subject.id, topic.id, pending.subtopic.id));
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
