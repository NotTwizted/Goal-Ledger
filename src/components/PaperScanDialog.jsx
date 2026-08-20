import { useState } from 'react';
import { FileSearch, Loader2 } from 'lucide-react';
import { uid } from '../lib/helpers';
import { scanPaper } from '../lib/pdfscan';
import { useLedger } from '../lib/ledger';
import * as mutate from '../lib/mutations';

// Reads the paper's question structure out of the PDF and asks only for what
// it cannot know: what you actually scored, and which topic each question was
// on. Nothing leaves the browser, so this costs nothing to use.
export default function PaperScanDialog({ subject, paper, topics, onClose }) {
  const { subjects, updateSubjects } = useLedger();
  const [stage, setStage] = useState('pick'); // pick | reading | review
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [session, setSession] = useState('');
  const [year, setYear] = useState('');
  const [rows, setRows] = useState([]);

  const read = async (file) => {
    if (!file) return;
    setError('');
    setStage('reading');
    setFileName(file.name);
    try {
      const scanned = await scanPaper(file);
      setSession(scanned.session || '');
      setYear(scanned.year || '');
      setRows(scanned.questions.map(q => ({ ...q, target: '' })));
      setStage('review');
    } catch (e) {
      setError(e.message);
      setStage('pick');
    }
  };

  const setRow = (index, patch) =>
    setRows(rs => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const available = rows.reduce((sum, r) => sum + (Number(r.marksAvailable) || 0), 0);
  const scored = rows.reduce((sum, r) => sum + (Number(r.marksScored) || 0), 0);
  const anyScored = rows.some(r => r.marksScored !== null && r.marksScored !== '');

  const save = () => {
    const questions = rows.map(r => {
      const [topic, subtopic] = (r.target || '').split('|');
      return {
        question: r.question,
        topic: topic || null,
        subtopic: subtopic || null,
        marksScored: Number(r.marksScored) || 0,
        marksAvailable: Number(r.marksAvailable) || 0,
      };
    });

    const record = {
      id: uid(),
      paper,
      fileName,
      session: session.trim() || null,
      year: year.trim() || null,
      uploadedAt: new Date().toISOString(),
      questions,
      feedback: null,
      mistakes: questions
        .filter(q => q.marksAvailable > q.marksScored)
        .map(q => ({
          question: q.question,
          topic: q.subtopic || q.topic,
          mistake: null,
          marksLost: q.marksAvailable - q.marksScored,
          marksAvailable: q.marksAvailable,
        })),
    };

    updateSubjects(mutate.addPastPaperRecord(subjects, subject.id, paper, record));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border-2 border-stone-800 rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileSearch size={18} className="shrink-0 text-stone-700" />
            <h2 className="font-serif text-lg text-stone-900">Scan a paper</h2>
          </div>
          <p className="text-sm text-stone-600 mt-1">
            Reads the question list and mark allocations straight out of the PDF. Your own marks are yours
            to fill in — nothing is sent anywhere, and it costs nothing.
          </p>
        </div>

        {stage !== 'review' && (
          <div className="p-5">
            <label className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer">
              {stage === 'reading'
                ? <><Loader2 size={20} className="animate-spin text-stone-500" /><span className="text-sm text-stone-500">Reading {fileName}…</span></>
                : <><FileSearch size={20} className="text-stone-400" /><span className="text-sm text-stone-600">Choose the question paper PDF</span></>}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={stage === 'reading'}
                onChange={e => { read(e.target.files && e.target.files[0]); e.target.value = ''; }}
              />
            </label>
            {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}
            <p className="text-[11px] text-stone-400 mt-3">
              Works on a PDF with real text in it, which is what an exam board's own paper is. A photograph
              of a page has no text to read — type those questions in by hand, or use the upload button,
              which sends the paper to Claude and does need an API key.
            </p>
          </div>
        )}

        {stage === 'review' && (
          <>
            <div className="px-5 py-3 border-b border-stone-200 flex items-end gap-3 flex-wrap">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-stone-500">Session</span>
                <input
                  value={session}
                  onChange={e => setSession(e.target.value)}
                  placeholder="Oct/Nov"
                  className="w-28 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-stone-500">Year</span>
                <input
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  placeholder="2025"
                  className="w-20 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </label>
              <span className="flex-1" />
              <span className="font-mono text-sm text-stone-700">
                {scored}/{available}
                {available > 0 && <span className="text-stone-400"> · {Math.round((scored / available) * 100)}%</span>}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <p className="text-[11px] text-stone-400 mb-2">
                {rows.length} questions found. Set a topic on a question for its marks to count towards
                that topic — leave it blank and the question still counts towards the paper's total.
              </p>
              <div className="flex flex-col gap-1.5">
                {rows.map((row, i) => (
                  <div key={row.question} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 font-mono text-xs text-stone-500">Q{row.question}</span>
                    <input
                      type="number"
                      min="0"
                      max={row.marksAvailable}
                      value={row.marksScored === null ? '' : row.marksScored}
                      onChange={e => setRow(i, { marksScored: e.target.value })}
                      placeholder="—"
                      className="w-14 border border-stone-300 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                    <span className="shrink-0 font-mono text-xs text-stone-400">/ {row.marksAvailable}</span>
                    <select
                      value={row.target}
                      onChange={e => setRow(i, { target: e.target.value })}
                      className="flex-1 min-w-0 border border-stone-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    >
                      <option value="">Topic…</option>
                      {topics.map(t => (
                        <optgroup key={t.id} label={t.name}>
                          <option value={t.name}>{t.name} — whole topic</option>
                          {(t.subtopics || []).map(st => (
                            <option key={st.id} value={`${t.name}|${st.name}`}>{st.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-stone-200 flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-600 border border-stone-300 rounded">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!anyScored}
                className="px-3 py-1.5 text-sm text-white bg-stone-800 rounded font-medium disabled:bg-stone-300"
              >
                Save paper
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
