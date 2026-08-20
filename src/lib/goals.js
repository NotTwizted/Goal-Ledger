// A goal is counted in whatever it is counted in — reps, kilometres, books,
// lessons — and a form that says "Now / Target" with no unit leaves the
// student to remember which. The kind of goal is inferred from its own name
// first, then from the subject it sits under, so a gym goal asks for reps and
// a course asks for lessons without either being configured.
//
// Nothing here is guessed at when it isn't clear: an unrecognised goal simply
// gets no unit, rather than a wrong one.
const VOCABULARIES = [
  {
    unit: 'kg',
    match: /\b(bench|deadlift|squat|clean|snatch|press|lift|weigh|kg|lbs|kilo)/i,
    examples: ['Bench 80kg', 'Deadlift 140kg', 'Squat bodyweight for reps'],
  },
  {
    unit: 'reps',
    match: /\b(pull ?ups?|push ?ups?|chin ?ups?|sit ?ups?|dips?|curls?|reps?|sets?|gym|workout)/i,
    examples: ['Do 10 pullups', 'Hold a 60 second plank', '25 press-ups unbroken'],
  },
  {
    unit: 'km',
    match: /\b(run|running|jog|walk|cycle|cycling|ride|swim|row|km|miles?|marathon|5k|10k)/i,
    examples: ['Run 5km without stopping', 'Cycle 40km', 'Swim 1km'],
  },
  {
    unit: 'books',
    match: /\b(read|reading|books?|novels?|pages?)\b/i,
    examples: ['Read 12 books', 'Finish the reading list', 'Read 30 pages a day'],
  },
  {
    unit: 'lessons',
    match: /\b(course|courses|module|modules|lesson|lessons|lecture|lectures|chapter|chapters|tutorial)/i,
    // Deliberately unnamed: a "Spanish course" being offered "finish the
    // Python course" as an example is worse than no example at all.
    examples: ['Finish the course', 'Complete module 3', 'Watch all 20 lectures'],
  },
  {
    unit: 'words',
    match: /\b(vocab|vocabulary|words?|phrases?|kanji|spanish|french|german|japanese|language)/i,
    examples: ['Learn 500 words', 'Hold a 5 minute conversation', 'Finish the vocab deck'],
  },
  {
    unit: 'hours',
    match: /\b(practice|practise|rehearse|hours?|sessions?|piano|guitar|drums|instrument)/i,
    examples: ['Practise 50 hours', 'Learn 3 pieces', 'Play for 30 minutes a day'],
  },
  {
    unit: 'saved',
    match: /\b(save|saving|savings|money|budget|fund|£|\$)/i,
    examples: ['Save £500', 'Put aside £50 a month'],
  },
];

const DEFAULT_EXAMPLES = ['Do 10 pullups', 'Run 5km', 'Read 12 books'];

// "Do 10 pullups" has already said what the target is, so asking for it again
// is asking twice. The first number in the name is taken as the target unless
// one has been set by hand.
export function inferredTarget(name) {
  const match = String(name || '').match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return value > 0 ? value : null;
}

// What the goal is measured against: whatever was set by hand, else whatever
// its name says.
export function effectiveTarget(unit) {
  if (unit?.target !== null && unit?.target !== undefined && unit.target !== '') return Number(unit.target);
  return inferredTarget(unit?.name);
}

function vocabularyFor(text) {
  if (!text) return null;
  return VOCABULARIES.find(v => v.match.test(text)) || null;
}

// The goal's own name is the better clue; the subject is the fallback.
export function goalUnit(subject, topic) {
  const found = vocabularyFor(topic?.name) || vocabularyFor(subject?.name);
  return found ? found.unit : null;
}

export function goalExamples(subject) {
  const found = vocabularyFor(subject?.name);
  return found ? found.examples : DEFAULT_EXAMPLES;
}

export function goalPlaceholder(subject) {
  return `Add a goal — e.g. ${goalExamples(subject)[0]}`;
}

export function goalImportPlaceholder(subject) {
  return `e.g.\n${goalExamples(subject).map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`;
}
