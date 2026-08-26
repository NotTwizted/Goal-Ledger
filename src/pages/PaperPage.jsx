import { useState } from 'react';
import { CheckCircle2, ChevronRight, CircleDot, Loader2, Upload, X } from 'lucide-react';
import { computeProgress } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractPastPaper } from '../lib/uploads';
import { savePaperFile } from '../lib/paperfiles';
import { navigate, paths } from '../lib/router';
import { paperShade, progressColor, subjectAccent } from '../lib/palette';
import TopicDetail from '../components/TopicDetail';
import ConfirmDialog from '../components/ConfirmDialog';

// Topics stay listed down the left; picking one opens it beside the list
// rather than replacing it, so moving between topics is one click.
export default function PaperPage({ subject, paper }) {
  const { subjects, updateSubjects, editing, userId } = useLedger();
  const [uploadProgress, setUploadProgress] = useState(null); // {done, total} while reading
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [pendingTopic, setPendingTopic] = useState(null);
  const [coveringAll, setCoveringAll] = useState(false);

  const paperTopics = (subject.topics || []).filter(t => (t.paper || 'Paper 1') === paper);
  const progress = computeProgress(paperTopics);
  const accent = paperShade(subjectAccent(subject), paper);
  const pastPapers = (subject.pastPapers || []).filter(pp => pp.paper === paper);

  // Falls back to the first topic, which also covers the selected one being deleted.
  const selected = paperTopics.find(t => t.id === selectedId) || paperTopics[0];

  const topicPercent = (t) => computeProgress([t]);

  // Only offered when it would do something, and it says how much.
  const toCover = mutate.coverableCount(paperTopics);

  // Files are read one at a time rather than all at once — a dozen papers
  // fired off together would be rate limited — and everything that succeeded
  // is saved in a single write at the end, so one unreadable file in the
  // middle costs only itself.
  const uploadPastPapers = async (files) => {
    if (!files.length) return;
    setError('');
    setUploadProgress({ done: 0, total: files.length });

    let next = subjects;
    const failed = [];
    const added = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const record = await extractPastPaper(files[i], paper, paperTopics,
          (part, parts) => setUploadProgress({ done: i, total: files.length, part: part + 1, parts }));
        next = mutate.addPastPaperRecord(next, subject.id, paper, record);
        // Kept so the questions can be looked at again. Best effort: a paper
        // that will not fit is still a paper that was read. Without an account
        // this goes to a store that lives only as long as the tab.
        await savePaperFile(record.id, files[i], userId);
        added.push(record.id);
      } catch (e) {
        // Keep what actually went wrong — a swallowed message is why every
        // failure looked like a blurry scan.
        failed.push({ name: files[i].name, reason: e.message });
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    if (next !== subjects) updateSubjects(next);
    setUploadProgress(null);

    if (added.length === 1) {
      navigate(paths.pastPaper(subject.id, paper, added[0]));
    } else if (added.length > 1) {
      navigate(paths.pastPapers(subject.id, paper));
    }

    if (failed.length) {
      const reasons = [...new Set(failed.map(f => f.reason))].join(' ');
      setError(failed.length === files.length
        ? reasons
        : `Added ${files.length - failed.length} of ${files.length}. ${failed.map(f => f.name).join(', ')} failed: ${reasons}`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 p-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 border-l-4 rounded-lg" style={{ borderLeftColor: accent }}>
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
          <span>{paper} completion</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: progressColor(progress, accent) }}
          />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate(paths.pastPapers(subject.id, paper))}
          className="flex-1 flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg transition-colors"
        >
          <span className="text-sm text-stone-700 dark:text-stone-300">
            Past papers {pastPapers.length > 0 && <span className="text-stone-400 dark:text-stone-500">· {pastPapers.length} uploaded</span>}
          </span>
          <ChevronRight size={16} className="text-stone-400 dark:text-stone-500" />
        </button>
        {editing && toCover > 0 && (
          <button
            onClick={() => setCoveringAll(true)}
            title="Tick off everything on this paper as covered"
            className="shrink-0 flex items-center gap-1.5 text-sm rounded-lg px-4 py-3 font-medium border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
          >
            <CircleDot size={16} />
            <span className="hidden sm:inline">Mark all covered</span>
            <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">{toCover}</span>
          </button>
        )}
        {editing && (
          <label
            data-tappable
            title="Upload the marked paper — it is read for you, marks and all"
            className="shrink-0 flex items-center gap-1.5 text-sm text-white bg-stone-800 dark:bg-stone-700 cursor-pointer rounded-lg px-4 py-3 font-medium"
          >
            {uploadProgress ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="hidden sm:inline">
              {uploadProgress ? 'Reading…' : 'Add paper'}
            </span>
            {uploadProgress && (uploadProgress.total > 1 || uploadProgress.parts > 1) && (
              <span className="font-mono text-[10px]">
                {uploadProgress.total > 1 ? `${uploadProgress.done + 1}/${uploadProgress.total}` : ''}
                {uploadProgress.parts > 1 ? ` p${uploadProgress.part}/${uploadProgress.parts}` : ''}
              </span>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              disabled={!!uploadProgress}
              onChange={e => {
                uploadPastPapers(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 -mt-4 mb-4">{error}</p>}

      {paperTopics.length === 0 ? (
        <div className="text-center py-12 text-stone-400 dark:text-stone-500 font-serif text-sm">
          No topics under {paper} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(200px,300px)_1fr] gap-4 items-start">
          <nav className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg overflow-hidden md:sticky md:top-4">
            {paperTopics.map(t => {
              const percent = topicPercent(t);
              const isSelected = selected && t.id === selected.id;
              const subs = t.subtopics || [];
              const doneCount = subs.filter(st => st.status === 'done').length;
              const mastered = subs.length ? doneCount === subs.length : t.status === 'done';
              return (
                <div
                  key={t.id}
                  data-tappable
                  onClick={() => setSelectedId(t.id)}
                  className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 border-l-4 border-b border-b-stone-100 last:border-b-0 ${
                    isSelected ? 'bg-stone-100 dark:bg-stone-800' : 'bg-white dark:bg-stone-900'
                  }`}
                  style={{ borderLeftColor: isSelected ? accent : 'transparent' }}
                >
                  {mastered
                    ? <CheckCircle2 size={14} className="shrink-0 text-emerald-700 dark:text-emerald-400" />
                    : <span className="shrink-0 w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: accent }} />}
                  <span className={`flex-1 text-sm leading-snug ${isSelected ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-700 dark:text-stone-300'}`}>
                    {t.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-stone-400 dark:text-stone-500">
                    {t.subtopics && t.subtopics.length ? `${doneCount}/${t.subtopics.length}` : `${percent}%`}
                  </span>
                  {editing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingTopic(t); }}
                      className="shrink-0 p-0.5 text-stone-300 dark:text-stone-600 hover:text-rose-600"
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

      {coveringAll && (
        <ConfirmDialog
          title={`Mark ${toCover} ${toCover === 1 ? 'subtopic' : 'subtopics'} as covered?`}
          body={`Everything under ${paper} that has not been started turns amber. Anything already covered, already mastered, or carrying marks from a paper is left as it is — and undoing this means clicking each one back yourself.`}
          confirmLabel="Mark them covered"
          tone="neutral"
          onConfirm={() => {
            updateSubjects(mutate.coverAllTopics(subjects, subject.id, paper));
            setCoveringAll(false);
          }}
          onCancel={() => setCoveringAll(false)}
        />
      )}

      {pendingTopic && (
        <ConfirmDialog
          title={`Delete "${pendingTopic.name}"?`}
          body={pendingTopic.subtopics && pendingTopic.subtopics.length
            ? `All ${(pendingTopic.subtopics || []).length} subtopics go with it. Reloading the standard topics brings them back with the progress you have recorded.`
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
