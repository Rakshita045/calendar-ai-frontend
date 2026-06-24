/**
 * Heuristics for parsing academic calendar text client-side.
 */

// Month mappings for text parsing
const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8, sept: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

// Convert roman numerals to numbers
const ROMAN_MAP = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8
};

/**
 * Parses Roman numeral or word semesters (e.g., VII, 7th, First, Sem-3) to semester numbers
 */
function extractSemesters(text) {
  const lowercase = text.toLowerCase();
  
  // Exclude midterm/MST index prefixes so we do not extract the exam number as a semester
  const textForAnalysis = lowercase
    .replace(/\b(?:first|1st|i|1)\b\s*(?:mid[- ]term|midterm|mst)/g, '')
    .replace(/\b(?:second|2nd|ii|2)\b\s*(?:mid[- ]term|midterm|mst)/g, '');

  const semesters = new Set();

  // Require academic/semester context to prevent false positives in holiday dates or names
  const hasAcademicKeyword = /\b(?:sem|semester|term|class|classes|commencement|exam|mst|test|practical|viva|instruction|teaching)\b/i.test(lowercase);
  if (!hasAcademicKeyword) {
    return [];
  }

  // Look for Roman numerals I to VIII as standalone words (check longest first to prevent partial match issues)
  const romanPattern = /\b(viii|vii|vi|iv|v|iii|ii|i)\b/g;
  let match;
  while ((match = romanPattern.exec(textForAnalysis)) !== null) {
    const val = match[1];
    if (ROMAN_MAP[val]) {
      semesters.add(ROMAN_MAP[val]);
    }
  }

  // Look for digits 1 to 8 (optionally followed by ordinal suffix, e.g. "5th", "5")
  const digitPattern = /\b([1-8])(?:st|nd|rd|th)?\b/g;
  while ((match = digitPattern.exec(textForAnalysis)) !== null) {
    semesters.add(parseInt(match[1], 10));
  }

  // Look for written semester words (first to eighth)
  const words = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
  for (let i = 0; i < words.length; i++) {
    const wordPattern = new RegExp(`\\b${words[i]}\\b`, 'g');
    if (wordPattern.test(textForAnalysis)) {
      semesters.add(i + 1);
    }
  }

  return Array.from(semesters).sort((a, b) => a - b);
}

/**
 * Normalizes a date matching various regex patterns.
 * Returns a "YYYY-MM-DD" string or null.
 */
function parseDateHeuristically(text, defaultYear = new Date().getFullYear()) {
  const cleaned = text.trim().replace(/\s+/g, ' ');

  // 1. Matches YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = cleaned.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 2. Matches DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleaned.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. Matches DD Month YYYY (e.g. 15th August 2026, 15 Aug 2026, 15-Aug-2026, 15/Aug/2026)
  const ddMonthYMatch = cleaned.match(/\b(\d{1,2})(?:st|nd|rd|th)?[-/\s,]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s,]+(\d{4})\b/i);
  if (ddMonthYMatch) {
    const [, d, monthStr, y] = ddMonthYMatch;
    const m = MONTH_MAP[monthStr.toLowerCase()];
    if (m !== undefined) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // 4. Matches Month DD YYYY (e.g. August 15th 2026, Aug 15, 2026)
  const monthDdYMatch = cleaned.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s,]+(\d{1,2})(?:st|nd|rd|th)?[-/\s,]+(\d{4})\b/i);
  if (monthDdYMatch) {
    const [, monthStr, d, y] = monthDdYMatch;
    const m = MONTH_MAP[monthStr.toLowerCase()];
    if (m !== undefined) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // 5. Matches DD Month (without year) (e.g., 15th Aug, 15-August)
  const ddMonthMatch = cleaned.match(/\b(\d{1,2})(?:st|nd|rd|th)?[-/\s,]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);
  if (ddMonthMatch) {
    const [, d, monthStr] = ddMonthMatch;
    const m = MONTH_MAP[monthStr.toLowerCase()];
    if (m !== undefined) {
      return `${defaultYear}-${String(m + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // 6. Matches Month DD (without year) (e.g. August 15, Aug-15)
  const monthDdMatch = cleaned.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s,]+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (monthDdMatch) {
    const [, monthStr, d] = monthDdMatch;
    const m = MONTH_MAP[monthStr.toLowerCase()];
    if (m !== undefined) {
      return `${defaultYear}-${String(m + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Classifies the type of calendar event based on textual cues.
 */
function classifyEventType(title) {
  const lowercase = title.toLowerCase();
  
  // Holidays
  if (
    lowercase.includes('holiday') ||
    lowercase.includes('vacation') ||
    lowercase.includes('break') ||
    lowercase.includes('republic day') ||
    lowercase.includes('independence day') ||
    lowercase.includes('diwali') ||
    lowercase.includes('christmas') ||
    lowercase.includes('eid') ||
    lowercase.includes('gandhi jayanti') ||
    lowercase.includes('holi') ||
    lowercase.includes('dussehra') ||
    lowercase.includes('off day') ||
    lowercase.includes('closed') ||
    lowercase.includes('non-working')
  ) {
    return 'holiday';
  }

  // Exams
  if (
    lowercase.includes('exam') ||
    lowercase.includes('examination') ||
    lowercase.includes('ese') ||
    lowercase.includes('test') ||
    lowercase.includes('midterm') ||
    lowercase.includes('endsem') ||
    lowercase.includes('practical') ||
    lowercase.includes('viva') ||
    lowercase.includes('mst')
  ) {
    return 'exam';
  }

  // Default is a general event
  return 'event';
}

/**
 * Parses full multiline text block and extracts structured event objects.
 */
export function parseAcademicText(text, defaultYear = new Date().getFullYear()) {
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const parsedEvents = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue; // Skip short/empty lines

    // Parse date
    const dateStr = parseDateHeuristically(trimmed, defaultYear);
    if (!dateStr) continue; // Skip lines that don't have a date

    // Extract title (the line excluding the date portion)
    // To do this simply, we strip out the matched date or common date formats.
    // An alternative: clean up common date representations.
    let title = trimmed
      // Strip dates like 2026-08-15 or 15/08/2026 or 15-08-2026
      .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '')
      .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, '')
      // Strip dates like 15th August 2026 or 15 Aug 2026
      .replace(/\b\d{1,2}(?:st|nd|rd|th)?[-/\s,]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s,]+\d{4}\b/gi, '')
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s,]+\d{1,2}(?:st|nd|rd|th)?[-/\s,]+\d{4}\b/gi, '')
      // Strip dates without year
      .replace(/\b\d{1,2}(?:st|nd|rd|th)?[-/\s,]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, '')
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s,]+\d{1,2}(?:st|nd|rd|th)?\b/gi, '')
      // Strip separators
      .replace(/^[\s\-:/,]+|[\s\-:/,]+$/g, '') // leading/trailing symbols
      .replace(/\s+/g, ' ')
      .trim();

    if (!title) {
      title = classifyEventType(trimmed) === 'exam' ? 'Exams Start' : 'Academic Event';
    }

    const type = classifyEventType(title || trimmed);
    const semesters = extractSemesters(trimmed);

    parsedEvents.push({
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      date: dateStr,
      type: type,
      semesters: semesters // empty array means applicable to all semesters
    });
  }

  // Sort events by date ascending
  return parsedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
}
