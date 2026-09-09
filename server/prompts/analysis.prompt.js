/**
 * Structured, maintainable prompt builders for the Gemini analysis call.
 * Kept separate from service code so prompts are easy to edit.
 */

export const SYSTEM_PROMPT = `You are SmartPrep, an AI study analyst for university semester examinations.

Your job: analyze multiple past examination papers and identify what a student should focus on. This is exam *preparation intelligence*, not a quiz generator and not a fortune-teller.

Critical rules:
1. Identify HIGH-YIELD TOPICS and RECURRING CONCEPTS — the underlying concepts, not literal strings.
2. Group DIFFERENT questions that test the SAME concept into one topic/pattern. Do NOT rely on exact text matching; questions can be worded differently but test the same idea.
3. Distinguish three things clearly:
   - Exact repeated questions (identical or near-identical wording across papers)
   - Similar questions testing the same concept (different wording, same concept)
   - Different questions belonging to the same topic (same topic area, distinct questions)
4. Report patterns as frequencies across papers. Never claim to predict the exact questions on the upcoming exam.
5. Be specific and concrete. Use the actual question text you were given as examples. Do not invent topics or questions that are not supported by the provided papers.
6. IMPORTANT: Do not just count exact text matches. Weigh semantic similarity and shared concepts.

Output ONLY valid JSON matching the schema described in the user message. No prose, no markdown, no code fences.`;

/**
 * Build the user-side message containing the papers to analyze.
 * @param {{ id: string; name: string; text: string; questions: Array<{question: string}> }[]} papers
 * @param {{ subjectName?: string; courseName?: string }} meta
 */
export function buildAnalysisUserContent(papers, meta = {}) {
  const header = [
    'Analyze the following semester examination papers.',
    '',
    `Subject / course (context): ${meta.subjectName || meta.courseName || 'Not specified'}`,
    `Number of papers provided: ${papers.length}`,
    '',
    '=== PAPERS ===',
  ].join('\n');

  const body = papers
    .map((paper, i) => {
      const lines = [
        `--- PAPER ${i + 1} | name="${paper.name}" | id="${paper.id}" ---`,
        `Questions detected: ${paper.questions.length}`,
        '',
        paper.questions.map((q, qi) => `[${paper.name} / Q${qi + 1}]\n${q.question}`).join('\n\n'),
      ];
      return lines.join('\n');
    })
    .join('\n\n');

  const schema = `
=== REQUIRED OUTPUT SCHEMA ===
{
  "topics": [
    {
      "name": "short topic/concept name",
      "frequency": <number of papers in which this topic appears>,
      "totalPapers": <total number of papers provided>,
      "papers": ["exact paper names (from the name=" fields above)"],
      "importance": "high" | "medium" | "low",
      "questionPatterns": ["short descriptions of recurring question types for this topic"],
      "reason": "one or two sentences explaining why this is important based on the evidence"
    }
  ],
  "questionPatterns": [
    {
      "pattern": "description of the repeated question pattern",
      "frequency": <number of times / papers this pattern appears>,
      "examples": ["quoted question text pulled from the papers above"]
    }
  ],
  "preparationOrder": [
    {
      "topic": "topic name (should reference entries in topics)",
      "priority": <1 = study first, higher = later>,
      "reason": "clear explanation of why this priority"
    }
  ]
}

Rules for the output:
- "frequency" and "totalPapers" must be integers. Every topic's "papers" list must contain only names exactly as given in the name=" fields.
- "importance": high = appears in most papers and is likely core; medium = recurring but moderate; low = occasional.
- preparationOrder must rank topics from highest to lowest priority (priority 1 first).
- Return real counts based on the evidence. If a topic appears in all papers, frequency == totalPapers.
- Always include at least the strongest 3 topics and up to ~10.
`;

  return `${header}\n\n${body}\n\n${schema}`;
}