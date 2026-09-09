/**
 * Split a normalized paper into question blocks using common numbering markers.
 * This is heuristic only — boundaries are preserved so the AI always knows which
 * question text came from which paper. If no reliable markers are found, the
 * whole paper is returned as a single block (the AI still analyzes it).
 */

const QUESTION_MARKERS = [
  /^question\s*(\d+)\b/i,
  /^q\.?\s*(\d+)\b/i,
  /^(\d+)\s*[.)]\s*\S/i,
  /^(\d+)\s{2,}\S/i,
  /^section\s*[-\u2013]?\s*[A-Za-z]\b/i,
  /^part\s*[-\u2013]?\s*[A-Za-z]\b/i,
];

function splitByMarkers(lines) {
  const blocks = [];
  let current = [];
  let lastIndex = -1;

  for (const line of lines) {
    let isMarker = false;
    for (const regex of QUESTION_MARKERS) {
      const match = line.match(regex);
      if (match) {
        const idx = Number.parseInt(match[1], 10) || 0;
        if (lastIndex === -1 || idx === lastIndex + 1 || idx === lastIndex) {
          isMarker = true;
          lastIndex = idx;
          break;
        }
      }
    }

    if (isMarker) {
      if (current.length) blocks.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length) blocks.push(current.join('\n'));
  return blocks;
}

export function splitQuestions(normalizedText) {
  if (!normalizedText) return [];

  const lines = normalizedText.split('\n');
  const blocks = splitByMarkers(lines);

  // If no numbered markers were found, treat the whole paper as a single block.
  if (blocks.length === 0) {
    return [{ question: normalizedText.trim() }];
  }

  // The first block is usually paper preamble (university name, instructions)
  // before the first question marker — drop it so headers are not counted as questions.
  const questionBlocks = blocks.slice(1);

  // Heuristic quality check: require blocks to be reasonably sized.
  const meaningful = questionBlocks.filter((b) => b.trim().length >= 15);
  if (meaningful.length < 2) {
    return [{ question: normalizedText.trim() }];
  }

  return meaningful.map((b) => ({
    question: b.trim(),
  }));
}