import React, { useState, useEffect } from 'react';
import { parsePdfCalendar } from './utils/pdfParser';
import { parseIcsCalendar } from './utils/icsParser';
import {
  addDays,
  getDaysDifference,
  formatDate,
  calculateWorkingDates,
  exportWorkingDatesToCsv,
  formatToDdMmYyyy,
  isEventApplicableToSemester
} from './utils/calendarUtils';
import './App.css';

// SVG Inline Icons
const Icons = {
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  )
};

const DEFAULT_SESSION_NAME = "Term Working Dates Planner";
const DEFAULT_EVENTS = [
  { id: 'ev-1', title: 'Independence Day Holiday', date: '2026-08-15', type: 'holiday', semesters: [] },
  { id: 'ev-2', title: 'Raksha Bandhan', date: '2026-08-28', type: 'holiday', semesters: [] },
  { id: 'ev-3', title: 'Teachers Day Celebration', date: '2026-09-05', type: 'event', semesters: [] },
  { id: 'ev-4', title: 'Gandhi Jayanti Holiday', date: '2026-10-02', type: 'holiday', semesters: [] },
  { id: 'ev-5', title: 'First Mid Term Exams Begin', date: '2026-09-07', type: 'exam_1', semesters: [] },
  { id: 'ev-7', title: 'Second Mid Term Exams Begin', date: '2026-11-23', type: 'exam_2', semesters: [] }
];

