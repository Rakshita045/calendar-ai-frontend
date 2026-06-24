import React, { useState, useEffect } from 'react';
import { parsePdfCalendar } from './utils/pdfParser';
import { parseIcsCalendar } from './utils/icsParser';
import {
  addDays,
  getDaysDifference,
  formatDate,
  calculateWorkingDates,
  mapSyllabusToDates,
  exportLecturePlanToCsv
} from './utils/calendarUtils';

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
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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

const DEFAULT_SESSION_NAME = "Term Schedule Planner";
const DEFAULT_EVENTS = [
  { id: 'ev-1', title: 'Independence Day Holiday', date: '2026-08-15', type: 'holiday', semesters: [] },
  { id: 'ev-2', title: 'Raksha Bandhan', date: '2026-08-28', type: 'holiday', semesters: [] },
  { id: 'ev-3', title: 'Teachers Day Celebration', date: '2026-09-05', type: 'event', semesters: [] },
  { id: 'ev-4', title: 'Gandhi Jayanti Holiday', date: '2026-10-02', type: 'holiday', semesters: [] },
  { id: 'ev-7', title: 'End Semester Exams Begin', date: '2026-11-23', type: 'exam', semesters: [] }
];
const DEFAULT_COURSES = [
  {
    id: 'c-1',
    name: 'CS-401: Distributed Systems',
    classDays: [1, 3, 5],
    topics: [
      { id: 't-1', name: 'Introduction to Distributed Systems: Definitions & Goals', notes: 'Prepare slides' },
      { id: 't-2', name: 'Hardware & Software Architectural Models', notes: '' },
      { id: 't-3', name: 'Networking Principles and Transport Protocols', notes: '' },
      { id: 't-4', name: 'Interprocess Communication: Sockets & Datagrams', notes: 'Lab activity 1 setup' },
      { id: 't-5', name: 'Remote Invocation: RPC & RMI paradigms', notes: '' },
      { id: 't-6', name: 'Distributed File Systems: NFS and HDFS', notes: '' },
      { id: 't-7', name: 'Time Synchronization: Logical Clocks & Vector Clocks', notes: '' }
    ]
  }
];

