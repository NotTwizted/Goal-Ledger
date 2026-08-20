import { useState } from 'react';
import { CheckCircle2, ChevronRight, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { computeProgress } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractPastPaper } from '../lib/uploads';
import { navigate, paths } from '../lib/router';
import { paperShade, progressColor, subjectAccent } from '../lib/palette';
import TopicDetail from '../components/TopicDetail';
import ConfirmDialog from '../components/ConfirmDialog';

// Topics stay listed down the left; picking one opens it beside the list
// rather than replacing it, so moving between topics is one click.
export default function PaperPage({ subject, paper }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [pendingTopic, setPendingTopic] = useState(null);

  const paperTopics = subject.topics.filter(t => (t.paper || 'Paper 1') === paper);
  const progress = computeProgress(paperTopics);
  const accent = paperShade(subjectAccent(subject), paper);
  const pastPapers = (subject.pastPapers || []).filter(pp => pp.paper === paper);

  // Falls back to the first topic, which also covers the selected one being deleted.
  const selected = paperTopics.find(t => t.id === selectedId) || paperTopics[0];

  const topicPercent = (t) => {
    const hasSubtopics = t.subtopics && t.subtopics.length > 0;
    if (!hasSubtopics) return t.status === 'done' ? 100 : 0;
    return Math.round((t.subtopics.filter(st => st.status === 'done').length / t.subtopics.length) * 100);
  };

  const uploadPastPaper = async (file) => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const record = await extractPastPaper(file, paper, paperTopics.map(t => t.name));
      updateSubjects(mutate.addPastPaperRecord(subjects, subject.id, paper, record));
    } catch (e) {
      setError(e.message && !e.message.startsWith('Unexpected')
        ? e.message
        : "Couldn't read that past paper — try a clearer photo or PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 p-3 bg-white border border-stone-300 border-l-4 rounded-lg" style={{ borderLeftColor: accent }}>
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>{paper} completion</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: progressColor(progress, accent) }}
          />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate(paths.pastPapers(subject.id, paper))}
          className="flex-1 flex items-center justify-between p-3 bg-white border border-stone-300 rounded-lg transition-colors"
        >
          <span className="text-sm text-stone-700">
            Past papers {pastPapers.length > 0 && <span className="text-stone-400">· {pastPapers.length} uploaded</span>}
          </span>
          <ChevronRight size={16} className="text-stone-400" />
        </button>
        {editing && (
          <label
            data-tappable
            title="Upload a marked past paper"
            className="shrink-0 flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer border border-stone-300 rounded-lg px-3 py-3"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={loading}
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                uploadPastPaper(file);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 -mt-4 mb-4">{error}</p>}

      {paperTopics.length === 0 ? (
        <div className="text-center py-12 text-stone-400 font-serif text-sm">
          No topics under {paper} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,300px)_1fr] gap-4 items-start">
          <nav className="bg-white border border-stone-300 rounded-lg overflow-hidden md:sticky md:top-4">
            {paperTopics.map(t => {
              const percent = topicPercent(t);
              const isSelected = selected && t.id === selected.id;
              const doneCount = (t.subtopics || []).filter(st => st.status === 'done').length;
              return (
                <div
                  key={t.id}
                  data-tappable
                  onClick={() => setSelectedId(t.id)}
                  className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 border-l-4 border-b border-b-stone-100 last:border-b-0 ${
                    isSelected ? 'bg-stone-100' : 'bg-white'
                  }`}
                  style={{ borderLeftColor: isSelected ? accent : 'transparent' }}
                >
                  {percent >= 100
                    ? <CheckCircle2 size={14} className="shrink-0 text-emerald-700" />
                    : <span className="shrink-0 w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: accent }} />}
                  <span className={`flex-1 text-sm leading-snug ${isSelected ? 'text-stone-900 font-medium' : 'text-stone-700'}`}>
                    {t.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-stone-400">
                    {t.subtopics && t.subtopics.length ? `${doneCount}/${t.subtopics.length}` : `${percent}%`}
                  </span>
                  {editing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingTopic(t); }}
                      className="shrink-0 p-0.5 text-stone-300 hover:text-rose-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          {selected && (
            <TopicDetail
              key={selected.id}
              subject={subject}
              topic={selected}
              accent={progressColor(topicPercent(selected), accent)}
              percent={topicPercent(selected)}
            />
          )}
        </div>
      )}

      {pendingTopic && (
        <ConfirmDialog
          title={`Delete "${pendingTopic.name}"?`}
          body={pendingTopic.subtopics && pendingTopic.subtopics.length
            ? `All ${pendingTopic.subtopics.length} subtopics go with it. Reloading the standard topics brings them back with the progress you have recorded.`
            : 'Reloading the standard topics brings it back with the progress you have recorded.'}
          onConfirm={() => {
            updateSubjects(mutate.deleteTopic(subjects, subject.id, pendingTopic.id));
            setPendingTopic(null);
          }}
          onCancel={() => setPendingTopic(null)}
        />
      )}
    </div>
  );
}
