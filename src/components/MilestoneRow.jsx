import { X } from 'lucide-react';
import { MASTERY_LEVELS, STATUS_META } from '../lib/helpers';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';

export default function MilestoneRow({ subject, topic }) {
  const { subjects, updateSubjects } = useLedger();
  const StatusIcon = STATUS_META[topic.status].icon;

  return (
    <div className="p-3 bg-white border border-stone-300 rounded-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateSubjects(mutate.cycleTopicStatus(subjects, subject.id, topic.id))}
          title={STATUS_META[topic.status].label}
          className={`shrink-0 ${STATUS_META[topic.status].ring}`}
        >
          <StatusIcon size={20} />
        </button>
        <span className={`flex-1 text-sm ${topic.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
          {topic.name}
        </span>
        <button
          onClick={() => updateSubjects(mutate.deleteTopic(subjects, subject.id, topic.id))}
          className="p-1 text-stone-300 hover:text-rose-600"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-1.5 mt-2 ml-8">
        {MASTERY_LEVELS.filter(m => m.value > 0).map(m => (
          <button
            key={m.value}
            onClick={() => updateSubjects(mutate.setTopicMastery(subjects, subject.id, topic.id, m.value))}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono tracking-wider transition-colors ${
              topic.mastery === m.value ? `${m.color} bg-opacity-10` : 'text-stone-300 border-stone-200 hover:border-stone-400'
            }`}
          >
            {m.stamp}
          </button>
        ))}
      </div>
    </div>
  );
}