export default function App() {
  // Wizard Steps:
  // 1: Upload / Paste Calendar
  // 2: Choose Semester (runs auto-detection)
  // 3: Exam End Date Parameters
  // 4: Configure Course Details
  // 5: Lecture Planning Dashboard (Calendar, Syllabus, Export)
  const [currentStep, setCurrentStep] = useState(1);

  // Session State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [sessionName, setSessionName] = useState(DEFAULT_SESSION_NAME);

  // Term Parameters
  const [semester, setSemester] = useState(5);
  const [semesterStartDate, setSemesterStartDate] = useState('2026-08-03');
  const [examStartDate, setExamStartDate] = useState('2026-11-23');
  const [examDuration, setExamDuration] = useState(10);
  const [examEndDate, setExamEndDate] = useState('2026-12-02');
  const [examInputMode, setExamInputMode] = useState('duration');

  // Events & Courses Lists
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [activeCourseId, setActiveCourseId] = useState('c-1');

  // Auto-detection results feedback state
  const [detectedStartFeedback, setDetectedStartFeedback] = useState(null);
  const [detectedExamFeedback, setDetectedExamFeedback] = useState(null);

  // Interactive Calendar month view navigation
  const [calendarMonth, setCalendarMonth] = useState(new Date('2026-08-01'));
  
  const [loading, setLoading] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [calendarPopupDate, setCalendarPopupDate] = useState(null);
  const [calendarPopupForm, setCalendarPopupForm] = useState({ title: '', type: 'holiday', semesterSpec: 'all', customCourseId: '' });

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
        examStartDate: '2026-11-23',
        examDuration: 10,
        examEndDate: '2026-12-02',
        examInputMode: 'duration',
        events: DEFAULT_EVENTS,
        courses: DEFAULT_COURSES,
        activeCourseId: 'c-1',
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
      semester,
      semesterStartDate,
      examStartDate,
      examDuration,
      examEndDate,
      examInputMode,
      events,
      courses,
      activeCourseId,
      currentStep
    });
  }, [
    currentSessionId, sessionName, semester, semesterStartDate,
    examStartDate, examDuration, examEndDate, examInputMode,
    events, courses, activeCourseId, currentStep
  ]);

  // Sync Exam Dates double-binding
  const handleExamStartChange = (val) => {
    setExamStartDate(val);
    if (examInputMode === 'duration') {
      const calculatedEnd = addDays(val, examDuration - 1);
      setExamEndDate(calculatedEnd);
    } else {
      const diff = getDaysDifference(val, examEndDate);
      setExamDuration(diff > 0 ? diff : 1);
    }
  };

  const handleExamDurationChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setExamDuration(num);
    const calculatedEnd = addDays(examStartDate, num - 1);
    setExamEndDate(calculatedEnd);
  };

  const handleExamEndDateChange = (val) => {
    setExamEndDate(val);
    const diff = getDaysDifference(examStartDate, val);
    setExamDuration(diff > 0 ? diff : 1);
  };

  const handleExamInputModeChange = (mode) => {
    setExamInputMode(mode);
    if (mode === 'duration') {
      const calculatedEnd = addDays(examStartDate, examDuration - 1);
      setExamEndDate(calculatedEnd);
    } else {
      const diff = getDaysDifference(examStartDate, examEndDate);
      setExamDuration(diff > 0 ? diff : 1);
    }
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
      setSemester(data.semester || 5);
      setSemesterStartDate(data.semesterStartDate || '2026-08-03');
      setExamStartDate(data.examStartDate || '2026-11-23');
      setExamDuration(data.examDuration || 10);
      setExamEndDate(data.examEndDate || '2026-12-02');
      setExamInputMode(data.examInputMode || 'duration');
      setEvents(data.events || []);
      setCourses(data.courses || []);
      setActiveCourseId(data.activeCourseId || (data.courses[0] && data.courses[0].id) || '');
      setCurrentStep(data.currentStep || 1);
      localStorage.setItem('academic_active_session_id', id);

      if (data.semesterStartDate) {
        setCalendarMonth(new Date(data.semesterStartDate));
      }
    }
  };

  const createNewSession = () => {
    const newId = 'session-' + Date.now();
    const newName = `Academic Plan - Sem ${semester}`;
    const newSession = { id: newId, name: newName };
    const updatedIndex = [...sessions, newSession];
    
    setSessions(updatedIndex);
    setSessionName(newName);
    setCurrentSessionId(newId);
    setCurrentStep(1);
    
    localStorage.setItem('academic_sessions_index', JSON.stringify(updatedIndex));
    localStorage.setItem('academic_active_session_id', newId);

    const freshState = {
      sessionName: newName,
      semester: 5,
      semesterStartDate: formatDate(new Date()),
      examStartDate: addDays(formatDate(new Date()), 90),
      examDuration: 10,
      examEndDate: addDays(formatDate(new Date()), 99),
      examInputMode: 'duration',
      events: [],
      courses: [],
      activeCourseId: '',
      currentStep: 1
    };
    
    setSemester(freshState.semester);
    setSemesterStartDate(freshState.semesterStartDate);
    setExamStartDate(freshState.examStartDate);
    setExamDuration(freshState.examDuration);
    setExamEndDate(freshState.examEndDate);
    setExamInputMode(freshState.examInputMode);
    setEvents([]);
    setCourses([]);
    setActiveCourseId('');
    
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



  // Heuristics date auto-detector based on semester selection
  const handleSemesterSelect = (semVal) => {
    setSemester(semVal);
    
    let detectedStart = '';
    let detectedExam = '';

    // Search events list for commencement of classes or exam starts for this semester
    for (const e of events) {
      const isSemMatch = e.semesters && e.semesters.includes(semVal);
      const titleLower = e.title.toLowerCase();

      // Detect commencement of classes for the specific semester
      if (isSemMatch && (
        titleLower.includes('commencement') ||
        titleLower.includes('classes begin') ||
        titleLower.includes('teaching starts') ||
        titleLower.includes('start of classes')
      )) {
        detectedStart = e.date;
      }

      // Detect theory exam start for the specific semester
      if (isSemMatch && (
        e.type === 'exam' || 
        titleLower.includes('exam start') || 
        titleLower.includes('exams begin') || 
        titleLower.includes('theory exams')
      )) {
        detectedExam = e.date;
      }
    }

    // Heuristics fallback: check for any general matching titles if specific sem fails
    if (!detectedStart) {
      const generalCommencement = events.find(e => 
        e.title.toLowerCase().includes('commencement') || 
        e.title.toLowerCase().includes('classes begin')
      );
      if (generalCommencement) detectedStart = generalCommencement.date;
    }

    if (!detectedExam) {
      const generalExam = events.find(e => e.type === 'exam');
      if (generalExam) detectedExam = generalExam.date;
    }

    // Apply auto-detected values & give user feedback
    if (detectedStart) {
      setSemesterStartDate(detectedStart);
      setCalendarMonth(new Date(detectedStart));
      setDetectedStartFeedback(`Auto-detected class start date: ${detectedStart}`);
    } else {
      setDetectedStartFeedback(null);
    }

    if (detectedExam) {
      setExamStartDate(detectedExam);
      const calculatedEnd = addDays(detectedExam, examDuration - 1);
      setExamEndDate(calculatedEnd);
      setDetectedExamFeedback(`Auto-detected exam start date: ${detectedExam}`);
    } else {
      setDetectedExamFeedback(null);
    }
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

    setEvents(prev => {
      const uniqueEvents = [...prev];
      for (const p of parsed) {
        if (!uniqueEvents.some(x => x.date === p.date && x.title === p.title)) {
          uniqueEvents.push(p);
        }
      }
      return uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

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
        setEvents(prev => {
          const uniqueEvents = [...prev];
          for (const p of parsedEvents) {
            if (!uniqueEvents.some(x => x.date === p.date && x.title === p.title)) {
              uniqueEvents.push(p);
            }
          }
          return uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        });
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



  // Course configuration handlers
  const handleAddCourse = (name) => {
    if (!name || !name.trim()) return;
    const newCourse = {
      id: 'c-' + Date.now(),
      name: name.trim(),
      classDays: [1, 3, 5], // default Mon, Wed, Fri
      topics: []
    };
    setCourses(prev => [...prev, newCourse]);
    setActiveCourseId(newCourse.id);
  };

  const handleDeleteCourse = (id) => {
    if (!window.confirm("Are you sure you want to delete this course and all its syllabus topics?")) {
      return;
    }
    const updatedCourses = courses.filter(c => c.id !== id);
    setCourses(updatedCourses);
    if (activeCourseId === id) {
      setActiveCourseId(updatedCourses[0]?.id || '');
    }
  };

  const handleToggleCourseDay = (courseId, dayIndex) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const alreadyHas = c.classDays.includes(dayIndex);
      return {
        ...c,
        classDays: alreadyHas 
          ? c.classDays.filter(d => d !== dayIndex) 
          : [...c.classDays, dayIndex].sort()
      };
    }));
  };

  // Syllabus topics
  const handleBulkTopicsImport = (courseId, text) => {
    if (!text.trim()) return;
    const newTopics = text.split(/\n/).map(line => line.trim()).filter(Boolean).map(name => ({
      id: 'topic-' + Math.random().toString(36).substr(2, 9),
      name: name,
      notes: ''
    }));

    setCourses(prev => prev.map(c => 
      c.id === courseId 
        ? { ...c, topics: [...c.topics, ...newTopics] }
        : c
    ));
  };

  const handleClearTopics = (courseId) => {
    if (window.confirm("Clear all syllabus topics for this course?")) {
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, topics: [] } : c
      ));
    }
  };

  const handleUpdateTopicField = (courseId, topicId, field, value) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        topics: c.topics.map(t => t.id === topicId ? { ...t, [field]: value } : t)
      };
    }));
  };

  const handleRemoveTopic = (courseId, topicId) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        topics: c.topics.filter(t => t.id !== topicId)
      };
    }));
  };

  const handleAddSingleTopic = (courseId) => {
    const name = window.prompt("Enter Topic name:");
    if (!name || !name.trim()) return;

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        topics: [...c.topics, {
          id: 'topic-' + Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          notes: ''
        }]
      };
    }));
  };

  // Overrides modal action
  const handleOpenDayDialog = (dateStr) => {
    const dayOfWeek = new Date(dateStr).getDay();
    const activeCourse = courses.find(c => c.id === activeCourseId);
    const isNormalClassDay = activeCourse ? activeCourse.classDays.includes(dayOfWeek) : false;
    const isSemesterWorking = (semester >= 1 && semester <= 6) 
      ? (dayOfWeek >= 1 && dayOfWeek <= 5)
      : (dayOfWeek >= 1 && dayOfWeek <= 3);

    const dayEvents = events.filter(e => e.date === dateStr);
    const cancelEv = dayEvents.find(e => e.type === 'cancel_class' && e.courseId === activeCourseId);
    const extraEv = dayEvents.find(e => e.type === 'extra_class' && e.courseId === activeCourseId);
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
      customCourseId: activeCourseId
    });
  };

  const handleSaveDayDialog = () => {
    const dateStr = calendarPopupDate;
    const { type, title } = calendarPopupForm;

    setEvents(prev => {
      let filtered = prev.filter(e => {
        if (e.date === dateStr && e.type === 'holiday' && type !== 'holiday') return false;
        if (e.date === dateStr && (e.type === 'cancel_class' || e.type === 'extra_class') && e.courseId === activeCourseId) return false;
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
          courseId: activeCourseId,
          semesters: [semester]
        });
      } else if (type === 'extra_class') {
        filtered.push({
          id: 'ev-popup-' + Date.now(),
          title: title || 'Extra Lecture Session',
          date: dateStr,
          type: 'extra_class',
          courseId: activeCourseId,
          semesters: [semester]
        });
      }
      return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    setCalendarPopupDate(null);
  };

  // Calculations
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const classDays = activeCourse ? activeCourse.classDays : [];
  
  const calculatedClassDates = calculateWorkingDates({
    semester,
    semesterStartDate,
    examStartDate,
    examEndDate,
    events,
    courseClassDays: classDays,
    courseId: activeCourseId
  });

  const syllabusTopics = activeCourse ? activeCourse.topics : [];
  const mappedLectures = mapSyllabusToDates(calculatedClassDates, syllabusTopics);
  const unmappedTopics = syllabusTopics.slice(calculatedClassDates.length);



  // Calendar renderers
  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const renderInteractiveCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const mappedLecturesByDate = {};
    for (const lec of mappedLectures) {
      mappedLecturesByDate[lec.date] = lec;
    }

    const eventsByDate = {};
    for (const ev of events) {
      if (ev.semesters.length === 0 || ev.semesters.includes(semester)) {
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
      const isExam = dateStr >= examStartDate && dateStr <= examEndDate;

      const isSemWorking = (semester >= 1 && semester <= 6)
        ? (dayOfWeek >= 1 && dayOfWeek <= 5)
        : (dayOfWeek >= 1 && dayOfWeek <= 3);

      const isCourseDay = classDays.includes(dayOfWeek);

      let cellClass = "bg-slate-800/20 hover:bg-slate-700/30 transition-colors border-slate-700/60";
      let textClass = "text-slate-300 font-semibold";
      let indicator = null;

      if (isExam) {
        cellClass = "bg-amber-500/10 border-amber-500/40";
        textClass = "text-amber-400 font-bold";
        indicator = <div className="text-[10px] text-amber-500/80 font-medium truncate mt-1">📝 Exams</div>;
      } else if (ev && ev.type === 'holiday') {
        cellClass = "bg-rose-500/10 border-rose-500/40";
        textClass = "text-rose-400 font-bold";
        indicator = <div className="text-[10px] text-rose-400/85 font-medium truncate mt-1">🏖️ {ev.title}</div>;
      } else if (lec) {
        cellClass = "bg-indigo-600/25 border-indigo-500 border-2 shadow-sm scale-102";
        textClass = "text-indigo-300 font-black";
        indicator = (
          <div className="mt-1">
            <div className="text-[10px] bg-indigo-600 text-white rounded px-1 py-0.5 truncate font-semibold" title={lec.topicName}>
              #{lec.lectureNumber} {lec.topicName}
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

      const isCancelled = events.some(e => e.date === dateStr && e.type === 'cancel_class' && e.courseId === activeCourseId);
      if (isCancelled) {
        cellClass = "bg-slate-850 border-slate-800 line-through opacity-50";
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
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Icons.Calendar />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Academic Lecture Planner</h1>
              <p className="text-xs text-slate-400">Step-by-Step Scheduling and Syllabus Auto-Mapping</p>
            </div>
          </div>

          {/* Session settings controls */}
          <div className="flex items-center gap-2">
            <select
              value={currentSessionId}
              onChange={(e) => loadSession(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none"
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
          <span className={`px-2.5 py-1 rounded-lg ${currentStep === 1 ? 'bg-indigo-650 text-white font-bold' : ''}`}>1. Upload Calendar</span>
          <span className="text-slate-700">➔</span>
          <span className={`px-2.5 py-1 rounded-lg ${currentStep === 2 ? 'bg-indigo-650 text-white font-bold' : ''}`}>2. Select Semester</span>
          <span className="text-slate-700">➔</span>
          <span className={`px-2.5 py-1 rounded-lg ${currentStep === 3 ? 'bg-indigo-650 text-white font-bold' : ''}`}>3. Exams End Date</span>
          <span className="text-slate-700">➔</span>
          <span className={`px-2.5 py-1 rounded-lg ${currentStep === 4 ? 'bg-indigo-650 text-white font-bold' : ''}`}>4. Course Setup</span>
          <span className="text-slate-700">➔</span>
          <span className={`px-2.5 py-1 rounded-lg ${currentStep === 5 ? 'bg-indigo-650 text-white font-bold' : ''}`}>5. Schedule Results</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-6">

        {/* STEP 1: Upload / Paste Calendar */}
        {currentStep === 1 && (
          <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-white">Step 1: Upload College Academic Calendar</h2>
              <p className="text-xs text-slate-400">Upload your PDF schedule or copy-paste text so we can read holidays & exam dates.</p>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-900/30">
              <input
                type="file"
                accept=".pdf,.ics,.csv,.json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-indigo-400 mb-2 flex justify-center"><Icons.Upload /></div>
              <span className="text-sm text-slate-200 font-bold block">
                {loading ? 'Reading File Content...' : 'Choose PDF, ICS, CSV, or JSON'}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">Supported standard formats parsed client-side</span>
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
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1"
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <button
                  key={num}
                  onClick={() => handleSemesterSelect(num)}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-sm transition-all ${
                    semester === num
                      ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900 border-slate-750 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Sem {num}
                </button>
              ))}
            </div>

            {/* Display Feedback messages from Auto-Detection */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-xs space-y-3 text-slate-350">
              <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Auto-Detection Summary</span>
              
              <div>
                <span className="font-semibold block mb-0.5">Semester Working Days Rule:</span>
                {semester >= 7 ? (
                  <span className="text-rose-400 font-semibold">⚠️ Monday, Tuesday, Wednesday only (Thu-Sun Off).</span>
                ) : (
                  <span className="text-indigo-400 font-semibold">ℹ️ Monday to Friday are working days (Sat, Sun Off).</span>
                )}
              </div>

              <div>
                <span className="font-semibold block mb-0.5">Semester Start Date:</span>
                {detectedStartFeedback ? (
                  <span className="text-emerald-400 font-bold">✨ {detectedStartFeedback}</span>
                ) : (
                  <div className="space-y-1">
                    <span className="text-amber-500 block">⚠️ Could not detect Class Start date. Please select it manually:</span>
                    <input
                      type="date"
                      value={semesterStartDate}
                      onChange={(e) => setSemesterStartDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold block mb-0.5">Exams Start Date (read from PDF):</span>
                {detectedExamFeedback ? (
                  <span className="text-emerald-400 font-bold">✨ {detectedExamFeedback}</span>
                ) : (
                  <div className="space-y-1">
                    <span className="text-amber-500 block font-semibold">⚠️ Exam date not detected in PDF. Provide manually:</span>
                    <input
                      type="date"
                      value={examStartDate}
                      onChange={(e) => handleExamStartChange(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs"
                    />
                  </div>
                )}
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
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs"
              >
                Continue <Icons.ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Exam End Date Parameters */}
        {currentStep === 3 && (
          <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-white">Step 3: When do the exams end?</h2>
              <p className="text-xs text-slate-400">PDFs list the exam start date but not always the end date. Tell us the exam duration or last day so we can calculate the final date.</p>
            </div>

            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800 text-xs">
              <span className="text-slate-400">Resolved Exam Start Date:</span>{' '}
              <span className="font-bold text-indigo-400">{examStartDate || 'Not set'}</span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleExamInputModeChange('duration')}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg border font-bold transition-all ${
                    examInputMode === 'duration'
                      ? 'bg-indigo-650 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-750 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Enter Exam Duration (Days)
                </button>
                <button
                  onClick={() => handleExamInputModeChange('end_date')}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg border font-bold transition-all ${
                    examInputMode === 'end_date'
                      ? 'bg-indigo-650 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-750 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Select Exam Last Date Directly
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {examInputMode === 'duration' ? (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min={1}
                      value={examDuration}
                      onChange={(e) => handleExamDurationChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Exam End Date</label>
                    <input
                      type="date"
                      value={examEndDate}
                      onChange={(e) => handleExamEndDateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">Calculated End Date</label>
                  <div className="bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-300">
                    {examEndDate || 'Not Configured'}
                  </div>
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
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs"
              >
                Continue <Icons.ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Configure Course Details */}
        {currentStep === 4 && (
          <div className="max-w-lg mx-auto bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-white">Step 4: Configure Course & Teaching Days</h2>
              <p className="text-xs text-slate-400">Set the name of the subject you teach and select which weekdays you take this class.</p>
            </div>

            {courses.length === 0 ? (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-slate-400 block">Course Name:</label>
                <input
                  type="text"
                  placeholder="e.g. CS-401: Distributed Systems"
                  id="newCourseNameInput"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('newCourseNameInput');
                    if (el && el.value.trim()) {
                      handleAddCourse(el.value);
                    }
                  }}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-lg text-xs"
                >
                  Create Course Profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900/50 p-4 border border-slate-750 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 text-xs">{activeCourse?.name}</span>
                    <button
                      onClick={() => handleDeleteCourse(activeCourseId)}
                      className="text-rose-500 hover:text-rose-400 text-[10px] font-bold"
                    >
                      Delete
                    </button>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Weekly Class Days:</span>
                    <div className="flex flex-wrap gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                        const isSelected = classDays.includes(idx);
                        const isCollegeWorking = (semester >= 1 && semester <= 6)
                          ? (idx >= 1 && idx <= 5)
                          : (idx >= 1 && idx <= 3);

                        return (
                          <button
                            key={day}
                            onClick={() => handleToggleCourseDay(activeCourseId, idx)}
                            className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all relative ${
                              isSelected
                                ? 'bg-indigo-650 border-indigo-500 text-white shadow shadow-indigo-600/10'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-855'
                            } ${!isCollegeWorking && isSelected ? 'ring-2 ring-rose-500/50' : ''}`}
                          >
                            {day}
                            {!isCollegeWorking && isSelected && (
                              <span className="absolute -top-1.5 -right-1 text-[8px] bg-rose-600 text-white rounded px-0.8 font-bold border border-slate-900" title="Non-working college day for this semester!">
                                !
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-2">
                      ⚠️ Note: Weekdays marked with an exclamation (!) are off-days according to the college semester rule.
                    </span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-500">Need to add another course?</span>
                  <button
                    onClick={() => {
                      const name = window.prompt("Enter Course Name:");
                      if (name) handleAddCourse(name);
                    }}
                    className="text-xs text-indigo-400 font-bold ml-1.5 hover:underline"
                  >
                    + Add More Courses
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-xs text-slate-400 hover:text-slate-300 font-bold flex items-center gap-1"
              >
                <Icons.ChevronLeft /> Back
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                disabled={courses.length === 0}
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs disabled:opacity-40"
              >
                Plan Lecture Schedule <Icons.ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Final Lecture Planner Dashboard */}
        {currentStep === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Left Hand: Syllabus topics & mapped lectures list */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Courses Setup</h3>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    ⚙️ Manage Courses
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Course Plan:</label>
                  <select
                    value={activeCourseId}
                    onChange={(e) => setActiveCourseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-750 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2.5 rounded-lg text-center border border-slate-800">
                    <span className="text-lg font-bold text-indigo-400">{calculatedClassDates.length}</span>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">Available Dates</span>
                  </div>
                  <div className="bg-slate-900/50 p-2.5 rounded-lg text-center border border-slate-800">
                    <span className="text-lg font-bold text-slate-200">{syllabusTopics.length}</span>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">Topics Count</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => exportLecturePlanToCsv(activeCourse?.name || 'Course', semester, mappedLectures, unmappedTopics)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow shadow-emerald-600/10"
                  >
                    <Icons.Download /> Export Plan (CSV)
                  </button>
                </div>
              </div>

              {/* Syllabus bulk loader card */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Import Syllabus List</h4>
                  <p className="text-[10px] text-slate-500">Type or paste your topics list (one per line):</p>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    id="bulkTopicsInput"
                    placeholder="e.g.&#10;Lecture 1: Introduction&#10;Lecture 2: DFA definition"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-mono"
                  ></textarea>
                  <button
                    onClick={() => {
                      const el = document.getElementById('bulkTopicsInput');
                      if (el && el.value) {
                        handleBulkTopicsImport(activeCourseId, el.value);
                        el.value = '';
                      }
                    }}
                    className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-xs"
                  >
                    Add Topics to Syllabus
                  </button>
                </div>
              </div>

              {/* Adjust settings floating navigator */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 text-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-indigo-400 hover:underline font-bold"
                >
                  ⏪ Adjust Semester Start or Holiday Settings
                </button>
              </div>

            </div>

            {/* Right Hand: Schedule Results & visual calendar */}
            <div className="lg:col-span-2 space-y-6">

              {/* Warning/Info headers */}
              {syllabusTopics.length > calculatedClassDates.length && (
                <div className="bg-rose-900/30 border border-rose-800 text-rose-200 p-4 rounded-2xl text-xs flex items-start gap-2 animate-bounceFast">
                  <div className="mt-0.5"><Icons.Alert /></div>
                  <div>
                    <span className="font-bold">Syllabus Overflow Warning:</span> You have{' '}
                    <span className="font-bold">{syllabusTopics.length}</span> topics, but only{' '}
                    <span className="font-bold">{calculatedClassDates.length}</span> working class dates available.
                    The last <span className="font-bold">{syllabusTopics.length - calculatedClassDates.length}</span> topics are currently unmapped!
                    Add extra class sessions or toggle additional weekdays.
                  </div>
                </div>
              )}

              {syllabusTopics.length > 0 && syllabusTopics.length < calculatedClassDates.length && (
                <div className="bg-blue-900/20 border border-blue-800 text-blue-200 p-4 rounded-2xl text-xs flex items-start gap-2">
                  <div className="mt-0.5"><Icons.Alert /></div>
                  <div>
                    <span className="font-bold">Buffer Slots Available:</span> You have{' '}
                    <span className="font-bold">{syllabusTopics.length}</span> topics and{' '}
                    <span className="font-bold">{calculatedClassDates.length}</span> teaching dates.
                    The remaining <span className="font-bold">{calculatedClassDates.length - syllabusTopics.length}</span> dates are designated as buffer/revision slots.
                  </div>
                </div>
              )}

              {/* Visual Calendar Component */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-md font-bold text-white">Visual Lecture Calendar</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Circles indicate teaching class dates for {activeCourse?.name}</p>
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

                <div className="flex flex-wrap gap-4 mt-6 text-xs border-t border-slate-700/60 pt-4 text-slate-500">
                  <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-indigo-600/25 border-indigo-500 border-2 rounded"></span><span>Circled Lecture</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-rose-500/10 border-rose-500/40 border rounded"></span><span>Holiday</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-amber-500/10 border-amber-500/40 border rounded"></span><span>Exams</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-900 border-slate-800 border rounded"></span><span>Weekend Off</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-850 line-through border border-slate-800 rounded"></span><span>Cancelled Class</span></div>
                </div>
              </div>

              {/* Day-by-Day Lecture Plan Grid */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day-by-Day Mapping List</h4>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddSingleTopic(activeCourseId)} className="text-[10px] text-indigo-400 font-bold border border-slate-700 rounded px-2 py-1 bg-slate-900/40">+ Add Topic</button>
                    <button onClick={() => handleClearTopics(activeCourseId)} className="text-[10px] text-rose-400 font-bold border border-slate-700 rounded px-2 py-1 bg-slate-900/40">Clear Topics</button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-750 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-750 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="p-3 w-16 text-center">Lec #</th>
                        <th className="p-3 w-28">Date</th>
                        <th className="p-3">Topic / syllabus Content</th>
                        <th className="p-3 w-40">Notes / Tasks</th>
                        <th className="p-3 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {mappedLectures.map(lec => (
                        <tr key={lec.lectureNumber} className={`hover:bg-slate-800/30 transition-colors ${lec.isExtra ? 'bg-emerald-950/20' : ''}`}>
                          <td className="p-3 font-bold text-center text-slate-500">{lec.lectureNumber}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-200">{lec.date}</span>
                            <span className="text-[10px] text-slate-500 block">{lec.dayName}</span>
                          </td>
                          <td className="p-3">
                            {lec.topicId ? (
                              <input
                                type="text"
                                value={lec.topicName}
                                onChange={(e) => handleUpdateTopicField(activeCourseId, lec.topicId, 'name', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 py-1 outline-none text-slate-200"
                              />
                            ) : (
                              <span className="text-slate-500 italic">{lec.topicName}</span>
                            )}
                            {lec.eventName && (
                              <span className="text-[9px] text-indigo-400 block font-semibold">⚡ Event: {lec.eventName}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {lec.topicId ? (
                              <input
                                type="text"
                                value={lec.notes}
                                onChange={(e) => handleUpdateTopicField(activeCourseId, lec.topicId, 'notes', e.target.value)}
                                placeholder="Slides checklist..."
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 outline-none focus:border-indigo-500 text-slate-350"
                              />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {lec.topicId ? (
                              <button onClick={() => handleRemoveTopic(activeCourseId, lec.topicId)} className="text-rose-500 hover:text-rose-400"><Icons.Trash /></button>
                            ) : (
                              <span className="text-slate-655">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Unmapped list */}
                {unmappedTopics.length > 0 && (
                  <div className="mt-4 border border-rose-900/40 rounded-xl p-4 bg-rose-950/10">
                    <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Unmapped Syllabus (Need class slots)</h5>
                    <ul className="list-disc pl-5 text-xs text-rose-300 space-y-1">
                      {unmappedTopics.map(t => (
                        <li key={t.id} className="flex justify-between items-center">
                          <span>{t.name}</span>
                          <button onClick={() => handleRemoveTopic(activeCourseId, t.id)} className="text-rose-500 hover:text-rose-400"><Icons.Trash /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none"
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
    </div>
  );
}