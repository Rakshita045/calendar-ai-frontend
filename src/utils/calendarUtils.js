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
  return date.toISOString().split('T')[0];
}

/**
 * Get weekday name from index (0 = Sunday, 1 = Monday, etc.)
 */
export function getWeekdayName(index) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index];
}

/**
 * Calculates working dates for a specific course based on academic calendars and syllabus schedule.
 */
export function calculateWorkingDates({
  semester,
  semesterStartDate,
  examStartDate,
  examEndDate,
  events,
  courseClassDays, // Array of weekdays [0-6] where this course has lectures
  courseId
}) {
  if (!semesterStartDate || !examStartDate || !examEndDate) {
    return [];
  }

  const start = new Date(semesterStartDate);
  const end = new Date(examEndDate);
  
  if (end < start) return [];

  const workingDates = [];
  const currentDate = new Date(start);

  // Convert events list to easy-to-query format
  // Key: YYYY-MM-DD, Value: list of events on that date
  const eventsByDate = {};
  for (const event of events) {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  }

  // Iterate through each calendar date from semester start to exam end
  while (currentDate <= end) {
    const dateStr = formatDate(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Check if the date falls during exams
    const isExamPeriod = dateStr >= examStartDate && dateStr <= examEndDate;

    // 2. Check if the date is a general or semester-specific holiday
    let isHoliday = false;
    let cancelClass = false;
    let forceExtraClass = false;

    const dayEvents = eventsByDate[dateStr] || [];
    for (const e of dayEvents) {
      const isApplicableToSemester = e.semesters && (e.semesters.length === 0 || e.semesters.includes(semester));
      const isApplicableToCourse = !e.courseId || e.courseId === courseId;

      if (isApplicableToSemester) {
        if (e.type === 'holiday') {
          isHoliday = true;
        }
        if (e.type === 'cancel_class' && isApplicableToCourse) {
          cancelClass = true;
        }
        if (e.type === 'extra_class' && isApplicableToCourse) {
          forceExtraClass = true;
        }
      }
    }

    // 3. Semester Working Days Rule:
    // Sem 1-6: Mon-Fri working days (Sat, Sun off)
    // Sem 7-8: Mon-Wed working days (Thu, Fri, Sat, Sun off)
    let isSemesterWorkingDay = false;
    if (semester >= 1 && semester <= 6) {
      isSemesterWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    } else if (semester === 7 || semester === 8) {
      isSemesterWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 3; // Monday to Wednesday
    }

    // 4. Course Scheduled Days Rule:
    // Check if the teacher has class scheduled on this weekday
    const isCourseScheduledDay = courseClassDays.includes(dayOfWeek);

    // Standard working date check:
    // It must be a semester working day, a course scheduled day, not a holiday, not an exam day, and not cancelled.
    // OR it must be explicitly forced as an extra class (which overrides normal working day rules).
    const isClassHeld = (forceExtraClass || (
      isSemesterWorkingDay &&
      isCourseScheduledDay &&
      !isHoliday &&
      !isExamPeriod &&
      !cancelClass
    ));

    if (isClassHeld) {
      // Find active event on this day if any
      const relevantEvent = dayEvents.find(e => 
        e.semesters && (e.semesters.length === 0 || e.semesters.includes(semester))
      );

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
 * Distributes syllabus topics across calculated working dates
 */
export function mapSyllabusToDates(workingDates, topics) {
  return workingDates.map((wd, index) => {
    const topic = topics[index] || null;
    return {
      lectureNumber: index + 1,
      date: wd.date,
      dayName: wd.dayName,
      isExtra: wd.isExtra,
      eventName: wd.eventName,
      topicId: topic ? topic.id : null,
      topicName: topic ? topic.name : 'Unassigned / Buffer Class',
      notes: topic ? (topic.notes || '') : ''
    };
  });
}

/**
 * Exports the structured lecture plan to CSV format and triggers browser download
 */
export function exportLecturePlanToCsv(courseName, semester, mappedLectures, unmappedTopics = []) {
  const csvRows = [];
  
  // Title / Metadata header
  csvRows.push(`"Academic Lecture Plan - ${courseName}"`);
  csvRows.push(`"Semester",${semester}`);
  csvRows.push(`"Generated Date","${new Date().toLocaleDateString()}"`);
  csvRows.push(''); // Empty spacer line

  // Column Headers
  csvRows.push('"Lecture #","Date","Day","Topic / Lecture Content","Special Events / Holidays","Notes / Tasks"');

  // Main Lecture schedule
  for (const lecture of mappedLectures) {
    const row = [
      lecture.lectureNumber,
      lecture.date,
      lecture.dayName,
      `"${lecture.topicName.replace(/"/g, '""')}"`,
      `"${(lecture.eventName || (lecture.isExtra ? 'Extra Class' : '')).replace(/"/g, '""')}"`,
      `"${(lecture.notes || '').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  }

  // Append unmapped topics at the bottom if any exist
  if (unmappedTopics.length > 0) {
    csvRows.push('');
    csvRows.push('"UNMAPPED SYLLABUS TOPICS (Not enough working class dates)"');
    csvRows.push('"Topic Name","Status"');
    for (const t of unmappedTopics) {
      csvRows.push(`"${t.name.replace(/"/g, '""')}","Unscheduled"`);
    }
  }

  // Create Blob and trigger download
  const csvContent = "\uFEFF" + csvRows.join("\n"); // add BOM for Excel UTF-8 compliance
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const sanitizedFilename = `lecture_plan_${courseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", sanitizedFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
