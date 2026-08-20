import { Circle, CircleDot, CheckCircle2 } from 'lucide-react';

export const STATUS_ORDER = ['not-started', 'in-progress', 'done'];
export const STATUS_META = {
  'not-started': { label: 'Not started', icon: Circle, ring: 'text-stone-400' },
  'in-progress': { label: 'Covered — mastered at 90%', icon: CircleDot, ring: 'text-amber-600' },
  'done': { label: 'Mastered', icon: CheckCircle2, ring: 'text-emerald-700' },
};

export const MASTERY_LEVELS = [
  { value: 0, label: 'Unrated', stamp: 'UNRATED', color: 'text-stone-400 border-stone-300' },
  { value: 1, label: 'Shaky', stamp: 'SHAKY', color: 'text-rose-700 border-rose-400' },
  { value: 2, label: 'Learning', stamp: 'LEARNING', color: 'text-amber-700 border-amber-500' },
  { value: 3, label: 'Solid', stamp: 'SOLID', color: 'text-blue-700 border-blue-500' },
  { value: 4, label: 'Mastered', stamp: 'MASTERED', color: 'text-emerald-700 border-emerald-500' },
];

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function flattenUnits(topics) {
  return topics.flatMap(t => (t.subtopics && t.subtopics.length ? t.subtopics : [t]));
}

// Completion counts two things, half each. Working through a unit and ticking
// it off earns the first half, so a checklist covered end to end sits at 50%.
// The marks recorded against it earn the second half, filling as the average
// climbs towards the mastery threshold and reaching 100% when it gets there.
export function unitCompletion(unit) {
  if (unit.status === 'done') return 1;
  const covered = unit.status !== 'not-started' ? 0.5 : 0;
  const average = averageScore(unit);
  const earned = average === null ? 0 : Math.min(1, average / MASTERY_THRESHOLD) * 0.5;
  return Math.min(1, covered + earned);
}

export function computeProgress(topics) {
  const units = flattenUnits(topics);
  if (!units.length) return 0;
  const total = units.reduce((sum, u) => sum + unitCompletion(u), 0);
  return Math.round((total / units.length) * 100);
}

export function computeMastery(topics) {
  const units = flattenUnits(topics);
  if (!units.length) return 0;
  const sum = units.reduce((s, u) => s + (u.mastery || 0), 0);
  return sum / units.length;
}

export function normText(s) {
  return (s || '').trim().toLowerCase();
}

export function inferMediaType(file) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
}

// Claude sometimes wraps JSON in stray text despite instructions not to.
// Try a strict parse first, then fall back to extracting the first
// balanced [...] or {...} block from the response.
export function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    const objectMatch = text.match(/\{[\s\S]*\}/);
    const candidate = arrayMatch && (!objectMatch || arrayMatch.index <= objectMatch.index) ? arrayMatch[0] : (objectMatch ? objectMatch[0] : null);
    if (!candidate) throw e;
    return JSON.parse(candidate);
  }
}

