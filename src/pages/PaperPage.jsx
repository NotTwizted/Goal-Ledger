import { useState } from 'react';
import { CheckCircle2, ChevronRight, FileSearch, KeyRound, Loader2, Upload, X } from 'lucide-react';
import { computeProgress } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractPastPaper } from '../lib/uploads';
import { navigate, paths } from '../lib/router';
import { paperShade, progressColor, subjectAccent } from '../lib/palette';
import TopicDetail from '../components/TopicDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import PaperScanDialog from '../components/PaperScanDialog';
import ApiKeyDialog from '../components/ApiKeyDialog';
import { hasApiKey } from '../lib/apikey';

// Topics stay listed down the left; picking one opens it beside the list
// rather than replacing it, so moving between topics is one click.
export default function PaperPage({ subject, paper }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const [uploadProgress, setUploadProgress] = useState(null); // {done, total} while reading
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [pendingTopic, setPendingTopic] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const paperTopics = subject.topics.filter(t => (t.paper || 'Paper 1') === paper);
  const progress = computeProgress(paperTopics);
  const accent = paperShade(subjectAccent(subject), paper);
  const pastPapers = (subject.pastPapers || []).filter(pp => pp.paper === paper);

  // Falls back to the first topic, which also covers the selected one being deleted.
  const selected = paperTopics.find(t => t.id === selectedId) || paperTopics[0];

  const topicPercent = (t) => computeProgress([t]);

  // Files are read one at a time rather than all at once — a dozen papers
  // fired off together would be rate limited — and everything that succeeded
  // is saved in a single write at the end, so one unreadable file in the
  // middle costs only itself.
  const uploadPastPapers = async (files) => {
    if (!files.length) return;
    if (!hasApiKey()) {
      setNeedsKey(true);
      return;
    }
    setError('');
    setUploadProgress({ done: 0, total: files.length });

    const topicNames = paperTopics.map(t => t.name);
    let next = subjects;
    const failed = [];
    const added = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const record = await extractPastPaper(files[i], paper, topicNames,
          (part, parts) => setUploadProgress({ done: i, total: files.length, part: part + 1, parts }));
        next = mutate.addPastPaperRecord(next, subject.id, paper, record);
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
            title="Upload the marked paper — it is read for you, marks and all"
            className="shrink-0 flex items-center gap-1.5 text-sm text-white bg-stone-800 cursor-pointer rounded-lg px-4 py-3 font-medium"
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
              const subs = t.subtopics || [];
              const doneCount = subs.filter(st => st.status === 'done').length;
              const mastered = subs.length ? doneCount === subs.length : t.status === 'done';
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
                  {mastered
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

      {needsKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-6" onClick={() => setNeedsKey(false)}>
          <div className="w-full max-w-md bg-white border-2 border-stone-800 rounded-xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={18} className="shrink-0 text-stone-700" />
              <h2 className="font-serif text-lg text-stone-900">A reader key is needed first</h2>
            </div>
            <p className="text-sm text-stone-600 mb-3">
              Reading the marks off a paper means sending it to a model, and that needs a key. Google
              gives one free — no card, no billing — and it takes about two minutes.
            </p>
            <p className="text-xs text-stone-500 mb-4">
              Without one you can still add a paper by scanning it, which reads the question list and
              mark allocations out of the PDF but leaves your own marks to enter.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setNeedsKey(false); setScanning(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 border border-stone-300 rounded"
              >
                <FileSearch size={14} /> Scan instead
              </button>
              <button
                onClick={() => { setNeedsKey(false); setShowKey(true); }}
                className="px-3 py-1.5 text-sm text-white bg-stone-800 rounded font-medium"
              >
                Add a key
              </button>
            </div>
          </div>
        </div>
      )}

      {showKey && <ApiKeyDialog onClose={() => setShowKey(false)} />}

      {scanning && (
        <PaperScanDialog
          subject={subject}
          paper={paper}
          topics={paperTopics}
          onClose={() => setScanning(false)}
        />
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
