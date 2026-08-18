import { callClaudeWithFile, inferMediaType, uid } from './helpers';

async function fileToContentBlock(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  return isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: inferMediaType(file), data: base64 } };
}

// Returns the extracted checklist as indented text, ready to drop into the
// import box so it can be reviewed before anything is added.
export async function extractChecklistDraft(file, isStudy) {
  const promptText = isStudy
    ? 'This file shows content from a syllabus or specification. Extract the main topics and, under each, its subtopics. Cover every page — do not stop partway through. Respond with ONLY a JSON array of objects, no other text, no markdown fences. Format: [{"topic": "Cell structure", "subtopics": ["Prokaryotic vs eukaryotic cells", "Organelles"]}]. If a main topic has no subtopics listed, use an empty array.'
    : 'This file shows a list of tasks or milestones. Extract every individual item as a short line. Respond with ONLY a JSON array of strings, no other text, no markdown fences. Example: ["Book a venue", "Send invitations"]';

  const parsed = await callClaudeWithFile(await fileToContentBlock(file), promptText, 8000);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No topics were found in that file');
  }

  return isStudy
    ? parsed.map(g => {
        const subLines = (g.subtopics || []).map(st => `  - ${st}`).join('\n');
        return subLines ? `${g.topic}\n${subLines}` : g.topic;
      }).join('\n')
    : parsed.join('\n');
}

export async function extractPastPaper(file, paper, topicNames) {
  const promptText = `This file is a corrected/marked past exam paper — it shows which answers the student got wrong or lost marks on. First, find the exam session and year printed on the paper (e.g. "May/June", "October/November", "January", "Summer", "Winter" plus a 4-digit year) — look at headers, footers, or the front cover. Then go through it and identify every question where marks were lost. For each one, work out which topic it relates to` +
    (topicNames.length ? ` (pick the closest match from this list where possible: ${topicNames.join(', ')}; otherwise give your own short topic label)` : '') +
    `, briefly describe the mistake in one short sentence, give the number of marks lost on that question as an integer, and give the total number of marks that question was worth as an integer. Respond with ONLY a JSON object, no other text, no markdown fences. Format: {"session": "May/June", "year": "2023", "mistakes": [{"question": "3b", "topic": "Enzyme kinetics", "mistake": "Confused competitive and non-competitive inhibition", "marksLost": 2, "marksAvailable": 5}]}. If the session or year can't be found, use null for that field.`;

  const parsed = await callClaudeWithFile(await fileToContentBlock(file), promptText, 6000);
  if (!parsed || !Array.isArray(parsed.mistakes)) throw new Error('Unexpected response');

  return {
    id: uid(),
    paper,
    fileName: file.name,
    session: parsed.session || null,
    year: parsed.year || null,
    uploadedAt: new Date().toISOString(),
    mistakes: parsed.mistakes,
  };
}

export async function extractUnitTest(file, topicName, subtopicNames) {
  const promptText = `This file is a corrected/marked unit test on the topic "${topicName || ''}". Go through it and identify every question where marks were lost, and work out which subtopic each one relates to` +
    (subtopicNames.length ? ` (pick the closest match from this list where possible: ${subtopicNames.join(', ')}; otherwise give your own short subtopic label)` : '') +
    `, giving the number of marks lost on that question as an integer, the total number of marks that question was worth as an integer, and a one-sentence description of the mistake. Then list which subtopics need the most focus, ranked by how many marks were lost on them. Respond with ONLY a JSON object, no other text, no markdown fences. Format: {"details": [{"subtopic": "Enzyme kinetics", "marksLost": 2, "marksAvailable": 5, "mistake": "Confused competitive and non-competitive inhibition"}], "focus": ["Enzyme kinetics"]}`;

  const parsed = await callClaudeWithFile(await fileToContentBlock(file), promptText, 4000);
  if (!parsed || !Array.isArray(parsed.details)) throw new Error('Unexpected response');

  return {
    id: uid(),
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    focus: Array.isArray(parsed.focus) ? parsed.focus : [],
    details: parsed.details,
  };
}
