import { ChevronRight, X } from 'lucide-react';
import { formatDateTime, pastPaperLabel } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { deletePaperFile } from '../lib/paperfiles';
import { useState } from 'react';
import { navigate, paths } from '../lib/router';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PastPapersPage({ subject, paper }) {
  const { subjects, updateSubjects, editing, userId } = useLedger();
  const [pendingDelete, setPendingDelete] = useState(null);
  const pastPapers = (subject.pastPapers || []).filter(pp => pp.paper === paper);

  const topicCounts = {};
  pastPapers.forEach(pp => {
    (pp.mistakes || []).forEach(m => {
      const key = m.topic || 'Unlabeled';
      topicCounts[key] = (topicCounts[key] || 0) + 1;
    });
  });
  const focusAreas = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6">
      {focusAreas.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="text-xs font-medium text-amber-900 mb-1.5">Focus on these topics</p>
          <div className="flex flex-wrap gap-1.5">
            {focusAreas.map(([topic, count]) => (
              <span key={topic} className="px-2 py-0.5 rounded border border-amber-400 bg-white text-amber-800 text-[11px] font-mono">
                {topic} × {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {pastPapers.length === 0 ? (
        <div className="text-center py-16 text-stone-400 font-serif text-sm">
          No past papers uploaded for {paper} yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pastPapers.map(pp => (
            <div
              key={pp.id}
              data-tappable
              onClick={() => navigate(paths.pastPaper(subject.id, paper, pp.id))}
              className="cursor-pointer flex items-center gap-3 p-3 bg-white border border-stone-300 rounded-lg transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{pastPaperLabel(pp)}</p>
                <p className="text-[10px] font-mono text-stone-400 truncate">
                  {pp.session && pp.year ? `${pp.fileName} · ` : ''}
                  {formatDateTime(pp.uploadedAt)} · {pp.needsMarks
                    ? 'marks not added yet'
                    : `${(pp.mistakes || []).length} mistake${(pp.mistakes || []).length !== 1 ? 's' : ''}`}
                </p>
              </div>
              {editing && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDelete(pp); }}
                  className="shrink-0 p-1 text-stone-300 hover:text-rose-600"
                >
                  <X size={14} />
                </button>
              )}
              <ChevronRight size={16} className="shrink-0 text-stone-400" />
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete ${pastPaperLabel(pendingDelete)}?`}
          body="Everything this paper left goes with it — its mistakes, and the marks it put on every topic and subtopic it touched. Marks from your other papers are unaffected."
          onConfirm={() => {
            updateSubjects(mutate.deletePastPaper(subjects, subject.id, pendingDelete.id));
            deletePaperFile(pendingDelete.id, userId);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