export async function callClaudeWithFile(fileContentBlock, promptText, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            fileContentBlock,
            { type: 'text', text: promptText },
          ],
        },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Request failed (${response.status})`);
  }
  if (data.stop_reason === 'max_tokens') {
    throw new Error('The response was cut off because the file had too much content — try splitting it into smaller uploads.');
  }
  const textBlock = (data.content || []).map(b => b.text || '').join('\n');
  const cleaned = textBlock.replace(/```json|```/g, '').trim();
  if (!cleaned) {
    throw new Error('Empty response from the model.');
  }
  return extractJson(cleaned);
}

export function findTextMatch(name, candidates) {
  const n = normText(name);
  if (!n) return null;
  let match = candidates.find(c => normText(c.name) === n);
  if (!match) match = candidates.find(c => normText(c.name).includes(n) || n.includes(normText(c.name)));
  return match || null;
}

// Scores are stored as the percentage of the marks actually achieved,
// so a higher number is always better.
export function masteryFromScore(percent) {
  if (percent === null || percent === undefined || percent === '') return 0;
  const n = Number(percent);
  if (Number.isNaN(n)) return 0;
  if (n >= 90) return 4; // Mastered
  if (n >= 75) return 3; // Solid
  if (n >= 50) return 2; // Learning
  return 1; // Shaky
}

// A unit keeps every mark recorded against it and shows their average.
// Ledgers written when a unit held a single number read as one mark.
export function unitScores(unit) {
  if (Array.isArray(unit.scores)) return unit.scores;
  const legacy = unit.scorePercent;
  if (legacy === null || legacy === undefined || legacy === '') return [];
  return [{ id: 'legacy', percent: Number(legacy), label: 'Recorded' }];
}

// Green is earned, not clicked: a unit counts as mastered once the marks
// recorded against it average this high.
export const MASTERY_THRESHOLD = 90;

export function isMastered(unit) {
  const average = averageScore(unit);
  return average !== null && average >= MASTERY_THRESHOLD;
}

export function averageScore(unit) {
  const scores = unitScores(unit);
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, s) => sum + Number(s.percent), 0) / scores.length);
}

export function clampPercent(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return Math.max(0, Math.min(100, n));
}

// Accepts a mark as it would be written on a paper — "45/60" — or as a bare
// percentage. Returns the percentage plus the raw marks when they were given,
// so the ledger can show both. Null means it could not be read.
export function parseMarkInput(input) {
  const text = String(input ?? '').trim();
  if (!text) return null;

  const fraction = text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const scored = Number(fraction[1]);
    const total = Number(fraction[2]);
    if (!(total > 0)) return null;
    return { percent: clampPercent(Math.round((scored / total) * 100)), scored, total };
  }

  const bare = text.replace(/%$/, '').trim();
  if (!/^\d+(\.\d+)?$/.test(bare)) return null;
  const percent = clampPercent(bare);
  return percent === '' ? null : { percent };
}

// Turns running mark totals from uploaded papers into a score percentage.
// Returns null when nothing usable has been recorded yet.
export function scoreFromMarks(marksLost, marksTotal) {
  const total = Number(marksTotal);
  if (!total || Number.isNaN(total) || total <= 0) return null;
  const lost = Number(marksLost) || 0;
  return Math.max(0, Math.min(100, Math.round(((total - lost) / total) * 100)));
}

// The reporting week runs Friday to Friday.
export function mostRecentFriday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun ... 5=Fri ... 6=Sat
  const diff = (day - 5 + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function getWeekRange(weekOffset) {
  const start = mostRecentFriday(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7); // the next Friday, exclusive — exactly seven days
  return { start, end };
}

export function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function pastPaperLabel(pp) {
  if (pp.session && pp.year) return `${pp.session} ${pp.year}`;
  if (pp.year) return pp.year;
  return pp.fileName;
}

export function mathsComponentTag(s) {
  if (s.name !== 'Maths' || !Array.isArray(s.components)) return '';
  const tags = [];
  if (s.components.includes('Statistics')) tags.push('Stats');
  if (s.components.includes('Mechanics')) tags.push('Mech');
  return tags.length ? ` (${tags.join(', ')})` : '';
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export function parseTopicsFromText(text) {
  return text
    .split('\n')
    .map(line => line
      .replace(/^[\s]*[-*•▪◦]\s*/, '')
      .replace(/^[\s]*\(?\d+[\.\)]\s*/, '')
      .replace(/^[\s]*\(?[a-zA-Z]\)\s*/, '')
      .replace(/^[\s]*\[[ xX]?\]\s*/, '')
      .trim())
    .filter(line => line.length > 0)
    .filter((line, idx, arr) => arr.indexOf(line) === idx);
}

export function parseTopicsHierarchical(text) {
  const lines = text.split('\n');
  const result = [];
  let current = null;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const leadingWhitespace = (raw.match(/^(\s*)/) || ['', ''])[1];
    const indent = leadingWhitespace.replace(/\t/g, '  ').length;
    const cleaned = raw
      .replace(/^[\s]*[-*•▪◦]\s*/, '')
      .replace(/^[\s]*\(?\d+[\.\)]\s*/, '')
      .replace(/^[\s]*\(?[a-zA-Z]\)\s*/, '')
      .replace(/^[\s]*\[[ xX]?\]\s*/, '')
      .trim();
    if (!cleaned) continue;
    if (indent >= 2 && current) {
      current.subtopics.push(cleaned);
    } else {
      current = { name: cleaned, subtopics: [] };
      result.push(current);
    }
  }
  return result;
}

export function newUnit(name) {
  return { id: uid(), name, status: 'not-started', mastery: 0, scorePercent: null, marksLost: null, marksTotal: null };
}

// Rebuilds a subject's checklist so the standard topics always sit in their
// canonical syllabus order, whatever has been deleted since the last load.
// Anything the student added themselves keeps its progress and is kept at the
// end of the list rather than being dropped.
//
// Deletions are archived rather than discarded, so a topic or subtopic that
// comes back returns with the status, score, and completion date it had when
// it was removed — restoring the checklist never costs you recorded work.
function mergeSeedTopic(existing, seedTopic, paper) {
  const seedSubtopics = seedTopic.subtopics || [];
  if (!existing) {
    return { ...newUnit(seedTopic.name), paper, subtopics: seedSubtopics.map(newUnit) };
  }

  const live = [...(existing.subtopics || [])];
  const archived = [...(existing.archivedSubtopics || [])];

  const claim = (name) => {
    let i = live.findIndex(st => normText(st.name) === normText(name));
    if (i !== -1) return live.splice(i, 1)[0];
    i = archived.findIndex(st => normText(st.name) === normText(name));
    if (i !== -1) return archived.splice(i, 1)[0];
    return null;
  };

  const subtopics = seedSubtopics.map(name => {
    const found = claim(name);
    return found ? { ...found, name } : newUnit(name);
  });

  return {
    ...existing,
    name: seedTopic.name,
    paper: existing.paper || paper,
    subtopics: [...subtopics, ...live],
    archivedSubtopics: archived,
  };
}

export function syncTopicsWithSeed(topics, seed, archivedTopics = []) {
  const live = [...topics];
  const archived = [...archivedTopics];

  const claim = (name, paper) => {
    const n = normText(name);
    let i = live.findIndex(t => normText(t.name) === n && (t.paper || 'Paper 1') === paper);
    if (i === -1) i = live.findIndex(t => normText(t.name) === n);
    if (i !== -1) return live.splice(i, 1)[0];
    i = archived.findIndex(t => normText(t.name) === n);
    if (i !== -1) return archived.splice(i, 1)[0];
    return null;
  };

  const ordered = [];
  Object.entries(seed).forEach(([paper, seedTopics]) => {
    seedTopics.forEach(seedTopic => {
      ordered.push(mergeSeedTopic(claim(seedTopic.name, paper), seedTopic, paper));
    });
  });

  return { topics: [...ordered, ...live], archivedTopics: archived };
}
