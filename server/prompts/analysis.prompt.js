export const SYSTEM_PROMPT = `You are SmartPrep, an AI study analyst for university semester examinations and academic curriculum optimization.

Your job: analyze academic documents—including Syllabus documents, Past Examination Papers (PYQs), and Lecture Notes/Textbooks—and generate precise, evidence-grounded study intelligence.

CRITICAL DATA ACCURACY RULES:
1. SYLLABUS WEIGHTAGE: Do NOT invent numerical weightage or marks percentages. If the syllabus explicitly states weightage/marks/contact hours, record it verbatim. If not present, set "weightage" to null.
2. PYQ FREQUENCY: Calculate "frequency" strictly based on actual paper appearances. If a topic appears in 3 out of 5 papers, frequency = 3 and totalPapers = 5. Do NOT invent fake numbers.
3. YEAR TRENDS: Extract year numbers (e.g. 2022, 2023, 2024) from paper names or headers. If a paper has no identifiable year, group its occurrences under "Unknown".
4. QUESTION TYPES: Classify questions into "theory", "numerical", "derivation", "diagram", or "other" based strictly on extracted question text.
5. CROSS-DOCUMENT COVERAGE: Set "notesCovered": true ONLY when the relevant topic is explicitly found in the provided notes/textbook text.
6. NO SPECULATIVE CLAIMS: Base all findings strictly on the provided documents.

Output ONLY valid JSON matching the required schema. No prose, no markdown fences.`;

/**
 * Build the user-side message containing papers, syllabus, and notes.
 * @param {{ papers: Array, syllabus?: Array, notes?: Array, meta?: Object }} data
 */
export function buildAnalysisUserContent({ papers = [], syllabus = [], notes = [], meta = {} }) {
  const sections = [];

  sections.push(`Subject / Course Context: ${meta.subjectName || meta.courseName || 'Not specified'}`);

  if (syllabus.length > 0) {
    sections.push('=== SYLLABUS DOCUMENTS ===');
    syllabus.forEach((doc, i) => {
      sections.push(`--- SYLLABUS ${i + 1} | name="${doc.name}" ---\n${doc.text}`);
    });
  }

  if (notes.length > 0) {
    sections.push('=== LECTURE NOTES / TEXTBOOK DOCUMENTS ===');
    notes.forEach((doc, i) => {
      sections.push(`--- NOTES ${i + 1} | name="${doc.name}" ---\n${doc.text.slice(0, 4000)}`);
    });
  }

  if (papers.length > 0) {
    sections.push('=== PAST EXAMINATION PAPERS (PYQs) ===');
    papers.forEach((paper, i) => {
      const yearInfo = paper.year ? ` | year="${paper.year}"` : '';
      sections.push(`--- PAPER ${i + 1} | name="${paper.name}"${yearInfo} | id="${paper.id}" ---`);
      sections.push(`Questions detected: ${paper.questions.length}`);
      sections.push(paper.questions.map((q, qi) => `[${paper.name} / Q${qi + 1}]\n${q.question}`).join('\n\n'));
    });
  }

  const schemaInstruction = `
=== REQUIRED JSON OUTPUT SCHEMA ===
{
  "syllabusUnits": [
    {
      "unitNumber": 1,
      "unitName": "Unit / Module Name",
      "topics": ["Topic A", "Topic B"],
      "weightage": "15 Marks" or null
    }
  ],
  "prerequisites": [
    {
      "topic": "Topic B",
      "prerequisiteTopic": "Topic A",
      "reason": "Topic B builds directly upon Topic A principles"
    }
  ],
  "topics": [
    {
      "name": "Topic Name",
      "unitName": "Unit 1" or null,
      "frequency": <number of papers where this topic appears>,
      "totalPapers": ${papers.length},
      "papers": ["exact paper names"],
      "importance": "high" | "medium" | "low",
      "questionPatterns": ["recurring pattern summary"],
      "reason": "evidence-backed reason"
    }
  ],
  "questionPatterns": [
    {
      "pattern": "Description of pattern",
      "type": "theory" | "numerical" | "derivation" | "diagram" | "other",
      "frequency": <number of papers>,
      "examples": ["quoted question text"]
    }
  ],
  "yearTrends": [
    {
      "topic": "Topic Name",
      "yearlyCounts": { "2022": 1, "2023": 2, "Unknown": 0 }
    }
  ],
  "questionTypes": [
    {
      "type": "theory",
      "count": 5,
      "percentage": 50.0
    }
  ],
  "crossDocumentMatrix": [
    {
      "topic": "Topic Name",
      "unitName": "Unit 1" or null,
      "pyqFrequency": <number of papers>,
      "totalPapers": ${papers.length},
      "notesCovered": true or false,
      "notesSources": [{ "documentName": "Notes.pdf", "pageNumber": 1 }],
      "status": "high-priority" | "gap" | "covered" | "low-yield"
    }
  ],
  "preparationOrder": [
    {
      "topic": "Topic Name",
      "priority": 1,
      "reason": "Clear explanation based on exam frequency and syllabus positioning"
    }
  ]
}
`;

  return `${sections.join('\n\n')}\n\n${schemaInstruction}`;
}