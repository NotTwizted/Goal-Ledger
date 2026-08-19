import { useState } from 'react';
import { ChevronRight, Image as ImageIcon, Loader2 } from 'lucide-react';
import { computeProgress } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractPastPaper } from '../lib/uploads';
import { navigate, paths } from '../lib/router';
import TopicCard from '../components/TopicCard';

export default function PaperPage({ subject, paper }) {
  const { subjects, updateSubjects } = useLedger();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paperTopics = subject.topics.filter(t => (t.paper || 'Paper 1') === paper);
  const progress = computeProgress(paperTopics);
  const pastPapers = (subject.pastPapers || []).filter(pp => pp.paper === paper);

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
      <div className="mb-4 p-3 bg-white border border-stone-300 rounded-lg">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>{paper} completion</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-stone-800 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => navigate(paths.pastPapers(subject.id, paper))}
          className="flex-1 flex items-center justify-between p-3 bg-white border border-stone-300 rounded-lg hover:border-stone-500 transition-colors"
        >
          <span className="text-sm text-stone-700">
            Past papers {pastPapers.length > 0 && <span className="text-stone-400">· {pastPapers.length} uploaded</span>}
          </span>
          <ChevronRight size={16} className="text-stone-400" />
        </button>
        <label
          title="Upload a marked past paper"
          className="shrink-0 flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer border border-stone-300 rounded-lg px-3 py-3 hover:border-stone-500"
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
      </div>
      {error && <p className="text-xs text-rose-600 -mt-4 mb-4">{error}</p>}

      {paperTopics.length === 0 ? (
        <div className="text-center py-12 text-stone-400 font-serif text-sm">
          No topics under {paper} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {paperTopics.map(t => <TopicCard key={t.id} subject={subject} topic={t} />)}
        </div>
      )}
    </div>
  );
}
