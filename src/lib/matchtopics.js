// Works out which topic a question is testing from its wording, so the
// question list arrives already sorted rather than as a page of dropdowns.
//
// Matching on shared words alone is too weak for an exam paper: a question
// says "differentiate", never "differentiation", and a quadratic question is
// unlikely to contain the word "quadratic". So each candidate topic is
// expanded with the vocabulary that actually appears in questions about it.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by', 'from',
  'is', 'are', 'be', 'that', 'this', 'these', 'those', 'it', 'its', 'as', 'into', 'using',
  'use', 'given', 'find', 'show', 'hence', 'state', 'write', 'down', 'work', 'out', 'your',
  'you', 'answer', 'question', 'marks', 'mark', 'total', 'diagram', 'figure', 'shown',
  'following', 'where', 'when', 'which', 'each', 'all', 'both', 'may', 'must', 'not',
]);

// Words a question uses, against words a syllabus uses.
const VOCABULARY = [
  { terms: ['differentiate', 'derivative', 'dy/dx', 'stationary', 'tangent', 'normal', 'rate of change'], topics: ['differentiation'] },
  // "dx" is what an integral looks like once a PDF has pulled the sign off it.
  { terms: ['integrate', 'integral', 'area under', 'trapezium', 'dx', '∫'], topics: ['integration'] },
  { terms: ['asymptote', 'vertical asymptote', 'reciprocal'], topics: ['reciprocal graphs', 'graphs and transformations'] },
  { terms: ['discriminant', 'real roots', 'equal roots', 'distinct roots'], topics: ['discriminant', 'quadratics'] },
  // "Express 2x^2 + 8x + 3 in the form a(x + b)^2 + c" is completing the
  // square without ever saying so, and it is how the question is always put.
  { terms: ['complete the square', 'completing the square', 'form a(x', 'form p(x', 'form a (x'], topics: ['completing the square', 'quadratics'] },
  { terms: ['turning point', 'minimum point', 'maximum point', 'sketch the curve'], topics: ['stationary points', 'sketching quadratic graphs', 'differentiation'] },
  // "root" alone is treacherous: "root 5" is a surd, "real roots" is the
  // discriminant. Only the unambiguous forms count.
  { terms: ['surd', 'rationalise', 'rationalize', '√', 'root 2', 'root 3', 'root 5', 'root 6', 'root 7', 'root 10', 'in the form a + b'], topics: ['surds', 'rationalising denominators'] },
  { terms: ['indices', 'index', 'laws of indices', 'rules of indices'], topics: ['indices'] },
  { terms: ['binomial', 'expansion', 'ascending powers'], topics: ['binomial expansion'] },
  { terms: ['logarithm', 'log', 'ln', 'exponential'], topics: ['logarithms', 'exponentials'] },
  { terms: ['arithmetic series', 'geometric series', 'sigma', 'common difference', 'common ratio', 'sum to infinity'], topics: ['sequences', 'series'] },
  { terms: ['sine rule', 'cosine rule', 'trigonometric', 'sin', 'cos', 'tan', 'radians', 'degrees'], topics: ['trigonometry', 'trigonometric ratios', 'radians'] },
  { terms: ['vector', 'magnitude', 'position vector'], topics: ['vectors'] },
  { terms: ['circle', 'centre', 'radius', 'midpoint', 'perpendicular bisector'], topics: ['circle', 'coordinate geometry'] },
  { terms: ['gradient', 'straight line', 'parallel', 'perpendicular'], topics: ['straight line graphs', 'coordinate geometry'] },
  { terms: ['simultaneous'], topics: ['simultaneous equations', 'equations and inequalities'] },
  { terms: ['inequality', 'inequalities'], topics: ['inequalities', 'equations and inequalities'] },
  { terms: ['factorise', 'factorize', 'factor theorem', 'remainder theorem', 'polynomial'], topics: ['factorising', 'algebraic methods', 'algebraic expressions'] },
  { terms: ['prove', 'proof', 'contradiction'], topics: ['proof'] },
  { terms: ['transformation', 'translate', 'stretch', 'sketch the curve'], topics: ['graphs and transformations'] },
  { terms: ['enzyme', 'substrate', 'active site', 'inhibitor'], topics: ['enzymes'] },
  { terms: ['osmosis', 'water potential', 'diffusion', 'active transport'], topics: ['movement into and out of cells', 'cell membranes and transport'] },
  { terms: ['photosynthesis', 'chloroplast', 'calvin'], topics: ['photosynthesis'] },
  { terms: ['respiration', 'glycolysis', 'krebs', 'atp'], topics: ['respiration', 'energy and respiration'] },
  { terms: ['titration', 'burette', 'pipette', 'concordant'], topics: ['titration', 'volumetric analysis'] },
  { terms: ['enthalpy', 'calorimetry', 'exothermic', 'endothermic'], topics: ['energetics', 'chemical energetics', 'thermochemistry'] },
  { terms: ['electrolysis', 'electrode', 'anode', 'cathode'], topics: ['electrochemistry', 'electrolysis'] },
  { terms: ['resistivity', 'circuit', 'ammeter', 'voltmeter', 'resistance'], topics: ['electricity', 'electrical'] },
  { terms: ['momentum', 'collision', 'impulse'], topics: ['momentum', 'dynamics'] },
  { terms: ['projectile', 'suvat', 'acceleration', 'velocity'], topics: ['kinematics', 'motion'] },
];

