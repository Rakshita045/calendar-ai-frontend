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

// SVG Inline Icons to avoid extra bundle size & npm import issues
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

// Default Term Configuration (Persisted for first time use)
const DEFAULT_SESSION_NAME = "Fall 2026 Term";
const DEFAULT_EVENTS = [
  { id: 'ev-1', title: 'Independence Day Holiday', date: '2026-08-15', type: 'holiday', semesters: [] },
  { id: 'ev-2', title: 'Raksha Bandhan', date: '2026-08-28', type: 'holiday', semesters: [] },
  { id: 'ev-3', title: 'Teachers Day Celebration', date: '2026-09-05', type: 'event', semesters: [] },
  { id: 'ev-4', title: 'Gandhi Jayanti Holiday', date: '2026-10-02', type: 'holiday', semesters: [] },
  { id: 'ev-5', title: 'Dussehra Holidays', date: '2026-10-19', type: 'holiday', semesters: [] },
  { id: 'ev-6', title: 'Diwali Break', date: '2026-11-06', type: 'holiday', semesters: [] },
  { id: 'ev-7', title: 'End Semester Exams Begin', date: '2026-11-23', type: 'exam', semesters: [] }
];
const DEFAULT_COURSES = [
  {
    id: 'c-1',
    name: 'CS-401: Distributed Systems',
    classDays: [1, 3, 5], // Mon, Wed, Fri
    topics: [
      { id: 't-1', name: 'Introduction to Distributed Systems: Definitions & Goals', notes: 'Prepare slides' },
      { id: 't-2', name: 'Hardware & Software Architectural Models', notes: 'Review textbook chapter 2' },
      { id: 't-3', name: 'Networking Principles and Transport Protocols', notes: '' },
      { id: 't-4', name: 'Interprocess Communication: Sockets & Datagrams', notes: 'Lab activity 1 setup' },
      { id: 't-5', name: 'Remote Invocation: RPC & RMI paradigms', notes: 'Check homework assignments' },
      { id: 't-6', name: 'Indirect Communication & Publish-Subscribe Systems', notes: '' },
      { id: 't-7', name: 'Operating System Support & Process Management', notes: '' },
      { id: 't-8', name: 'Virtualization & Cloud Architecture Basics', notes: '' },
      { id: 't-9', name: 'Distributed File Systems: NFS and HDFS', notes: 'Demo Hadoop' },
      { id: 't-10', name: 'Name Services & DNS mapping in Distributed environments', notes: '' },
      { id: 't-11', name: 'Time Synchronization: Logical Clocks & Vector Clocks', notes: 'Solve exam questions in class' },
      { id: 't-12', name: 'Mutual Exclusion and Election Algorithms', notes: '' }
    ]
  },
  {
    id: 'c-2',
    name: 'CS-407: Advanced Capstone Project',
    classDays: [1, 2], // Mon, Tue (For Sem 7/8 tests)
    topics: [
      { id: 'tc-1', name: 'Project Proposal Presentation', notes: 'Coordinate review panel' },
      { id: 'tc-2', name: 'System Design and Schema Reviews', notes: '' },
      { id: 'tc-3', name: 'Mid-term Prototype Evaluations', notes: 'Form submission required' },
      { id: 'tc-4', name: 'Final Deployments & Testing', notes: 'Check hosting platforms' }
    ]
  }
];

