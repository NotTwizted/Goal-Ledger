import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, ClipboardList, FileText, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import {
  computeProgress,
  daysUntil,
  parseTopicsFromText,
  parseTopicsHierarchical,
} from '../lib/helpers';
import { PAPERS, getPaperCode, getSeedData, getSpecUrl } from '../lib/syllabus';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';
import { extractChecklistDraft } from '../lib/uploads';
import { navigate, paths } from '../lib/router';
import { goalImportPlaceholder, goalPlaceholder } from '../lib/goals';
import { paperShade, progressColor, subjectAccent } from '../lib/palette';
import GoalRow from '../components/GoalRow';

export default function SubjectPage({ subject }) {
  const { subjects, updateSubjects, editing } = useLedger();
  const isStudy = subject.category === 'study';
  const seed = isStudy ? getSeedData(subject) : null;

  const [goalName, setGoalName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPaper, setImportPaper] = useState('Paper 1');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [justLoadedTopics, setJustLoadedTopics] = useState(false);
  const flashTimer = useRef(null);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const loadStandardTopics = () => {
    updateSubjects(mutate.applySeedChecklist(subjects, subject.id, seed));
    setJustLoadedTopics(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setJustLoadedTopics(false), 1800);
  };

  const progress = computeProgress(subject.topics);
  const accent = subjectAccent(subject);
  const code = isStudy ? getPaperCode(subject.level, subject.name, subject.board) : null;
  const specUrl = isStudy ? getSpecUrl(subject.level, subject.name, subject.board) : null;
  const papersInUse = [...new Set((subject.topics || []).map(t => t.paper || 'Paper 1'))];

  const addGoal = () => {
    const name = goalName.trim();
    if (!name) return;
    updateSubjects(mutate.addTopic(subjects, subject.id, name, null));
    setGoalName('');
  };

  const runImport = () => {
    if (isStudy) {
      const groups = parseTopicsHierarchical(importText);
      if (!groups.length) return;
      updateSubjects(mutate.appendImportedTopics(subjects, subject.id, groups, importPaper));
    } else {
      const names = parseTopicsFromText(importText);
      if (!names.length) return;
      updateSubjects(mutate.appendImportedMilestones(subjects, subject.id, names));
    }
    setImportText('');
    setShowImport(false);
  };

  const uploadChecklist = async (file) => {
    if (!file) return;
    setFileError('');
    setFileLoading(true);
    try {
      setImportText(await extractChecklistDraft(file, isStudy));
      setShowImport(true);
    } catch (e) {
      setFileError(e.message && !e.message.startsWith('Unexpected')
        ? e.message
        : "Couldn't read topics from that file — try a clearer photo or PDF, or paste the list as text instead.");
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="p-6">
      {subject.spec && (
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-1 -mt-2">
          {subject.spec}
          {code && (
            <span className="ml-1.5 font-mono text-xs text-stone-400 dark:text-stone-500 border border-stone-300 dark:border-stone-700 rounded px-1 py-0.5">
              {code}
            </span>
          )}
          {specUrl && (
            <a
              href={specUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1.5 inline-flex items-center gap-1 text-stone-600 dark:text-stone-400 underline text-xs"
            >
              <FileText size={12} /> View specification
            </a>
          )}
        </p>
      )}

      {(subject.target || subject.deadline) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm text-stone-600 dark:text-stone-400">
          {subject.target && <span>Target: {subject.target}</span>}
          {subject.deadline && (() => {
            const d = daysUntil(subject.deadline);
            return (
              <span className={d < 0 ? 'text-rose-600 dark:text-rose-400' : d <= 7 ? 'text-amber-700 dark:text-amber-400' : ''}>
                {d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? 'Due today' : `${d} days left`}
              </span>
            );
          })()}
        </div>
      )}

      <div className="mb-5 p-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg">
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
          <span>Completion</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: progressColor(progress, accent) }}
          />
        </div>
      </div>

      {editing && seed && (
        <div className="mb-5">
          <button
            onClick={loadStandardTopics}
            className={`w-full flex items-center justify-center gap-2 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
              justLoadedTopics ? 'border-emerald-700 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 is-confirmed' : 'border-indigo-800 dark:border-indigo-500 text-indigo-800 dark:text-indigo-300'
            }`}
          >
            {justLoadedTopics
              ? <><CheckCircle2 size={16} /> Topics loaded</>
              : <><ClipboardList size={16} /> Load standard topics</>}
          </button>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 text-center">
            Restores every standard topic and subtopic in syllabus order — anything you deleted comes back in its original place, and the progress you have already recorded is kept.
          </p>
        </div>
      )}

      {editing && !isStudy && (
        <div className="flex gap-2 mb-2">
          <input
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
            placeholder={goalPlaceholder(subject)}
            className="flex-1 border border-stone-300 dark:border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            onKeyDown={e => e.key === 'Enter' && addGoal()}
          />
          <button
            onClick={addGoal}
            className="px-3 py-2 bg-stone-800 dark:bg-stone-700 text-white rounded text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}

      {editing && isStudy && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
          Paste a list or upload the specification below to build the checklist — add subtopics directly inside each topic's card.
        </p>
      )}

      {editing && (
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setShowImport(v => !v)}
          className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400"
        >
          <ClipboardList size={14} /> {showImport ? 'Hide import' : 'Paste a list instead'}
        </button>
        {[
          { accept: 'image/*', Icon: ImageIcon, label: isStudy ? 'Upload a photo of the specification' : 'Upload a photo of your goals' },
          { accept: 'application/pdf', Icon: FileText, label: isStudy ? 'Upload a PDF of the specification' : 'Upload a PDF of your goals' },
        ].map(({ accept, Icon, label }) => (
          <label key={accept} data-tappable className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 cursor-pointer">
            {fileLoading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {fileLoading ? 'Reading file…' : label}
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={fileLoading}
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                uploadChecklist(file);
                e.target.value = '';
              }}
            />
          </label>
        ))}
      </div>
      )}
      {fileError && <p className="text-xs text-rose-600 dark:text-rose-400 -mt-3 mb-4">{fileError}</p>}

      {editing && showImport && (
        <div className="mb-5 p-4 border-2 border-dashed border-stone-400 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-900">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
            {isStudy
              ? 'Paste your topic list, one per line. Indent a line with a couple of spaces to make it a subtopic of the line above — bullets, numbering, and checkboxes are stripped automatically.'
              : "Paste a list of goals, one per line — bullets, numbering, or checkboxes are fine, they'll be stripped automatically."}
          </p>
          {isStudy && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-xs text-stone-500 dark:text-stone-400">Adding to:</span>
              {PAPERS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setImportPaper(p)}
                  className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                    importPaper === p ? 'bg-stone-800 dark:bg-stone-700 text-white border-stone-800 dark:border-stone-600' : 'text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 '
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={7}
            placeholder={isStudy
              ? 'e.g.\nCell structure\n  Prokaryotic vs eukaryotic cells\n  Organelles\nEnzyme action'
              : goalImportPlaceholder(subject)}
            className="w-full border border-stone-300 dark:border-stone-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
              {isStudy
                ? `${parseTopicsHierarchical(importText).length} main topic${parseTopicsHierarchical(importText).length !== 1 ? 's' : ''} detected`
                : `${parseTopicsFromText(importText).length} goal${parseTopicsFromText(importText).length !== 1 ? 's' : ''} detected`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowImport(false); setImportText(''); }}
                className="px-3 py-1.5 text-stone-600 dark:text-stone-400 text-sm rounded"
              >
                Cancel
              </button>
              <button onClick={runImport} className="px-3 py-1.5 bg-stone-800 dark:bg-stone-700 text-white rounded text-sm">
                Add to checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {subject.topics.length === 0 && (
        <div className="text-center py-12 text-stone-400 dark:text-stone-500 font-serif text-sm">
          {editing
            ? (isStudy ? 'No topics yet. Add the first one above.' : 'No goals yet. Add the first one above.')
            : `Nothing here yet — press Edit to add ${isStudy ? 'topics' : 'goals'}.`}
        </div>
      )}

      {isStudy ? (
        <div className="flex flex-col gap-3">
          {papersInUse.map(p => {
            const paperTopics = (subject.topics || []).filter(t => (t.paper || 'Paper 1') === p);
            const paperProgress = computeProgress(paperTopics);
            const paperColor = paperShade(accent, p);
            return (
              <button
                key={p}
                onClick={() => navigate(paths.paper(subject.id, p))}
                className="text-left bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 border-l-4 rounded-xl p-4 transition-colors"
                style={{ borderLeftColor: paperColor }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-base text-stone-800 dark:text-stone-200">{p}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
                      {paperProgress}% · {paperTopics.length} item{paperTopics.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={16} className="text-stone-400 dark:text-stone-500" />
                  </div>
                </div>
                <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${paperProgress}%`, backgroundColor: progressColor(paperProgress, paperColor) }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(subject.topics || []).map(t => <GoalRow key={t.id} subject={subject} topic={t} />)}
        </div>
      )}
    </div>
  );
}