function tokenise(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

// A candidate is scored on how much of its own name the question echoes, plus
// any vocabulary that points at it. Longer words count for more: "logarithm"
// says more about a question than "the".
// Whole words only. Substring matching made "tan" fire on "tangent" and
// "constant", which sent a differentiation question to trigonometry.
const mentions = (haystack, term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(haystack);
};

function scoreText(text, candidateName) {
  const haystack = ` ${text.toLowerCase()} `;
  let score = 0;

  tokenise(candidateName).forEach(token => {
    if (mentions(haystack, token)) score += Math.min(4, token.length / 3);
  });

  const candidate = candidateName.toLowerCase();
  VOCABULARY.forEach(entry => {
    if (!entry.topics.some(t => candidate.includes(t))) return;
    entry.terms.forEach(term => {
      // A phrase is far more telling than a single word: "form a(x" can only
      // be completing the square, where "square" alone could be anything.
      if (mentions(haystack, term)) score += term.includes(' ') || term.includes('(') ? 5 : 3;
    });
  });

  return score;
}

// A question's opening states what it is about; later parts wander. Question 5
// of a real paper opens on completing the square and closes on inequalities,
// and it is the opening that should decide where the marks are filed.
function scoreCandidate(questionText, candidateName) {
  const head = questionText.slice(0, Math.max(120, Math.round(questionText.length * 0.45)));
  return scoreText(questionText, candidateName) + scoreText(head, candidateName) * 0.6;
}

// Returns "Topic" or "Topic|Subtopic" — the shape the scan dialog stores — or
// an empty string when nothing matched well enough to be worth guessing.
export function matchQuestionToTopic(questionText, topics, threshold = 3) {
  if (!questionText || !topics.length) return { target: '', score: 0 };

  let best = { target: '', score: 0 };

  topics.forEach(topic => {
    const topicScore = scoreCandidate(questionText, topic.name);
    if (topicScore > best.score) best = { target: topic.name, score: topicScore };

    (topic.subtopics || []).forEach(subtopic => {
      // A subtopic inherits some of its topic's evidence: a question about
      // quadratics is about quadratics whichever subtopic it lands on.
      const score = scoreCandidate(questionText, subtopic.name) + topicScore * 0.5;
      if (score > best.score) best = { target: `${topic.name}|${subtopic.name}`, score };
    });
  });

  return best.score >= threshold ? best : { target: '', score: best.score };
}