export default function App() {
  // Wizard Steps:
  // 1: Upload / Paste Calendar
  // 2: Choose Semester (runs auto-detection)
  // 3: Exam End Date Parameters (for both midterms)
  // 4: Configure Class Days
  // 5: Working Dates Dashboard
  const [currentStep, setCurrentStep] = useState(1);

  // Session State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [sessionName, setSessionName] = useState(DEFAULT_SESSION_NAME);
  const [subjectName, setSubjectName] = useState('');

  // Term Parameters
  const [semester, setSemester] = useState(5);
  const [semesterStartDate, setSemesterStartDate] = useState('2026-08-03');
  const [lastTeachingDate, setLastTeachingDate] = useState('2026-11-20');
  const lastTeachingInputRef = React.useRef(null);

  // Exam 1 (First Mid Term) State
  const [exam1StartDate, setExam1StartDate] = useState('2026-09-07');
  const [exam1Duration, setExam1Duration] = useState(4);
  const [exam1EndDate, setExam1EndDate] = useState('');
  const [exam1InputMode, setExam1InputMode] = useState('duration');

  // Exam 2 (Second Mid Term) State
  const [exam2StartDate, setExam2StartDate] = useState('2026-11-23');
  const [exam2Duration, setExam2Duration] = useState(5);
  const [exam2EndDate, setExam2EndDate] = useState('2026-11-27');
  const [exam2InputMode, setExam2InputMode] = useState('duration');

  // Weekdays Schedule: Monday, Wednesday, Friday default
  const [classDays, setClassDays] = useState([1, 3, 5]);

  // General Calendar Events
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Legend checkboxes count toggle state
  const [showCounts, setShowCounts] = useState({
    lectures: false,
    holidays: false,
    exams: false,
    weekends: false,
    cancelled: false
  });

  // Auto-detection results feedback state
  const [detectedStartFeedback, setDetectedStartFeedback] = useState(null);
  const [detectedExam1Feedback, setDetectedExam1Feedback] = useState(null);
  const [detectedLastTeachingFeedback, setDetectedLastTeachingFeedback] = useState(null);

  // Ref for start date input to make pen clickable
  const startDateInputRef = React.useRef(null);

  // Interactive Calendar month navigation
  const [calendarMonth, setCalendarMonth] = useState(new Date('2026-08-01'));

  // UI states
  const [loading, setLoading] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [calendarPopupDate, setCalendarPopupDate] = useState(null);
  const [calendarPopupForm, setCalendarPopupForm] = useState({ title: '', type: 'holiday', semesterSpec: 'all', customCourseId: '' });

  // Print & PDF states
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const getAvailableSemestersForEvents = (currentEvents) => {
    let oddMentions = 0;
    let evenMentions = 0;

    for (const e of currentEvents) {
      if (e.semesters && e.semesters.length > 0) {
        for (const sem of e.semesters) {
          if ([1, 3, 5, 7].includes(sem)) oddMentions++;
          if ([2, 4, 6, 8].includes(sem)) evenMentions++;
        }
      }
    }

    let termType = 'all';
    if (evenMentions > oddMentions) {
      termType = 'even';
    } else if (oddMentions > evenMentions) {
      termType = 'odd';
    } else {
      // Guess based on month of the events (Even semesters are usually Jan-June, Odd are July-Dec)
      let janToJune = 0;
      let julyToDec = 0;
      for (const e of currentEvents) {
        if (e.date) {
          const month = new Date(e.date).getMonth(); // 0-11
          if (month >= 0 && month <= 5) janToJune++;
          else if (month >= 6 && month <= 11) julyToDec++;
        }
      }
      if (janToJune > julyToDec) termType = 'even';
      else if (julyToDec > janToJune) termType = 'odd';
    }

    if (termType === 'even') return [2, 4, 6, 8];
    if (termType === 'odd') return [1, 3, 5, 7];
    return [1, 2, 3, 4, 5, 6, 7, 8];
  };

  const getAvailableSemesters = () => {
    return getAvailableSemestersForEvents(events);
  };

  // Load Sessions index and current session data on mount
  useEffect(() => {
    const savedSessionsIndex = localStorage.getItem('academic_sessions_index');
    if (savedSessionsIndex) {
      const index = JSON.parse(savedSessionsIndex);
      setSessions(index);
      const activeSession = localStorage.getItem('academic_active_session_id') || (index[0] && index[0].id);
      if (activeSession) {
        loadSession(activeSession);
      } else {
        createNewSession();
      }
    } else {
      const defaultId = 'session-' + Date.now();
      const initialIndex = [{ id: defaultId, name: DEFAULT_SESSION_NAME }];
      setSessions(initialIndex);
      setCurrentSessionId(defaultId);
      localStorage.setItem('academic_sessions_index', JSON.stringify(initialIndex));
      localStorage.setItem('academic_active_session_id', defaultId);
      saveSessionData(defaultId, {
        sessionName: DEFAULT_SESSION_NAME,
        semester: 5,
        semesterStartDate: '2026-08-03',
        exam1StartDate: '2026-09-07',
        exam1Duration: 4,
        exam1EndDate: '',
        exam1InputMode: 'duration',
        exam2StartDate: '2026-11-23',
        exam2Duration: 5,
        exam2EndDate: '2026-11-27',
        exam2InputMode: 'duration',
        classDays: [1, 3, 5],
        events: DEFAULT_EVENTS,
        currentStep: 1
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save session whenever parameters change
  useEffect(() => {
    if (!currentSessionId) return;
    saveSessionData(currentSessionId, {
      sessionName,
      subjectName,
      semester,
      semesterStartDate,
      lastTeachingDate,
      exam1StartDate,
      exam1Duration,
      exam1EndDate,
      exam1InputMode,
      exam2StartDate,
      exam2Duration,
      exam2EndDate,
      exam2InputMode,
      classDays,
      events,
      currentStep,
      uploadedFileName
    });
  }, [
    currentSessionId, sessionName, subjectName, semester, semesterStartDate, lastTeachingDate,
    exam1StartDate, exam1Duration, exam1EndDate, exam1InputMode,
    exam2StartDate, exam2Duration, exam2EndDate, exam2InputMode,
    classDays, events, currentStep, uploadedFileName
  ]);

  // Exam 1 Dates Syncing
  const handleExam1StartChange = (val) => {
    setExam1StartDate(val);
    if (exam1EndDate) {
      const diff = getDaysDifference(val, exam1EndDate);
      setExam1Duration(diff > 0 ? diff : 1);
      if (new Date(val) > new Date(exam1EndDate)) {
        setExam1EndDate('');
        setExam1Duration(1);
      }
    } else {
      setExam1Duration(1);
    }
  };

  const handleExam1EndDateChange = (val) => {
    setExam1EndDate(val);
    if (exam1StartDate && val) {
      const diff = getDaysDifference(exam1StartDate, val);
      setExam1Duration(diff > 0 ? diff : 1);
      if (new Date(val) < new Date(exam1StartDate)) {
        setExam1StartDate(val);
        setExam1Duration(1);
      }
    } else {
      setExam1Duration(1);
    }
  };

  // Last Teaching Date Syncing
  const handleLastTeachingDateChange = (val) => {
    setLastTeachingDate(val);
    const nextDay = addDays(val, 1);
    setExam2StartDate(nextDay);
    setExam2EndDate(addDays(nextDay, exam2Duration - 1));
  };



  const saveSessionData = (id, data) => {
    localStorage.setItem(`academic_session_${id}`, JSON.stringify(data));
  };

  const loadSession = (id) => {
    const savedData = localStorage.getItem(`academic_session_${id}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setCurrentSessionId(id);
      setSessionName(data.sessionName || "Term Schedule");
      setSubjectName(data.subjectName || '');
      setSemester(data.semester || 5);
      setSemesterStartDate(data.semesterStartDate || '2026-08-03');
      setLastTeachingDate(data.lastTeachingDate || addDays(data.semesterStartDate || '2026-08-03', 90));

      setExam1StartDate(data.exam1StartDate || '2026-09-07');
      setExam1Duration(data.exam1Duration || 4);
      setExam1EndDate((data.exam1EndDate === '2026-09-10' || data.exam1EndDate === '2026-09-11' || data.exam1EndDate === '2026-09-13') ? '' : (data.exam1EndDate || ''));
      setExam1InputMode(data.exam1InputMode || 'duration');

      setExam2StartDate(data.exam2StartDate || '2026-11-23');
      setExam2Duration(data.exam2Duration || 5);
      setExam2EndDate(data.exam2EndDate || '2026-11-27');
      setExam2InputMode(data.exam2InputMode || 'duration');

      setClassDays(data.classDays || [1, 3, 5]);
      setEvents(data.events || []);
      setCurrentStep(data.currentStep || 1);
      setUploadedFileName(data.uploadedFileName || '');
      localStorage.setItem('academic_active_session_id', id);

      if (data.semesterStartDate) {
        setCalendarMonth(new Date(data.semesterStartDate));
      }
    }
  };

  const createNewSession = () => {
    const defaultName = `Academic Plan - Sem ${semester}`;
    const enteredName = window.prompt("Enter a name for this academic term plan:", defaultName);
    if (enteredName === null) return;
    const nameToUse = enteredName.trim() || defaultName;

    const newId = 'session-' + Date.now();
    const newSession = { id: newId, name: nameToUse };
    const updatedIndex = [...sessions, newSession];

    setSessions(updatedIndex);
    setSessionName(nameToUse);
    setCurrentSessionId(newId);
    setCurrentStep(1);

    localStorage.setItem('academic_sessions_index', JSON.stringify(updatedIndex));
    localStorage.setItem('academic_active_session_id', newId);

    const freshState = {
      sessionName: nameToUse,
      subjectName: '',
      semester: 5,
      semesterStartDate: formatDate(new Date()),
      lastTeachingDate: addDays(formatDate(new Date()), 90),
      exam1StartDate: addDays(formatDate(new Date()), 30),
      exam1Duration: 4,
      exam1EndDate: '',
      exam1InputMode: 'duration',
      exam2StartDate: addDays(formatDate(new Date()), 91),
      exam2Duration: 5,
      exam2EndDate: addDays(formatDate(new Date()), 95),
      exam2InputMode: 'duration',
      classDays: [1, 3, 5],
      events: [],
      currentStep: 1,
      uploadedFileName: ''
    };

    setSemester(freshState.semester);
    setSemesterStartDate(freshState.semesterStartDate);
    setLastTeachingDate(freshState.lastTeachingDate);

    setExam1StartDate(freshState.exam1StartDate);
    setExam1Duration(freshState.exam1Duration);
    setExam1EndDate(freshState.exam1EndDate);
    setExam1InputMode(freshState.exam1InputMode);

    setExam2StartDate(freshState.exam2StartDate);
    setExam2Duration(freshState.exam2Duration);
    setExam2EndDate(freshState.exam2EndDate);
    setExam2InputMode(freshState.exam2InputMode);

    setClassDays(freshState.classDays);
    setEvents([]);
    setUploadedFileName('');
    setSubjectName('');

    saveSessionData(newId, freshState);
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      window.alert("You must keep at least one session.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this session? This action is permanent!")) {
      return;
    }

    const updatedIndex = sessions.filter(s => s.id !== id);
    setSessions(updatedIndex);
    localStorage.setItem('academic_sessions_index', JSON.stringify(updatedIndex));
    localStorage.removeItem(`academic_session_${id}`);

    if (currentSessionId === id) {
      loadSession(updatedIndex[0].id);
    }
  };

  const detectTermDates = (semVal, currentEvents) => {
    let detectedStart = '';
    let detectedExam1 = '';
    let detectedLastTeaching = '';

    const isNotEndEvent = (title) => {
      const lower = title.toLowerCase();
      return !lower.includes('end') &&
        !lower.includes('conclude') &&
        !lower.includes('finish') &&
        !lower.includes('over') &&
        !lower.includes('last');
    };

    for (const e of currentEvents) {
      const isSemMatch = e.semesters && e.semesters.includes(semVal);
      const titleLower = e.title.toLowerCase();

      // Detect commencement of classes (earliest match)
      if (isSemMatch && !detectedStart && (
        titleLower.includes('commencement') ||
        titleLower.includes('classes begin') ||
        titleLower.includes('teaching starts') ||
        titleLower.includes('start of classes')
      ) && isNotEndEvent(e.title)) {
        detectedStart = e.date;
      }

      // Detect First Mid Term Exams (earliest match)
      if (isSemMatch && !detectedExam1 && (
        titleLower.includes('first mid') ||
        titleLower.includes('1st mid') ||
        titleLower.includes('mid term i') ||
        titleLower.includes('mid-term i') ||
        titleLower.includes('midterm i')
      ) && isNotEndEvent(e.title)) {
        detectedExam1 = e.date;
      }

      // Detect Last Teaching Day (earliest match)
      if (isSemMatch && !detectedLastTeaching && (
        titleLower.includes('concluding of classes') ||
        titleLower.includes('concluding of teaching') ||
        titleLower.includes('teaching concludes') ||
        titleLower.includes('last teaching day') ||
        titleLower.includes('teaching ends') ||
        titleLower.includes('classes end')
      )) {
        detectedLastTeaching = e.date;
      }
    }

    // Fallbacks if semester-specific not found: check general commencement if applicable to this semester
    if (!detectedStart) {
      const generalCommencement = currentEvents.find(e =>
        (e.title.toLowerCase().includes('commencement') ||
          e.title.toLowerCase().includes('classes begin')) &&
        isEventApplicableToSemester(e, semVal) &&
        isNotEndEvent(e.title)
      );
      if (generalCommencement) detectedStart = generalCommencement.date;
    }

    // Fallbacks for Exams
    if (!detectedExam1) {
      const firstExam = currentEvents.find(e =>
        (e.type === 'exam_1' || e.title.toLowerCase().includes('first mid') || e.title.toLowerCase().includes('1st mid')) &&
        isEventApplicableToSemester(e, semVal) &&
        isNotEndEvent(e.title)
      );
      if (firstExam) detectedExam1 = firstExam.date;
    }

    // Fallbacks for Last Teaching Day
    if (!detectedLastTeaching) {
      const generalLastTeaching = currentEvents.find(e =>
        (e.title.toLowerCase().includes('concluding of classes') ||
          e.title.toLowerCase().includes('concluding of teaching') ||
          e.title.toLowerCase().includes('teaching concludes') ||
          e.title.toLowerCase().includes('last teaching day') ||
          e.title.toLowerCase().includes('teaching ends') ||
          e.title.toLowerCase().includes('classes end')) &&
        isEventApplicableToSemester(e, semVal)
      );
      if (generalLastTeaching) detectedLastTeaching = generalLastTeaching.date;
    }

    // Apply auto-detected values & give user feedback
    if (detectedStart) {
      setSemesterStartDate(detectedStart);
      setCalendarMonth(new Date(detectedStart));
      setDetectedStartFeedback(`Auto-detected class start date: ${formatToDdMmYyyy(detectedStart)}`);
    } else {
      const todayStr = formatDate(new Date());
      setSemesterStartDate(todayStr);
      setCalendarMonth(new Date(todayStr));
      setDetectedStartFeedback(null);
    }

    if (detectedExam1) {
      setExam1StartDate(detectedExam1);
      setExam1EndDate(addDays(detectedExam1, exam1Duration - 1));
      setDetectedExam1Feedback(`Auto-detected 1st Mid Term start date: ${formatToDdMmYyyy(detectedExam1)}`);
    } else {
      setExam1StartDate('');
      setExam1EndDate('');
      setDetectedExam1Feedback(null);
    }

    if (detectedLastTeaching) {
      const nextDay = addDays(detectedLastTeaching, 1);
      setExam2StartDate(nextDay);
      setExam2EndDate(addDays(nextDay, exam2Duration - 1));
      setDetectedLastTeachingFeedback(`Auto-detected last teaching day: ${formatToDdMmYyyy(detectedLastTeaching)}`);
    } else {
      setExam2StartDate('');
      setExam2EndDate('');
      setDetectedLastTeachingFeedback(null);
    }
  };

  // Heuristics date auto-detector based on semester selection
  const handleSemesterSelect = (semVal) => {
    setSemester(semVal);
    detectTermDates(semVal, events);
  };

  // Heuristic Text Area Parsing
  const triggerTextImport = () => {
    if (!rawTextImport.trim()) return;
    const year = new Date(semesterStartDate).getFullYear() || new Date().getFullYear();
    const parsed = require('./utils/textHeuristics').parseAcademicText(rawTextImport, year);

    if (parsed.length === 0) {
      window.alert("Could not extract any events with date formats. Check if lines contain valid dates.");
      return;
    }

    const uniqueEvents = [];
    for (const p of parsed) {
      if (!uniqueEvents.some(x => x.date === p.date && x.title === p.title)) {
        // Add custom sub-categorization for midterms inside the events list
        const titleLower = p.title.toLowerCase();
        let type = p.type;
        if (titleLower.includes('first mid') || titleLower.includes('1st mid') || titleLower.includes('mid term i')) {
          type = 'exam_1';
        } else if (titleLower.includes('second mid') || titleLower.includes('2nd mid') || titleLower.includes('mid term ii') || titleLower.includes('theory exam')) {
          type = 'exam_2';
        }
        uniqueEvents.push({ ...p, type });
      }
    }
    const sorted = uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Determine the available semesters based on even/odd semester context of the new events list
    const availableSems = getAvailableSemestersForEvents(sorted);

    // Find the semesters explicitly detected in the calendar
    const detectedSemesters = [...new Set(sorted.flatMap(x => x.semesters || []))].filter(Boolean).sort((a, b) => a - b);
    const explicitDetected = detectedSemesters.filter(s => availableSems.includes(s));

    // Target semester is the first explicit one, or the first available one (e.g. 2 for even, 1 for odd)
    const targetSem = explicitDetected.length > 0 ? explicitDetected[0] : availableSems[0];

    setSemester(targetSem);
    setEvents(sorted);
    detectTermDates(targetSem, sorted);
    setUploadedFileName('Pasted Schedule Text');

    setRawTextImport('');
    window.alert(`Success: Parsed and imported ${parsed.length} calendar events!`);
  };

  // File Upload Logic (PDF, ICS, CSV, JSON)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const fileName = file.name.toLowerCase();
    const defaultYear = new Date(semesterStartDate).getFullYear();

    try {
      let parsedEvents = [];
      if (fileName.endsWith('.pdf')) {
        parsedEvents = await parsePdfCalendar(file, defaultYear);
      } else if (fileName.endsWith('.ics')) {
        parsedEvents = await parseIcsCalendar(file);
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        const rawJson = JSON.parse(text);
        parsedEvents = (Array.isArray(rawJson) ? rawJson : (rawJson.events || [])).map(ev => ({
          id: ev.id || Math.random().toString(36).substr(2, 9),
          title: ev.title || ev.summary || 'Imported Event',
          date: ev.date || ev.start_date || formatDate(new Date()),
          type: ev.type || 'event',
          semesters: ev.semesters || []
        }));
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (parts.length >= 2) {
            const dateVal = parts[0].replace(/"/g, '').trim();
            const titleVal = parts[1].replace(/"/g, '').trim();
            const typeVal = (parts[2] || 'event').replace(/"/g, '').trim();
            const semVal = (parts[3] || '').replace(/"/g, '').trim();
            const semestersArr = semVal ? semVal.split(';').map(Number).filter(n => !isNaN(n)) : [];

            if (dateVal && titleVal) {
              parsedEvents.push({
                id: Math.random().toString(36).substr(2, 9),
                date: dateVal,
                title: titleVal,
                type: typeVal,
                semesters: semestersArr
              });
            }
          }
        }
      } else {
        throw new Error("Unsupported file type. Please upload a PDF, ICS, CSV, or JSON file.");
      }

      if (parsedEvents.length === 0) {
        window.alert("No calendar events could be parsed from this file.");
      } else {
        const uniqueEvents = [];
        for (const p of parsedEvents) {
          if (!uniqueEvents.some(x => x.date === p.date && x.title === p.title)) {
            const titleLower = p.title.toLowerCase();
            let type = p.type;
            if (titleLower.includes('first mid') || titleLower.includes('1st mid') || titleLower.includes('mid term i')) {
              type = 'exam_1';
            } else if (titleLower.includes('second mid') || titleLower.includes('2nd mid') || titleLower.includes('mid term ii') || titleLower.includes('theory exam')) {
              type = 'exam_2';
            }
            uniqueEvents.push({ ...p, type });
          }
        }
        const sorted = uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Determine the available semesters based on even/odd semester context of the new events list
        const availableSems = getAvailableSemestersForEvents(sorted);

        // Find the semesters explicitly detected in the calendar
        const detectedSemesters = [...new Set(sorted.flatMap(x => x.semesters || []))].filter(Boolean).sort((a, b) => a - b);
        const explicitDetected = detectedSemesters.filter(s => availableSems.includes(s));

        // Target semester is the first explicit one, or the first available one (e.g. 2 for even, 1 for odd)
        const targetSem = explicitDetected.length > 0 ? explicitDetected[0] : availableSems[0];

        setSemester(targetSem);
        setEvents(sorted);
        detectTermDates(targetSem, sorted);
        setUploadedFileName(file.name);
        window.alert(`Success: Loaded ${parsedEvents.length} calendar events from ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      window.alert("Error loading calendar: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleToggleCourseDay = (dayIndex) => {
    const alreadyHas = classDays.includes(dayIndex);
    setClassDays(alreadyHas
      ? classDays.filter(d => d !== dayIndex)
      : [...classDays, dayIndex].sort()
    );
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const handleOpenDayDialog = (dateStr) => {
    const dayOfWeek = new Date(dateStr).getDay();
    const isNormalClassDay = classDays.includes(dayOfWeek);
    const isSemesterWorking = dayOfWeek >= 1 && dayOfWeek <= 6;

    const dayEvents = events.filter(e => e.date === dateStr);
    const cancelEv = dayEvents.find(e => e.type === 'cancel_class');
    const extraEv = dayEvents.find(e => e.type === 'extra_class');
    const holEv = dayEvents.find(e => e.type === 'holiday');

    let initialType = 'holiday';
    if (isNormalClassDay && isSemesterWorking && !holEv) {
      initialType = cancelEv ? 'regular_class' : 'cancel_class';
    } else {
      initialType = extraEv ? 'regular_off' : 'extra_class';
    }

    setCalendarPopupDate(dateStr);
    setCalendarPopupForm({
      title: holEv ? holEv.title : (cancelEv ? 'Lecture Cancelled' : 'Extra Session'),
      type: holEv ? 'holiday' : initialType,
      semesterSpec: 'all',
      customCourseId: ''
    });
  };

  const handleSaveDayDialog = () => {
    const dateStr = calendarPopupDate;
    const { type, title } = calendarPopupForm;

    setEvents(prev => {
      let filtered = prev.filter(e => {
        if (e.date === dateStr && e.type === 'holiday' && type !== 'holiday') return false;
        if (e.date === dateStr && (e.type === 'cancel_class' || e.type === 'extra_class')) return false;
        return true;
      });

      if (type === 'holiday') {
        filtered.push({
          id: 'ev-popup-' + Date.now(),
          title: title || 'College Holiday',
          date: dateStr,
          type: 'holiday',
          semesters: []
        });
      } else if (type === 'cancel_class') {
        filtered.push({
          id: 'ev-popup-' + Date.now(),
          title: title || 'Cancelled Lecture',
          date: dateStr,
          type: 'cancel_class',
          semesters: [semester]
        });
      } else if (type === 'extra_class') {
        filtered.push({
          id: 'ev-popup-' + Date.now(),
          title: title || 'Extra Lecture Session',
          date: dateStr,
          type: 'extra_class',
          semesters: [semester]
        });
      }
      return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    setCalendarPopupDate(null);
  };

  // Calculations: Calculate working dates (running up to exam2StartDate - 1, and deducting exam1 range)
  const calculatedClassDates = calculateWorkingDates({
    semester,
    semesterStartDate,
    exam1StartDate,
    exam1EndDate,
    exam2StartDate,
    exam2EndDate,
    events,
    courseClassDays: classDays
  });

  // Calculate detailed counts of all types during the teaching term range (from semesterStartDate up to exam2StartDate - 1)
  let lecturesCount = calculatedClassDates.length;
  let holidaysCount = 0;
  let examsCount = 0;
  let weekendsCount = 0;
  let cancelledCount = 0;

  const startRange = new Date(semesterStartDate);

  // Teaching stops one day before Second Mid Term starts
  const endRange = new Date(exam2StartDate);
  endRange.setDate(endRange.getDate() - 1);

  if (startRange <= endRange) {
    const tempDate = new Date(startRange);
    while (tempDate <= endRange) {
      const dateStr = formatDate(tempDate);
      const dayOfWeek = tempDate.getDay();

      const isExam1 = dateStr >= exam1StartDate && dateStr <= exam1EndDate;
      const dayEvents = events.filter(e => e.date === dateStr);

      const isHoliday = dayEvents.some(e =>
        e.type === 'holiday' && isEventApplicableToSemester(e, semester)
      );
      const isCancelled = dayEvents.some(e => e.type === 'cancel_class');
      const isExtra = dayEvents.some(e => e.type === 'extra_class');

      let isSemWorking = dayOfWeek >= 1 && dayOfWeek <= 6;

      const isCourseDay = classDays.includes(dayOfWeek);

      if (isExam1) {
        // counted in examsCount below, so we do not count it as weekend
      } else if (isHoliday) {
        holidaysCount++;
      } else if (isCancelled) {
        cancelledCount++;
      } else if (isExtra || (isSemWorking && isCourseDay)) {
        // Handled in lecturesCount
      } else {
        weekendsCount++;
      }

      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  // Set total exams count as the sum of both midterm durations
  const exam1Days = getDaysDifference(exam1StartDate, exam1EndDate);
  const exam2Days = getDaysDifference(exam2StartDate, exam2EndDate);
  examsCount = exam1Days + exam2Days;

  // Step Completeness Validation Rules
  const isStep1Valid = !!uploadedFileName && !!subjectName.trim();
  const isStep2Valid = !!(isStep1Valid && semester && semesterStartDate);
  const isStep3Valid = !!(isStep2Valid && classDays.length > 0);
  const isStep4Valid = !!(isStep3Valid && exam1StartDate && exam1EndDate);

  // Helper to retrieve A4-sized calendar month ranges
  const getMonthsInSemester = () => {
    if (!semesterStartDate || !exam2StartDate) return [];
    const start = new Date(semesterStartDate);
    const end = new Date(exam2StartDate);
    const list = [];
    let curr = new Date(start.getFullYear(), start.getMonth(), 1);
    const limit = new Date(end.getFullYear(), end.getMonth(), 1);
    let safety = 0;
    while (curr <= limit && safety < 12) {
      list.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
      safety++;
    }
    return list;
  };

  // Compact month rendering helper for printable area
  const renderPrintMonthGrid = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const mappedLecturesByDate = {};
    calculatedClassDates.forEach((wd, index) => {
      mappedLecturesByDate[wd.date] = { ...wd, lectureNumber: index + 1 };
    });

    const eventsByDate = {};
    for (const ev of events) {
      if (isEventApplicableToSemester(ev, semester)) {
        eventsByDate[ev.date] = ev;
      }
    }

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`pad-${i}`} className="print-day-cell other-month"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();

      const lec = mappedLecturesByDate[dateStr];
      const ev = eventsByDate[dateStr];

      const isExam1 = dateStr >= exam1StartDate && dateStr <= exam1EndDate;
      const isExam2 = dateStr >= exam2StartDate && dateStr <= exam2EndDate;
      const isPostSemester = dateStr > exam2EndDate;

      const isSemWorking = dayOfWeek >= 1 && dayOfWeek <= 6;

      const isCourseDay = classDays.includes(dayOfWeek);
      const isCancelled = events.some(e => e.date === dateStr && e.type === 'cancel_class');

      let cellClass = "print-day-cell";

      if (isExam1 || isExam2) {
        cellClass += " exam";
      } else if (isPostSemester) {
        cellClass += " other-month";
      } else if (ev && ev.type === 'holiday') {
        cellClass += " holiday";
      } else if (isCancelled) {
        cellClass += " cancelled";
      } else if (lec) {
        cellClass += " lecture";
      } else if (!isSemWorking || !isCourseDay) {
        // regular off day
      }

      cells.push(
        <div key={d} className={cellClass}>
          {d}
        </div>
      );
    }

    return (
      <div className="print-month-grid" key={monthDate.toString()}>
        <div className="print-month-title">
          {monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="print-days-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayHeader, idx) => (
            <div key={idx} className="print-day-header">{dayHeader}</div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  // Renders the clean printable A4 format
  const renderPrintReport = () => {
    const totalLectures = calculatedClassDates.length;
    const firstLec = totalLectures > 0 ? calculatedClassDates[0].date : semesterStartDate;
    const lastLec = totalLectures > 0 ? calculatedClassDates[totalLectures - 1].date : semesterStartDate;

    const stats = {
      firstTeachingStart: formatToDdMmYyyy(semesterStartDate),
      lastTeachingDate: formatToDdMmYyyy(lastLec),
      totalWeeksSemester: Math.ceil(getDaysDifference(semesterStartDate, exam2EndDate || exam2StartDate) / 7),
      subjectWeeks: totalLectures > 0
        ? Math.ceil(getDaysDifference(firstLec, lastLec) / 7)
        : 0,
      totalDaysSemester: getDaysDifference(semesterStartDate, exam2EndDate || exam2StartDate),
      subjectDays: totalLectures,
      lecturesBeforeMidterm1: calculatedClassDates.filter(wd => wd.date < exam1StartDate).length,
      lecturesAfterMidterm1: calculatedClassDates.filter(wd => wd.date > exam1EndDate).length
    };

    const months = getMonthsInSemester();


    const colsCount = 2;
    const itemsPerCol = Math.ceil(calculatedClassDates.length / colsCount);
    const chunkedDates = [];
    for (let i = 0; i < colsCount; i++) {
      chunkedDates.push(calculatedClassDates.slice(i * itemsPerCol, (i + 1) * itemsPerCol));
    }

    return (
      <div className="print-container">
        <div className="print-header">
          <img src="/poornima_logo.jpg" alt="Poornima College of Engineering Logo" className="print-logo" style={{ height: '55px', width: 'auto', marginBottom: '6px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          <h1 style={{ textAlign: 'center' }}>Poornima College of Engineering</h1>
          <h2 style={{ fontSize: '12px', fontWeight: '750', color: '#475569', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'center' }}>
            Subject Deployment Planning {subjectName ? `- ${subjectName}` : ''}
          </h2>
          <div className="print-header-details" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <span>Semester: <strong>Sem {semester}</strong></span>
            <span>|</span>
            <span>Plan Name: <strong>{sessionName}</strong></span>
            <span>|</span>
            <span>Classes: <strong>{classDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</strong></span>
          </div>
        </div>

        <div className="print-grid">
          {/* Left: Stack of compact month calendars */}
          <div className="print-left-calendar">
            {months.map(m => renderPrintMonthGrid(m))}
          </div>

          {/* Right: Dual-column list of dates */}
          <div className="print-right-dates">
            <h4>List of Scheduled Working Dates</h4>
            <div className="print-dates-columns">
              {chunkedDates.map((chunk, cIdx) => (
                <div key={cIdx} className="space-y-0.5">
                  {chunk.map((wd, idx) => {
                    const globalIdx = cIdx * itemsPerCol + idx + 1;
                    return (
                      <div key={wd.date} className={`print-date-item ${wd.isExtra ? 'extra' : ''}`}>
                        <span className="num">Lec #{globalIdx}</span>
                        <span className="val">{formatToDdMmYyyy(wd.date)} ({wd.dayName.substring(0, 3)})</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              {calculatedClassDates.length === 0 && (
                <div className="col-span-2 text-center text-slate-400 py-4 font-semibold">
                  No lectures calculated. Please configure your weekdays & start dates.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="print-stats-section">
          <h4 className="print-stats-title">Academic Metrics Summary</h4>
          <div className="print-stats-grid">
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.firstTeachingStart}</div>
              <div className="print-stat-label">1. First Class Start Date</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.lastTeachingDate}</div>
              <div className="print-stat-label">2. Last Teaching Date</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.totalWeeksSemester} Weeks</div>
              <div className="print-stat-label">3. Weeks (Semester)</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.subjectWeeks} Weeks</div>
              <div className="print-stat-label">4. Weeks (Subject)</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.totalDaysSemester} Days</div>
              <div className="print-stat-label">5. Days (Semester)</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.subjectDays} Days</div>
              <div className="print-stat-label">6. Days (Subject)</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.lecturesBeforeMidterm1} Lectures</div>
              <div className="print-stat-label">7. Lectures (Pre-Mid 1)</div>
            </div>
            <div className="print-stat-card">
              <div className="print-stat-val">{stats.lecturesAfterMidterm1} Lectures</div>
              <div className="print-stat-label">8. Lectures (Post-Mid 1)</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInteractiveCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const mappedLecturesByDate = {};
    calculatedClassDates.forEach((wd, index) => {
      mappedLecturesByDate[wd.date] = { ...wd, lectureNumber: index + 1 };
    });

    const eventsByDate = {};
    for (const ev of events) {
      if (isEventApplicableToSemester(ev, semester)) {
        eventsByDate[ev.date] = ev;
      }
    }

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`pad-${i}`} className="bg-slate-800/10 border border-slate-700/30 p-2 min-h-[90px] rounded-lg opacity-35"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();

      const lec = mappedLecturesByDate[dateStr];
      const ev = eventsByDate[dateStr];

      const isExam1 = dateStr >= exam1StartDate && dateStr <= exam1EndDate;
      const isExam2 = dateStr >= exam2StartDate && dateStr <= exam2EndDate;
      const isPostSemester = dateStr > exam2EndDate;

      const isSemWorking = dayOfWeek >= 1 && dayOfWeek <= 6;

      const isCourseDay = classDays.includes(dayOfWeek);

      let cellClass = "bg-slate-800/20 hover:bg-slate-700/30 transition-colors border-slate-700/60";
      let textClass = "text-slate-300 font-semibold";
      let indicator = null;

      if (isExam1) {
        cellClass = "bg-amber-500/10 border-amber-500/40";
        textClass = "text-amber-400 font-bold";
        indicator = <div className="text-[10px] text-amber-500/80 font-medium truncate mt-1">📝 1st Mid Term</div>;
      } else if (isExam2) {
        cellClass = "bg-amber-500/15 border-amber-500/50";
        textClass = "text-amber-400 font-bold";
        indicator = <div className="text-[10px] text-amber-500/80 font-medium truncate mt-1">📝 2nd Mid Term</div>;
      } else if (isPostSemester) {
        cellClass = "bg-slate-900 border-slate-850 opacity-40";
        textClass = "text-slate-500";
        indicator = <div className="text-[9px] text-slate-500 italic mt-1">Post-Term</div>;
      } else if (ev && ev.type === 'holiday') {
        cellClass = "bg-rose-500/10 border-rose-500/40";
        textClass = "text-rose-400 font-bold";
        indicator = <div className="text-[10px] text-rose-400/85 font-medium truncate mt-1">🏖️ {ev.title}</div>;
      } else if (lec) {
        cellClass = "bg-indigo-600/25 border-indigo-500 border-2 shadow-sm scale-102";
        textClass = "text-indigo-300 font-black";
        indicator = (
          <div className="mt-1">
            <div className="text-[10px] bg-indigo-600 text-white rounded px-1 py-0.5 truncate font-semibold">
              Lecture #{lec.lectureNumber}
            </div>
            {lec.isExtra && <span className="text-[8px] bg-emerald-950 text-emerald-400 rounded px-1 py-0.2 mt-0.5 inline-block font-semibold">Extra</span>}
          </div>
        );
      } else if (!isSemWorking) {
        cellClass = "bg-slate-900 border-slate-800 opacity-50";
        textClass = "text-slate-500";
        indicator = <div className="text-[9px] text-slate-500 italic mt-1">Weekend</div>;
      } else if (!isCourseDay) {
        cellClass = "bg-slate-800/10 border-slate-800/40";
        textClass = "text-slate-400";
        indicator = <div className="text-[9px] text-slate-500 mt-1">No Lecture</div>;
      }

      const isCancelled = events.some(e => e.date === dateStr && e.type === 'cancel_class');
      if (isCancelled) {
        cellClass = "bg-slate-855 border-slate-800 line-through opacity-50";
        textClass = "text-slate-500";
        indicator = <div className="text-[9px] text-red-500 font-bold mt-1">Cancelled</div>;
      }

      cells.push(
        <div
          key={d}
          onClick={() => handleOpenDayDialog(dateStr)}
          className={`border p-2 min-h-[90px] rounded-lg cursor-pointer flex flex-col justify-between relative select-none ${cellClass}`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs ${textClass}`}>{d}</span>
            {ev && ev.type === 'event' && (
              <span className="text-[8px] bg-blue-900/60 text-blue-300 px-1 py-0.2 rounded font-medium truncate max-w-[50px]">{ev.title}</span>
            )}
          </div>
          {indicator}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 tracking-wide uppercase">{d}</div>
        ))}
        {cells}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      <div className="no-print">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700/60 overflow-hidden flex items-center justify-center w-11 h-11">
                <img src="/poornima_logo.jpg" alt="Poornima College of Engineering Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Subject Deployment Planning</h1>
                <p className="text-xs text-slate-400">Poornima College of Engineering</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentSessionId}
                onChange={(e) => loadSession(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none font-semibold"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={createNewSession}
                title="Create New Term Plan"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg transition-colors"
              >
                <Icons.Plus />
              </button>
              <button
                onClick={(e) => deleteSession(currentSessionId, e)}
                title="Delete Current Term Plan"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-lg transition-colors"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        </header>

        {/* Progress wizard bar */}
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <div className="flex justify-between items-center bg-slate-800/30 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400">
            <button
              onClick={() => setCurrentStep(1)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer hover:bg-slate-800 hover:text-white ${currentStep === 1 ? 'bg-indigo-650 text-white font-bold' : ''}`}
            >
              1. Upload Calendar
            </button>
            <span className="text-slate-700">➔</span>

            <button
              onClick={() => isStep1Valid && setCurrentStep(2)}
              disabled={!isStep1Valid}
              className={`px-2.5 py-1 rounded-lg transition-colors ${!isStep1Valid ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800 hover:text-white'
                } ${currentStep === 2 ? 'bg-indigo-650 text-white font-bold' : ''}`}
            >
              2. Select Semester
            </button>
            <span className="text-slate-700">➔</span>

            <button
              onClick={() => isStep2Valid && setCurrentStep(3)}
              disabled={!isStep2Valid}
              className={`px-2.5 py-1 rounded-lg transition-colors ${!isStep2Valid ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800 hover:text-white'
                } ${currentStep === 3 ? 'bg-indigo-650 text-white font-bold' : ''}`}
            >
              3. Lecture Days
            </button>
            <span className="text-slate-700">➔</span>

            <button
              onClick={() => isStep3Valid && setCurrentStep(4)}
              disabled={!isStep3Valid}
              className={`px-2.5 py-1 rounded-lg transition-colors ${!isStep3Valid ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800 hover:text-white'
                } ${currentStep === 4 ? 'bg-indigo-650 text-white font-bold' : ''}`}
            >
              4. Midterm Exams
            </button>
            <span className="text-slate-700">➔</span>

            <button
              onClick={() => isStep4Valid && setCurrentStep(5)}
              disabled={!isStep4Valid}
              className={`px-2.5 py-1 rounded-lg transition-colors ${!isStep4Valid ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800 hover:text-white'
                } ${currentStep === 5 ? 'bg-indigo-650 text-white font-bold' : ''}`}
            >
              5. Schedule Results
            </button>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 mt-6">

          {/* STEP 1: Upload / Paste Calendar */}
          {currentStep === 1 && (
            <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-white">Step 1: Setup Planning Details</h2>
                <p className="text-xs text-slate-400">Enter the subject name and choose/paste your college calendar schedule.</p>
              </div>

              {/* Subject Name Input */}
              <div className="space-y-1.5 bg-slate-900/40 p-4 border border-slate-750 rounded-xl">
                <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Subject Name / Course Title:</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Digital Logic Design, Data Structures"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadedFileName ? 'border-emerald-500 bg-emerald-950/10 hover:border-emerald-400' : 'border-slate-700 bg-slate-900/30 hover:border-indigo-500'}`}>
                <input
                  type="file"
                  accept=".pdf,.ics,.csv,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="mb-2 flex justify-center">
                  {uploadedFileName ? (
                    <svg className="w-8 h-8 text-emerald-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <div className="text-indigo-400"><Icons.Upload /></div>
                  )}
                </div>
                <span className="text-sm font-bold block text-slate-200">
                  {loading ? 'Reading File Content...' : (uploadedFileName ? `📄 ${uploadedFileName}` : 'Choose PDF, ICS, CSV, or JSON')}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  {uploadedFileName ? 'Click or drag here to choose a different file' : 'Supported standard formats parsed client-side'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Or Paste Schedule Text:</label>
                <textarea
                  rows={4}
                  value={rawTextImport}
                  onChange={(e) => setRawTextImport(e.target.value)}
                  placeholder="e.g. 15 August 2026 - Independence Day&#10;28 April 2026 - VI Semester Exams Start"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-350 rounded-lg p-3 text-xs outline-none focus:border-indigo-500 font-mono"
                ></textarea>
                <button
                  onClick={triggerTextImport}
                  disabled={!rawTextImport.trim()}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  Extract Dates
                </button>
              </div>

              <div className="border-t border-slate-750 pt-4 flex justify-between items-center text-xs">
                <span className="text-slate-400">Currently parsed events: <span className="font-bold text-slate-200">{events.length}</span></span>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!isStep1Valid}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <Icons.ChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Semester (runs auto-detection) */}
          {currentStep === 2 && (
            <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-white">Step 2: Which semester are you teaching?</h2>
                <p className="text-xs text-slate-400">Selecting a semester determines the weekly college working days and auto-fills term dates from the parsed calendar.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {getAvailableSemesters().map(num => (
                  <button
                    key={num}
                    onClick={() => handleSemesterSelect(num)}
                    className={`py-3.5 px-4 rounded-xl border font-bold text-sm transition-all ${semester === num
                        ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-900 border-slate-750 text-slate-400 hover:bg-slate-800'
                      }`}
                  >
                    Sem {num}
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-xs space-y-4 text-slate-350">
                <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Auto-Detection Summary</span>

                {/* Commencement Date */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-350">Semester Start Date:</span>
                    {detectedStartFeedback ? (
                      <span className="text-[10px] text-emerald-400 font-medium">✨ Auto-detected</span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-medium">⚠️ Manual Select</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2.5 rounded-xl">
                    <input
                      ref={startDateInputRef}
                      type="date"
                      value={semesterStartDate}
                      onChange={(e) => {
                        setSemesterStartDate(e.target.value);
                        if (e.target.value) {
                          setCalendarMonth(new Date(e.target.value));
                        }
                      }}
                      className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer flex-1 w-full border-none no-native-datepicker"
                    />
                    <button
                      type="button"
                      onClick={() => startDateInputRef.current?.showPicker()}
                      className="text-slate-400 hover:text-white text-sm select-none bg-transparent border-none cursor-pointer p-0"
                      title="Edit commencement date"
                    >
                      ✏️
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    You can change the starting date by selecting a new date using the picker or clicking the pen mark beside it.
                  </p>
                </div>

                {/* Last Teaching Date */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-350">Last Teaching Day:</span>
                    {detectedLastTeachingFeedback ? (
                      <span className="text-[10px] text-emerald-400 font-medium">✨ Auto-detected</span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-medium">⚠️ Defaulted (90 Days)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2.5 rounded-xl">
                    <input
                      ref={lastTeachingInputRef}
                      type="date"
                      value={lastTeachingDate}
                      onChange={(e) => handleLastTeachingDateChange(e.target.value)}
                      className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer flex-1 w-full border-none no-native-datepicker"
                    />
                    <button
                      type="button"
                      onClick={() => lastTeachingInputRef.current?.showPicker()}
                      className="text-slate-400 hover:text-white text-sm select-none bg-transparent border-none cursor-pointer p-0"
                      title="Edit last teaching date"
                    >
                      ✏️
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    You can change the last teaching day by selecting a new date using the picker or clicking the pen mark beside it.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div>
                    <span className="font-semibold block mb-0.5 text-slate-400">First Mid Term (Exam 1) Detection:</span>
                    {detectedExam1Feedback ? (
                      <span className="text-emerald-400 font-bold">✨ {detectedExam1Feedback}</span>
                    ) : (
                      <span className="text-slate-500 font-medium">Not detected in calendar (configure in Step 4)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-300 font-bold flex items-center gap-1"
                >
                  <Icons.ChevronLeft /> Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!isStep2Valid}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <Icons.ChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Configure Class Days */}
          {currentStep === 3 && (
            <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-white">Step 3: Select weekly teaching days</h2>
                <p className="text-xs text-slate-400">Select which weekdays you are scheduled to take lectures. Choose the actual days from Monday to Saturday.</p>
              </div>

              <div className="bg-slate-900/50 p-5 border border-slate-750 rounded-xl space-y-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Weekly Class Days:</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                      const idx = index + 1; // Mon = 1, Tue = 2, ..., Sat = 6
                      const isSelected = classDays.includes(idx);

                      return (
                        <button
                          key={day}
                          onClick={() => handleToggleCourseDay(idx)}
                          className={`py-2.5 px-4 rounded-lg border text-xs font-bold transition-all ${isSelected
                              ? 'bg-indigo-650 border-indigo-500 text-white shadow shadow-indigo-600/10'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-slate-400 hover:text-slate-300 font-bold flex items-center gap-1"
                >
                  <Icons.ChevronLeft /> Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!isStep3Valid}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <Icons.ChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Midterm Exam Configuration */}
          {currentStep === 4 && (
            <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-white">Step 4: First Mid Term Exam Configuration</h2>
                <p className="text-xs text-slate-400">Specify the starting and ending dates for the first mid term exam. The exam period will be excluded from the semester's working days.</p>
              </div>

              {/* Exam 1 settings */}
              <div className="bg-slate-900/30 p-4 border border-slate-750 rounded-xl space-y-4">
                <span className="block font-bold text-xs text-indigo-400 uppercase tracking-wide">First Mid Term Examination Details</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Starting Date</label>
                    <input
                      type="date"
                      value={exam1StartDate}
                      onChange={(e) => handleExam1StartChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ending Date</label>
                    <input
                      type="date"
                      value={exam1EndDate}
                      onChange={(e) => handleExam1EndDateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Duration: <strong className="text-slate-350">{exam1Duration} {exam1Duration === 1 ? 'day' : 'days'}</strong>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-slate-400 hover:text-slate-300 font-bold flex items-center gap-1"
                >
                  <Icons.ChevronLeft /> Back
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  disabled={!isStep4Valid}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Calculate Schedule <Icons.ChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Final Working Dates Dashboard */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

              {/* Left Hand: Calculated working dates list */}
              <div className="lg:col-span-1 space-y-6">

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Summary</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Calculated schedule parameters</p>
                  </div>

                  <div className="bg-slate-900/50 p-4 border border-slate-750 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Semester:</span>
                      <span className="font-semibold text-slate-200">Sem {semester}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Class Weekdays:</span>
                      <span className="font-semibold text-slate-200">
                        {classDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teaching Dates:</span>
                      <span className="font-bold text-indigo-400">{calculatedClassDates.length} Classes</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-500">
                      <span>Last Teaching Day:</span>
                      <span className="font-semibold text-slate-400">{lastTeachingDate ? formatToDdMmYyyy(lastTeachingDate) : 'TBA'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => exportWorkingDatesToCsv(semester, calculatedClassDates, exam1StartDate, exam1EndDate)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow shadow-emerald-600/10"
                    >
                      <Icons.Download /> Export Dates (CSV)
                    </button>

                    <button
                      onClick={() => setShowPrintPreview(true)}
                      className="w-full bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow shadow-indigo-600/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print / Save PDF (A4)
                    </button>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-750">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-xs text-indigo-400 hover:underline font-bold"
                    >
                      ⏪ Change Parameters
                    </button>
                  </div>
                </div>

                {/* Working Dates Table List */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Working Dates</h4>

                  <div className="overflow-x-auto max-h-[400px] border border-slate-750 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-750 text-slate-400 uppercase font-bold tracking-wider">
                          <th className="p-3 w-16 text-center">Lec #</th>
                          <th className="p-3">Date (DD-MM-YYYY)</th>
                          <th className="p-3 w-28">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {calculatedClassDates.map((wd, index) => (
                          <tr key={index} className={`hover:bg-slate-800/30 transition-colors ${wd.isExtra ? 'bg-emerald-950/20' : ''}`}>
                            <td className="p-3 font-bold text-center text-slate-500">{index + 1}</td>
                            <td className="p-3 font-semibold text-slate-200 whitespace-nowrap font-mono">
                              {formatToDdMmYyyy(wd.date)}
                              <span className="text-[9px] text-slate-500 font-sans block">{wd.dayName}</span>
                            </td>
                            <td className="p-3">
                              {wd.eventName ? (
                                <span className="text-[10px] text-indigo-400 font-semibold">{wd.eventName}</span>
                              ) : (
                                <span className="text-slate-400">{wd.isExtra ? 'Extra Override' : 'Scheduled Class'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Hand: Visual calendar with legend checkboxes */}
              <div className="lg:col-span-2 space-y-6">

                {/* Visual Calendar */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-md font-bold text-white">Visual Working Calendar</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Circles indicate teaching class dates. Click any day to toggle overrides.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handlePrevMonth} className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-350 rounded-lg">
                        <Icons.ChevronLeft />
                      </button>
                      <span className="text-sm font-bold text-slate-100 min-w-[120px] text-center font-mono">
                        {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={handleNextMonth} className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-350 rounded-lg">
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  </div>

                  {renderInteractiveCalendar()}

                  {/* Legend Checkboxes (If selected, shows count) */}
                  <div className="flex flex-wrap gap-4 mt-6 text-xs border-t border-slate-700/60 pt-4 text-slate-400 select-none">

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showCounts.lectures}
                        onChange={(e) => setShowCounts({ ...showCounts, lectures: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="w-3.5 h-3.5 bg-indigo-650 border-indigo-500 border-2 rounded"></span>
                      <span>Circled Lecture {showCounts.lectures && <strong className="text-indigo-400">({lecturesCount})</strong>}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showCounts.holidays}
                        onChange={(e) => setShowCounts({ ...showCounts, holidays: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="w-3.5 h-3.5 bg-rose-500/10 border-rose-500/40 border rounded"></span>
                      <span>Holiday {showCounts.holidays && <strong className="text-rose-400">({holidaysCount})</strong>}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showCounts.exams}
                        onChange={(e) => setShowCounts({ ...showCounts, exams: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="w-3.5 h-3.5 bg-amber-500/10 border-amber-500/40 border rounded"></span>
                      <span>Exams {showCounts.exams && <strong className="text-amber-400">({examsCount})</strong>}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showCounts.weekends}
                        onChange={(e) => setShowCounts({ ...showCounts, weekends: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-slate-500 focus:ring-slate-500"
                      />
                      <span className="w-3.5 h-3.5 bg-slate-900 border border-slate-800 rounded"></span>
                      <span>Weekend Off {showCounts.weekends && <strong className="text-slate-400">({weekendsCount})</strong>}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={showCounts.cancelled}
                        onChange={(e) => setShowCounts({ ...showCounts, cancelled: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-red-500"
                      />
                      <span className="w-3.5 h-3.5 bg-slate-855 line-through border border-slate-800 rounded"></span>
                      <span>Cancelled Class {showCounts.cancelled && <strong className="text-red-400">({cancelledCount})</strong>}</span>
                    </label>

                  </div>
                </div>

              </div>

            </div>
          )}

        </main>

        {/* Override dialog modal */}
        {calendarPopupDate && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
              <h4 className="text-sm font-bold text-white mb-2">Schedule Override</h4>
              <p className="text-[11px] text-slate-400 mb-4">Set manual override for date <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-indigo-400">{calendarPopupDate}</span></p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Action Override</label>
                  <select
                    value={calendarPopupForm.type}
                    onChange={(e) => setCalendarPopupForm({ ...calendarPopupForm, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none"
                  >
                    <option value="holiday">Declare College Holiday</option>
                    <option value="cancel_class">Cancel lecture for this day</option>
                    <option value="extra_class">Schedule extra lecture session on this day</option>
                    <option value="regular_class">Revert to standard teaching day</option>
                    <option value="regular_off">Revert to standard off day</option>
                  </select>
                </div>

                {['holiday', 'cancel_class', 'extra_class'].includes(calendarPopupForm.type) && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Label / Reason</label>
                    <input
                      type="text"
                      value={calendarPopupForm.title}
                      onChange={(e) => setCalendarPopupForm({ ...calendarPopupForm, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg px-3 py-2 text-xs outline-none"
                      placeholder="e.g. Festival, Make-up session, etc."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSaveDayDialog} className="flex-1 bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-xs">Apply</button>
                  <button onClick={() => setCalendarPopupDate(null)} className="flex-1 bg-slate-700 hover:bg-slate-650 text-slate-200 font-bold py-2 rounded-lg text-xs">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> {/* Closing .no-print wrapper */}

      {/* Printable PDF Report */}
      <div id="printable-academic-report" className="print-only">
        {renderPrintReport()}
      </div>

      {/* Screen Print Preview Modal */}
      {showPrintPreview && (
        <div className="preview-modal-overlay no-print" onClick={() => setShowPrintPreview(false)}>
          <div className="preview-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>Academic Plan Report - Print Preview (A4)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow shadow-emerald-600/10"
                >
                  <Icons.Download /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="bg-slate-700 hover:bg-slate-650 text-slate-200 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
            <div className="preview-modal-body">
              <div className="preview-a4-sheet">
                {renderPrintReport()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}