export default function App() {
  // Navigation & Active Section Tabs
  const [activeTab, setActiveTab] = useState('dashboard'); // 'calendar', 'courses', 'lecturePlan', 'dashboard'

  // Session State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [sessionName, setSessionName] = useState(DEFAULT_SESSION_NAME);

  // Term Parameters
  const [semester, setSemester] = useState(5); // Sem 5 (Default, Mon-Fri working days)
  const [semesterStartDate, setSemesterStartDate] = useState('2026-08-03');
  const [examStartDate, setExamStartDate] = useState('2026-11-23');
  const [examDuration, setExamDuration] = useState(10);
  const [examEndDate, setExamEndDate] = useState('2026-12-02');
  const [examInputMode, setExamInputMode] = useState('duration'); // 'duration' or 'end_date'

  // Events & Courses Lists
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [activeCourseId, setActiveCourseId] = useState('c-1');

  // Interactive Calendar Navigation
  const [calendarMonth, setCalendarMonth] = useState(new Date('2026-08-01'));
  
  // UI Loading/Feedback states
  const [loading, setLoading] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventForm, setEditingEventForm] = useState({ title: '', date: '', type: 'holiday', semesters: [] });
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
      // First load: setup default session
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
        activeCourseId: 'c-1'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save session whenever relevant parameters change
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
      activeCourseId
    });
  }, [
    currentSessionId, sessionName, semester, semesterStartDate,
    examStartDate, examDuration, examEndDate, examInputMode,
    events, courses, activeCourseId
  ]);

  // Sync Exam dates when inputs change
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

  // Switch between Exam input modes
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

  // Helper to read and save to localStorage
  const saveSessionData = (id, data) => {
    localStorage.setItem(`academic_session_${id}`, JSON.stringify(data));
  };

  const loadSession = (id) => {
    const savedData = localStorage.getItem(`academic_session_${id}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setCurrentSessionId(id);
      setSessionName(data.sessionName || "Term Schedule");
      setSemester(data.semester || 1);
      setSemesterStartDate(data.semesterStartDate || '2026-08-01');
      setExamStartDate(data.examStartDate || '2026-11-20');
      setExamDuration(data.examDuration || 10);
      setExamEndDate(data.examEndDate || '2026-11-29');
      setExamInputMode(data.examInputMode || 'duration');
      setEvents(data.events || []);
      setCourses(data.courses || []);
      setActiveCourseId(data.activeCourseId || (data.courses[0] && data.courses[0].id) || '');
      localStorage.setItem('academic_active_session_id', id);
      
      // Update calendar default month view to term start date
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
    
    localStorage.setItem('academic_sessions_index', JSON.stringify(updatedIndex));
    localStorage.setItem('academic_active_session_id', newId);

    // Initial state setup for new session
    const freshState = {
      sessionName: newName,
      semester: 1,
      semesterStartDate: formatDate(new Date()),
      examStartDate: addDays(formatDate(new Date()), 90),
      examDuration: 10,
      examEndDate: addDays(formatDate(new Date()), 99),
      examInputMode: 'duration',
      events: [],
      courses: [],
      activeCourseId: ''
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

  const handleSessionNameChange = (val) => {
    setSessionName(val);
    const updatedIndex = sessions.map(s => s.id === currentSessionId ? { ...s, name: val } : s);
    setSessions(updatedIndex);
    localStorage.setItem('academic_sessions_index', JSON.stringify(updatedIndex));
  };

  // Heuristic Text Area Parsing Action
  const triggerTextImport = () => {
    if (!rawTextImport.trim()) return;
    const year = new Date(semesterStartDate).getFullYear() || new Date().getFullYear();
    const parsed = require('./utils/textHeuristics').parseAcademicText(rawTextImport, year);
    
    if (parsed.length === 0) {
      window.alert("Could not extract any events with date formats. Check if lines contain valid dates.");
      return;
    }

    // Attempt to extract an exam start date from parsed events
    const examEvent = parsed.find(e => e.type === 'exam');
    if (examEvent) {
      handleExamStartChange(examEvent.date);
    }

    // Append to events
    setEvents(prev => {
      // Avoid duplicate dates with same title
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
        // Validates simple [{title, date, type, semesters}] array
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
        for (let i = 1; i < lines.length; i++) { // Skip header row
          const line = lines[i].trim();
          if (!line) continue;
          
          // CSV Split handling simple columns: Date, Title, Type, Semesters
          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // handle quoted columns
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
        // Look for exam start date
        const examEvent = parsedEvents.find(ev => ev.type === 'exam');
        if (examEvent) {
          handleExamStartChange(examEvent.date);
        }

        setEvents(prev => {
          const uniqueEvents = [...prev];
          for (const p of parsedEvents) {
            if (!uniqueEvents.some(x => x.date === p.date && x.title === p.title)) {
              uniqueEvents.push(p);
            }
          }
          return uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        });
        
        window.alert(`Success: Loaded ${parsedEvents.length} events from ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      window.alert("Error loading calendar: " + err.message);
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input element
    }
  };

  // Event list editing / deleting
  const handleStartEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEditingEventForm({
      title: ev.title,
      date: ev.date,
      type: ev.type,
      semesters: ev.semesters || []
    });
  };

  const handleSaveEditEvent = () => {
    if (!editingEventForm.title.trim() || !editingEventForm.date) {
      window.alert("Title and Date are required.");
      return;
    }
    
    setEvents(prev => prev.map(ev => 
      ev.id === editingEventId 
        ? { ...ev, ...editingEventForm }
        : ev
    ).sort((a, b) => new Date(a.date) - new Date(b.date)));

    setEditingEventId(null);
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm("Delete this event?")) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleAddNewEvent = () => {
    const defaultDate = semesterStartDate;
    const newEv = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New College Holiday',
      date: defaultDate,
      type: 'holiday',
      semesters: []
    };
    setEvents(prev => [newEv, ...prev].sort((a, b) => new Date(a.date) - new Date(b.date)));
    handleStartEditEvent(newEv);
  };

  // Course configuration handlers
  const handleAddCourse = () => {
    const name = window.prompt("Enter Course Name (e.g. CS-402: Theory of Computation):");
    if (!name || !name.trim()) return;

    const newCourse = {
      id: 'c-' + Date.now(),
      name: name.trim(),
      classDays: [1, 3], // Monday, Wednesday
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

  // Syllabus / Lecture topic handlers
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

  // Calendar Day overrides dialog (Cancelled classes & Extra classes)
  const handleOpenDayDialog = (dateStr) => {
    const dayOfWeek = new Date(dateStr).getDay();
    const activeCourse = courses.find(c => c.id === activeCourseId);
    
    // Check if course has standard class scheduled for this weekday
    const isNormalClassDay = activeCourse ? activeCourse.classDays.includes(dayOfWeek) : false;
    const isSemesterWorking = (semester >= 1 && semester <= 6) 
      ? (dayOfWeek >= 1 && dayOfWeek <= 5)
      : (dayOfWeek >= 1 && dayOfWeek <= 3);

    // Find custom events on this day
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

    // Remove existing overrides on this date for this specific context
    setEvents(prev => {
      let filtered = prev.filter(e => {
        // If it's a general holiday, remove it if type changes
        if (e.date === dateStr && e.type === 'holiday' && type !== 'holiday') return false;
        // Remove course-specific overrides
        if (e.date === dateStr && (e.type === 'cancel_class' || e.type === 'extra_class') && e.courseId === activeCourseId) return false;
        return true;
      });

      // Insert new overrides
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

  // Calculations for current active course teaching schedule
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const classDays = activeCourse ? activeCourse.classDays : [];
  
  // Calculate raw working/class dates
  const calculatedClassDates = calculateWorkingDates({
    semester,
    semesterStartDate,
    examStartDate,
    examEndDate,
    events,
    courseClassDays: classDays,
    courseId: activeCourseId
  });

  // Map syllabus topics
  const syllabusTopics = activeCourse ? activeCourse.topics : [];
  const mappedLectures = mapSyllabusToDates(calculatedClassDates, syllabusTopics);
  const unmappedTopics = syllabusTopics.slice(calculatedClassDates.length);

  // General Term Statistics
  const termTotalDays = getDaysDifference(semesterStartDate, examEndDate);
  const termExamDays = getDaysDifference(examStartDate, examEndDate);
  
  // Find semester holidays count
  const termHolidaysCount = events.filter(e => {
    if (e.type !== 'holiday') return false;
    if (e.date < semesterStartDate || e.date > examEndDate) return false;
    return e.semesters.length === 0 || e.semesters.includes(semester);
  }).length;

  // Interactive Custom Calendar Renderer
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

    // Map scheduled dates for easy indexing
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
    // Padding for month start
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`pad-${i}`} className="bg-slate-50 border border-slate-100 p-2 min-h-[90px] rounded-lg opacity-40"></div>);
    }

    // Month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();
      
      const lec = mappedLecturesByDate[dateStr];
      const ev = eventsByDate[dateStr];
      const isExam = dateStr >= examStartDate && dateStr <= examEndDate;

      // Determine semester rules
      const isSemWorking = (semester >= 1 && semester <= 6)
        ? (dayOfWeek >= 1 && dayOfWeek <= 5)
        : (dayOfWeek >= 1 && dayOfWeek <= 3);

      const isCourseDay = classDays.includes(dayOfWeek);

      let cellClass = "bg-white hover:bg-slate-50 transition-colors";
      let textClass = "text-slate-700 font-semibold";
      let indicator = null;

      if (isExam) {
        cellClass = "bg-amber-50/70 border-amber-200";
        textClass = "text-amber-800 font-bold";
        indicator = <div className="text-[10px] text-amber-700 font-medium truncate mt-1">📝 Exams Period</div>;
      } else if (ev && ev.type === 'holiday') {
        cellClass = "bg-rose-50/70 border-rose-200";
        textClass = "text-rose-800 font-bold";
        indicator = <div className="text-[10px] text-rose-700 font-medium truncate mt-1">🏖️ {ev.title}</div>;
      } else if (lec) {
        // Circle class days
        cellClass = "bg-indigo-50 border-indigo-200 border-2 shadow-sm scale-102";
        textClass = "text-indigo-900 font-black";
        indicator = (
          <div className="mt-1">
            <div className="text-[10px] bg-indigo-600 text-white rounded px-1 py-0.5 truncate font-medium" title={lec.topicName}>
              #{lec.lectureNumber} {lec.topicName}
            </div>
            {lec.isExtra && <span className="text-[8px] bg-emerald-100 text-emerald-800 rounded px-1 py-0.2 mt-0.5 inline-block font-semibold">Extra Class</span>}
          </div>
        );
      } else if (!isSemWorking) {
        cellClass = "bg-slate-100 border-slate-200 opacity-60";
        textClass = "text-slate-400";
        indicator = <div className="text-[9px] text-slate-400 italic mt-1">Weekend / Off</div>;
      } else if (!isCourseDay) {
        cellClass = "bg-slate-50 border-slate-100";
        textClass = "text-slate-500";
        indicator = <div className="text-[9px] text-slate-400 mt-1">No Lecture</div>;
      }

      // Check for custom cancellations
      const isCancelled = events.some(e => e.date === dateStr && e.type === 'cancel_class' && e.courseId === activeCourseId);
      if (isCancelled) {
        cellClass = "bg-slate-100 border-slate-200 line-through opacity-70";
        textClass = "text-slate-400";
        indicator = <div className="text-[9px] text-red-600 font-semibold mt-1">❌ Cancelled</div>;
      }

      cells.push(
        <div
          key={d}
          onClick={() => handleOpenDayDialog(dateStr)}
          className={`border border-slate-200/80 p-2 min-h-[90px] rounded-lg cursor-pointer flex flex-col justify-between relative select-none ${cellClass}`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs ${textClass}`}>{d}</span>
            {ev && ev.type === 'event' && (
              <span className="text-[8px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-medium truncate max-w-[50px]">{ev.title}</span>
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Premium Top Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Icons.Calendar />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Academic Lecture Planner
              </h1>
              <p className="text-xs text-slate-400">Frontend-Only Course Scheduling & Syllabus Mapping</p>
            </div>
          </div>

          {/* Session Switcher dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Current Session:</span>
            <select
              value={currentSessionId}
              onChange={(e) => loadSession(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={createNewSession}
              title="Create New Term Plan"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 rounded-lg transition-colors"
            >
              <Icons.Plus />
            </button>
            <button
              onClick={(e) => deleteSession(currentSessionId, e)}
              title="Delete Current Term Plan"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700 rounded-lg transition-colors"
            >
              <Icons.Trash />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6">
        
        {/* Term Metadata & Settings Card */}
        <section className="bg-slate-800/50 backdrop-blur border border-slate-700/80 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Session Rename & Semester Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => handleSessionNameChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                  placeholder="e.g. Fall 2026 Semester"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                >
                  <option value={1}>Semester 1 (Mon-Fri Working)</option>
                  <option value={2}>Semester 2 (Mon-Fri Working)</option>
                  <option value={3}>Semester 3 (Mon-Fri Working)</option>
                  <option value={4}>Semester 4 (Mon-Fri Working)</option>
                  <option value={5}>Semester 5 (Mon-Fri Working)</option>
                  <option value={6}>Semester 6 (Mon-Fri Working)</option>
                  <option value={7}>Semester 7 (Mon-Wed Working)</option>
                  <option value={8}>Semester 8 (Mon-Wed Working)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {semester >= 7 ? "⚠️ Sem 7-8: only Mon, Tue, Wed are college working days." : "ℹ️ Sem 1-6: Mon to Fri are college working days."}
                </span>
              </div>
            </div>

            {/* Term Start & Exam Start */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Semester Start Date</label>
                <input
                  type="date"
                  value={semesterStartDate}
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Start Date</label>
                <input
                  type="date"
                  value={examStartDate}
                  onChange={(e) => handleExamStartChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Exam End Date & Duration toggle */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Exam End Date Calculation Mode
                </span>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => handleExamInputModeChange('duration')}
                    className={`flex-1 py-1 px-3 text-xs rounded-lg border font-semibold transition-all ${
                      examInputMode === 'duration'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Set Exam Duration (Days)
                  </button>
                  <button
                    onClick={() => handleExamInputModeChange('end_date')}
                    className={`flex-1 py-1 px-3 text-xs rounded-lg border font-semibold transition-all ${
                      examInputMode === 'end_date'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Set Exam Last Date Directly
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {examInputMode === 'duration' ? (
                    <div>
                      <label className="block text-xs text-slate-400 mb-0.5">Duration (Days)</label>
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
                      <label className="block text-xs text-slate-400 mb-0.5">Exam Last Date</label>
                      <input
                        type="date"
                        value={examEndDate}
                        onChange={(e) => handleExamEndDateChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-slate-400 mb-0.5">Calculated Exam End Date</label>
                    <div className="bg-slate-900/60 border border-slate-750 px-3 py-2 rounded-lg text-sm text-slate-300 font-semibold">
                      {examEndDate || 'Not Configured'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icons.BookOpen /> Dashboard & Syllabus
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'calendar'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icons.Calendar /> Interactive Calendar
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'courses'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icons.Settings /> Teaching Schedule ({courses.length})
          </button>
        </div>

        {/* Tab 1: Dashboard & Syllabus Planning */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Academic Calendar File Parser */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
                  <Icons.Upload /> 1. Import Academic Calendar
                </h3>
                
                {/* Drag and Drop File Input */}
                <div className="relative border-2 border-dashed border-slate-750 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer transition-colors mb-4 bg-slate-900/30">
                  <input
                    type="file"
                    accept=".pdf,.ics,.csv,.json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-indigo-400 mb-2 flex justify-center"><Icons.Upload /></div>
                  <span className="text-xs text-slate-300 font-bold block">
                    {loading ? 'Uploading & Parsing...' : 'Upload PDF, ICS, CSV, or JSON'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    We will extract holidays and exam start dates directly
                  </span>
                </div>

                {/* Paste Text Area */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Or Paste Calendar Text Heuristically:</label>
                  <textarea
                    rows={4}
                    value={rawTextImport}
                    onChange={(e) => setRawTextImport(e.target.value)}
                    placeholder="e.g. 15 Aug 2026 - Independence Day&#10;24 Nov 2026 - VII Sem Exams Start"
                    className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs focus:border-indigo-500 outline-none placeholder:text-slate-600 resize-none font-mono"
                  ></textarea>
                  <button
                    onClick={triggerTextImport}
                    disabled={!rawTextImport.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Extract Events from Text
                  </button>
                </div>
              </div>

              {/* Term Statistics Dashboard */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4">
                  Term Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-800">
                    <span className="text-2xl font-bold text-white">{termTotalDays}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">Calendar Days</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-800">
                    <span className="text-2xl font-bold text-rose-500">{termHolidaysCount}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">College Holidays</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-800">
                    <span className="text-2xl font-bold text-amber-500">{termExamDays}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">Exam Period Days</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-800">
                    <span className="text-2xl font-bold text-indigo-400">{calculatedClassDates.length}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold mt-1">Scheduled Lectures</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Syllabus mapping and active course plan */}
            <div className="lg:col-span-2 space-y-6">
              
              {courses.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-750 rounded-2xl p-12 text-center text-slate-400">
                  <p className="mb-4">No courses configured. Add a course to start planning lectures.</p>
                  <button
                    onClick={handleAddCourse}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs"
                  >
                    Create a Course
                  </button>
                </div>
              ) : (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                  
                  {/* Select Course teaching */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700/60 pb-4 mb-4 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Course to Plan:</label>
                      <select
                        value={activeCourseId}
                        onChange={(e) => setActiveCourseId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white font-bold text-md rounded-lg px-3 py-1.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none block"
                      >
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => exportLecturePlanToCsv(activeCourse?.name || 'Course', semester, mappedLectures, unmappedTopics)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/10"
                      >
                        <Icons.Download /> Export Plan (CSV)
                      </button>
                    </div>
                  </div>

                  {/* Course specifics details */}
                  <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800 mb-6 flex flex-wrap justify-between items-center gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Standard Class Days:</span>{' '}
                      <span className="font-bold text-indigo-400">
                        {classDays.length === 0 
                          ? 'None selected (Configure in Teaching Schedule)' 
                          : classDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Available lecture dates:</span>{' '}
                      <span className="font-bold text-slate-200">{calculatedClassDates.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Syllabus topics input:</span>{' '}
                      <span className="font-bold text-slate-200">{syllabusTopics.length}</span>
                    </div>
                  </div>

                  {/* Bulk import syllabus topics */}
                  <div className="mb-6 bg-slate-900/30 border border-slate-750 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Import Topics List</h4>
                    <p className="text-[10px] text-slate-500 mb-2">Paste one lecture topic per line. We will distribute them sequentially on working dates.</p>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        id="bulkTopicsInput"
                        placeholder="e.g.&#10;Lecture 1: Introduction&#10;Lecture 2: System Architecture"
                        className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-mono"
                      ></textarea>
                      <button
                        onClick={() => {
                          const el = document.getElementById('bulkTopicsInput');
                          if (el && el.value) {
                            handleBulkTopicsImport(activeCourseId, el.value);
                            el.value = '';
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-lg text-xs transition-colors self-end py-3"
                      >
                        Add Topics
                      </button>
                    </div>
                  </div>

                  {/* Warning for topics and dates mismatch */}
                  {syllabusTopics.length > calculatedClassDates.length && (
                    <div className="bg-rose-900/30 border border-rose-800 text-rose-200 p-3.5 rounded-xl text-xs mb-6 flex items-start gap-2">
                      <div className="mt-0.5"><Icons.Alert /></div>
                      <div>
                        <span className="font-bold">Syllabus Overflow Warning:</span> You have{' '}
                        <span className="font-bold">{syllabusTopics.length}</span> topics, but only{' '}
                        <span className="font-bold">{calculatedClassDates.length}</span> working class dates available.
                        The last <span className="font-bold">{syllabusTopics.length - calculatedClassDates.length}</span> topics are currently unmapped!
                        Add more class days or schedule extra lectures.
                      </div>
                    </div>
                  )}

                  {syllabusTopics.length > 0 && syllabusTopics.length < calculatedClassDates.length && (
                    <div className="bg-blue-900/20 border border-blue-800 text-blue-200 p-3.5 rounded-xl text-xs mb-6 flex items-start gap-2">
                      <div className="mt-0.5"><Icons.Alert /></div>
                      <div>
                        <span className="font-bold">Buffer Days Available:</span> You have{' '}
                        <span className="font-bold">{syllabusTopics.length}</span> topics but{' '}
                        <span className="font-bold">{calculatedClassDates.length}</span> teaching slots.
                        The remaining <span className="font-bold">{calculatedClassDates.length - syllabusTopics.length}</span> dates are marked as buffer/revision classes.
                      </div>
                    </div>
                  )}

                  {/* Lecture Distribution Table */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day-by-Day Lecture Plan</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddSingleTopic(activeCourseId)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold border border-slate-700 rounded px-2 py-1 bg-slate-900/40"
                        >
                          + Add Single Topic
                        </button>
                        <button
                          onClick={() => handleClearTopics(activeCourseId)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold border border-slate-700 rounded px-2 py-1 bg-slate-900/40"
                        >
                          Clear All Topics
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[400px] border border-slate-750 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-750 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="p-3 w-16 text-center">Lec #</th>
                            <th className="p-3 w-28">Date</th>
                            <th className="p-3">Topic Content</th>
                            <th className="p-3 w-44">Notes / Checklist</th>
                            <th className="p-3 w-12 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {mappedLectures.map((lec) => (
                            <tr key={lec.lectureNumber} className={`hover:bg-slate-850 transition-colors ${lec.isExtra ? 'bg-emerald-950/20' : ''}`}>
                              <td className="p-3 font-bold text-center text-slate-400">{lec.lectureNumber}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="font-semibold text-slate-200">{lec.date}</span>
                                <span className="text-[10px] text-slate-400 block">{lec.dayName}</span>
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
                                    placeholder="Enter slides checklist..."
                                    className="w-full bg-slate-900 border border-slate-750 rounded px-2 py-1 outline-none focus:border-indigo-500 text-slate-300"
                                  />
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {lec.topicId ? (
                                  <button
                                    onClick={() => handleRemoveTopic(activeCourseId, lec.topicId)}
                                    className="text-rose-500 hover:text-rose-400"
                                    title="Delete topic from syllabus"
                                  >
                                    <Icons.Trash />
                                  </button>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Unmapped Syllabus list */}
                    {unmappedTopics.length > 0 && (
                      <div className="mt-4 border border-rose-800/40 rounded-xl p-4 bg-rose-950/10">
                        <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Unmapped Syllabus (Missing lecture slots)</h5>
                        <ul className="list-disc pl-5 text-xs text-rose-300 space-y-1">
                          {unmappedTopics.map((t) => (
                            <li key={t.id} className="flex justify-between items-center">
                              <span>{t.name}</span>
                              <button
                                onClick={() => handleRemoveTopic(activeCourseId, t.id)}
                                className="text-rose-500 hover:text-rose-400"
                              >
                                <Icons.Trash />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Tab 2: Interactive Monthly Calendar */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
            
            {/* Calendar Grid View (Cols 3) */}
            <div className="lg:col-span-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-md font-bold text-white">Visual Lecture Calendar Map</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Showing circled class dates for: <span className="font-bold text-indigo-400">{activeCourse?.name || 'None'}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg"
                  >
                    <Icons.ChevronLeft />
                  </button>
                  <span className="text-sm font-black text-slate-100 min-w-[120px] text-center">
                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg"
                  >
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>

              {renderInteractiveCalendar()}

              {/* Legend bar */}
              <div className="flex flex-wrap gap-4 mt-6 text-xs border-t border-slate-700/60 pt-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-indigo-50 border-indigo-200 border-2 rounded"></span>
                  <span>Circled Teaching Class</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-rose-50 border-rose-200 border rounded"></span>
                  <span>College Holiday</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-amber-50 border-amber-200 border rounded"></span>
                  <span>Exams Period</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-slate-100 border-slate-200 border rounded"></span>
                  <span>Weekly Off / Weekend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-slate-100 border-slate-200 border line-through rounded"></span>
                  <span>Cancelled Lecture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-emerald-950/20 border-indigo-200 border-2 rounded"></span>
                  <span>Extra Lecture Override</span>
                </div>
              </div>
            </div>

            {/* Sidebar Column: Holiday/Event Manager */}
            <div className="lg:col-span-1 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">College Events & Holidays</h3>
                <button
                  onClick={handleAddNewEvent}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1 text-xs"
                  title="Add New Custom Holiday/Event"
                >
                  <Icons.Plus />
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-8">No holidays or events parsed. Use import or manually add.</p>
                ) : (
                  events.map(ev => {
                    const isEditing = editingEventId === ev.id;
                    return (
                      <div key={ev.id} className="bg-slate-900/60 border border-slate-750 rounded-xl p-3 text-xs space-y-2 relative">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingEventForm.title}
                              onChange={(e) => setEditingEventForm({ ...editingEventForm, title: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs outline-none"
                              placeholder="Title"
                            />
                            <input
                              type="date"
                              value={editingEventForm.date}
                              onChange={(e) => setEditingEventForm({ ...editingEventForm, date: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs outline-none"
                            />
                            <select
                              value={editingEventForm.type}
                              onChange={(e) => setEditingEventForm({ ...editingEventForm, type: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs outline-none"
                            >
                              <option value="holiday">Holiday</option>
                              <option value="exam">Exam Event</option>
                              <option value="event">General Academic Event</option>
                            </select>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEditEvent}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded text-[10px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingEventId(null)}
                                className="flex-1 bg-slate-750 hover:bg-slate-700 text-slate-300 py-1 rounded text-[10px] font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-bold text-slate-200">{ev.title}</span>
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 uppercase tracking-wide ${
                                ev.type === 'holiday' ? 'bg-rose-950 text-rose-400 border border-rose-900' :
                                ev.type === 'exam' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                                'bg-blue-950 text-blue-400 border border-blue-900'
                              }`}>
                                {ev.type}
                              </span>
                            </div>
                            <div className="text-slate-400 font-mono text-[10px]">{ev.date}</div>
                            
                            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800/80 justify-end">
                              <button onClick={() => handleStartEditEvent(ev)} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                                <Icons.Edit /> Edit
                              </button>
                              <button onClick={() => handleDeleteEvent(ev.id)} className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5">
                                <Icons.Trash /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Courses teaching & schedules builder */}
        {activeTab === 'courses' && (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
              <div>
                <h3 className="text-md font-bold text-white">Course Syllabus & Schedules Setup</h3>
                <p className="text-xs text-slate-400">Configure weekly class days where you take lectures for each course.</p>
              </div>
              <button
                onClick={handleAddCourse}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
              >
                <Icons.Plus /> Create Course
              </button>
            </div>

            {courses.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-12">No courses. Click 'Create Course' to start.</p>
            ) : (
              <div className="space-y-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-slate-900/50 border border-slate-750 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-200">{course.name}</span>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-rose-500 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 border border-slate-800 hover:border-rose-900/50 rounded px-2.5 py-1"
                      >
                        <Icons.Trash /> Delete Course
                      </button>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weekly Class Days:</span>
                      <div className="flex flex-wrap gap-2">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => {
                          const isSelected = course.classDays.includes(idx);
                          // Determine if this day is a college working day based on semester rules
                          const isCollegeWorking = (semester >= 1 && semester <= 6)
                            ? (idx >= 1 && idx <= 5)
                            : (idx >= 1 && idx <= 3);

                          return (
                            <button
                              key={day}
                              onClick={() => handleToggleCourseDay(course.id, idx)}
                              className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all relative ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                              } ${!isCollegeWorking && isSelected ? 'ring-2 ring-rose-500/50' : ''}`}
                            >
                              {day.substring(0, 3)}
                              {!isCollegeWorking && isSelected && (
                                <span className="absolute -top-1.5 -right-1 text-[8px] bg-rose-600 text-white rounded px-0.8 font-bold border border-slate-900" title="Non-working college day for Sem rule!">
                                  !
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-2">
                        Click weekdays to toggle schedules. Exclamation mark indicates day falls outside standard college working days for the selected semester.
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                      <span>Total Syllabus topics: <span className="text-slate-200 font-bold">{course.topics.length}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Interactive day details popover/dialog override */}
      {calendarPopupDate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <h4 className="text-sm font-bold text-white mb-2">Schedule Override</h4>
            <p className="text-[11px] text-slate-400 mb-4">Customize lecture mapping for <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-indigo-400">{calendarPopupDate}</span></p>
            
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
                    placeholder="e.g. Local festival, Rescheduled session, etc."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveDayDialog}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2 rounded-lg text-xs"
                >
                  Apply Override
                </button>
                <button
                  onClick={() => setCalendarPopupDate(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-650 text-slate-200 font-bold py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}