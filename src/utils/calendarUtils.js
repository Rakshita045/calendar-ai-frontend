/**
 * Helper to add days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr, days) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Helper to calculate difference in days between two date strings (inclusive)
 */
export function getDaysDifference(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end - start;
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Standard date formatter to YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get weekday name from index (0 = Sunday, 1 = Monday, etc.)
 */
export function getWeekdayName(index) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index];
}

/**
 * Determines whether an event is applicable to a specific semester.
 * It checks explicit semester mappings and does title-keyword based exclusions for other semesters.
 */
export function isEventApplicableToSemester(e, semester) {
  if (!e) return false;
  
  // If the event has specific semesters assigned, check if it matches
  if (e.semesters && e.semesters.length > 0) {
    return e.semesters.includes(semester);
  }

  // Fallback: Check title heuristics for mentions of OTHER semesters
  const titleLower = e.title.toLowerCase();
  
  // Define semester keywords indicating specific semesters
  const semesterKeywords = {
    1: ['i sem', 'i-sem', '1st sem', '1st-sem', 'first sem', 'first-sem', 'sem i', 'sem-i', 'semester i', 'semester-i'],
    2: ['ii sem', 'ii-sem', '2nd sem', '2nd-sem', 'second sem', 'second-sem', 'sem ii', 'sem-ii', 'semester ii', 'semester-ii'],
    3: ['iii sem', 'iii-sem', '3rd sem', '3rd-sem', 'third sem', 'third-sem', 'sem iii', 'sem-iii', 'semester iii', 'semester-iii'],
    4: ['iv sem', 'iv-sem', '4th sem', '4th-sem', 'fourth sem', 'fourth-sem', 'sem iv', 'sem-iv', 'semester iv', 'semester-iv'],
    5: ['v sem', 'v-sem', '5th sem', '5th-sem', 'fifth sem', 'fifth-sem', 'sem v', 'sem-v', 'semester v', 'semester-v'],
    6: ['vi sem', 'vi-sem', '6th sem', '6th-sem', 'sixth sem', 'sixth-sem', 'sem vi', 'sem-vi', 'semester vi', 'semester-vi'],
    7: ['vii sem', 'vii-sem', '7th sem', '7th-sem', 'seventh sem', 'seventh-sem', 'sem vii', 'sem-vii', 'semester vii', 'semester-vii'],
    8: ['viii sem', 'viii-sem', '8th sem', '8th-sem', 'eighth sem', 'eighth-sem', 'sem viii', 'sem-viii', 'semester viii', 'semester-viii']
  };

  // If the title contains keywords for a different semester, it is not applicable
  for (const [semNumStr, keywords] of Object.entries(semesterKeywords)) {
    const semNum = parseInt(semNumStr, 10);
    if (semNum !== semester) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Calculates working dates based on two exam periods.
 * Teaching dates run from semesterStartDate up to one day before exam2StartDate.
 * Any dates during exam1StartDate to exam1EndDate are deducted.
 */
export function calculateWorkingDates({
  semester,
  semesterStartDate,
  exam1StartDate,
  exam1EndDate,
  exam2StartDate,
  exam2EndDate,
  events,
  courseClassDays
}) {
  if (!semesterStartDate || !exam1StartDate || !exam1EndDate || !exam2StartDate) {
    return [];
  }

  const start = new Date(semesterStartDate);
  // Loop ends one day before Second Mid Term Exam starts (last working day of the semester)
  const end = new Date(exam2StartDate);
  end.setDate(end.getDate() - 1);
  
  if (end < start) return [];

  const workingDates = [];
  const currentDate = new Date(start);

  // Convert events list to easy-to-query format
  const eventsByDate = {};
  for (const event of events) {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  }

  // Iterate through each calendar date from semester start to the day before Second Mid Term Exam
  while (currentDate <= end) {
    const dateStr = formatDate(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Check if the date falls during Exam 1 (First Mid Term) or Exam 2 (Second Mid Term)
    const isExam1Period = dateStr >= exam1StartDate && dateStr <= exam1EndDate;
    const isExam2Period = exam2EndDate 
      ? (dateStr >= exam2StartDate && dateStr <= exam2EndDate)
      : (dateStr === exam2StartDate);

    // 2. Check if the date is a general or semester-specific holiday
    let isHoliday = false;
    let cancelClass = false;
    let forceExtraClass = false;

    const dayEvents = eventsByDate[dateStr] || [];
    for (const e of dayEvents) {
      const isApplicableToSemester = isEventApplicableToSemester(e, semester);

      if (isApplicableToSemester) {
        if (e.type === 'holiday') {
          isHoliday = true;
        }
        if (e.type === 'cancel_class') {
          cancelClass = true;
        }
        if (e.type === 'extra_class') {
          forceExtraClass = true;
        }
      }
    }

    // 3. Semester Working Days Rule:
    // Sem 1-6: Mon-Fri working days
    // Sem 7-8: Mon-Wed working days
    let isSemesterWorkingDay = false;
    if (semester >= 1 && semester <= 6) {
      isSemesterWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (semester === 7 || semester === 8) {
      isSemesterWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 3;
    }

    // 4. Course Scheduled Days Rule
    const isCourseScheduledDay = courseClassDays.includes(dayOfWeek);

    // Standard working date check
    const isClassHeld = (forceExtraClass || (
      isSemesterWorkingDay &&
      isCourseScheduledDay &&
      !isHoliday &&
      !isExam1Period &&
      !isExam2Period &&
      !cancelClass
    ));

    if (isClassHeld) {
      const relevantEvent = dayEvents.find(e => isEventApplicableToSemester(e, semester));

      workingDates.push({
        date: dateStr,
        dayOfWeek,
        dayName: getWeekdayName(dayOfWeek),
        isExtra: forceExtraClass,
        eventName: relevantEvent ? relevantEvent.title : ''
      });
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDates;
}

/**
 * Format date string from YYYY-MM-DD to DD-MM-YYYY
 */
export function formatToDdMmYyyy(dateStr) {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

/**
 * Exports the calculated working dates to CSV format with sections, dates, and days.
 */
export function exportWorkingDatesToCsv(semester, workingDates, exam1StartDate, exam1EndDate) {
  const csvRows = [];
  
  const firstMidTermLectures = workingDates.filter(wd => wd.date < exam1StartDate);
  const secondMidTermLectures = workingDates.filter(wd => wd.date > exam1EndDate);

  csvRows.push("First Mid Term Lectures,");
  csvRows.push("Date,Day");
  firstMidTermLectures.forEach((wd) => {
    csvRows.push(`${formatToDdMmYyyy(wd.date)},${wd.dayName}`);
  });

  csvRows.push(""); // Empty line separator

  csvRows.push("Second Mid Term Lectures,");
  csvRows.push("Date,Day");
  secondMidTermLectures.forEach((wd) => {
    csvRows.push(`${formatToDdMmYyyy(wd.date)},${wd.dayName}`);
  });

  // Create Blob and trigger download
  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const sanitizedFilename = `working_dates_sem_${semester}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", sanitizedFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

