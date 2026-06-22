import React, { useState, useEffect } from 'react';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [alertMsg, setAlertMsg] = useState(null);
  
  // Categorization state
  const [stats, setStats] = useState({ 
    holidays: 0, 
    workingWithEvents: 0, 
    workingWithoutEvents: 0 
  });

  const fetchEvents = async () => {
    try {
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/events/');
      const data = await response.json();
      if (data.status === 'success') {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let holidays = 0;
    let workingWithEvents = 0;
    let workingWithoutEvents = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isSunday = dayOfWeek === 0;
      const dayEvents = events.filter(e => {
        const ed = new Date(e.start_datetime);
        return ed.getDate() === day && ed.getMonth() === month && ed.getFullYear() === year;
      });

      if (isSunday) {
        holidays++;
      } else if (dayEvents.length > 0) {
        workingWithEvents++;
      } else {
        workingWithoutEvents++;
      }
    }
    setStats({ holidays, workingWithEvents, workingWithoutEvents });
  }, [events, currentDate]);

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/upload-event-file/', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Upload failed");
      
      fetchEvents();
    } catch (error) {
      console.error("Failed to upload:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800">My AI Calendar</h1>
          <div className="relative">
            <input type="file" accept="image/*, application/pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={loading} />
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
              {loading ? 'Processing...' : '📸 Upload Schedule'}
            </button>
          </div>
        </div>

        {/* Updated Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.holidays}</div>
            <div className="text-xs text-red-800 uppercase font-bold">Holidays</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
            <div className="text-3xl font-bold text-emerald-600">{stats.workingWithEvents}</div>
            <div className="text-xs text-emerald-800 uppercase font-bold">Working (w/ Events)</div>
          </div>
          <div className="bg-slate-200 p-4 rounded-xl border border-slate-300 text-center">
            <div className="text-3xl font-bold text-slate-600">{stats.workingWithoutEvents}</div>
            <div className="text-xs text-slate-800 uppercase font-bold">Working (No Events)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 bg-slate-800 text-white">
            <button onClick={prevMonth}>Prev</button>
            <h2 className="text-lg font-bold">{monthName} {year}</h2>
            <button onClick={nextMonth}>Next</button>
          </div>
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2 text-center text-xs font-bold text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 auto-rows-[100px]">
            {[...Array(firstDayOfMonth)].map((_, i) => <div key={`b-${i}`} className="bg-slate-50 border-b border-r border-slate-100"></div>)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSunday = new Date(year, month, day).getDay() === 0;
              return (
                <div key={day} className={`border-b border-r border-slate-100 p-2 ${isSunday ? 'bg-red-50' : ''}`}>
                  <div className="text-xs font-bold text-slate-400">{day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}