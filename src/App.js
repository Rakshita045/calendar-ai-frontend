import React, { useState, useEffect } from 'react';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/events/');
      const data = await response.json();
      if (data.status === 'success') {
        const validEvents = data.data.filter(e => new Date(e.start_datetime).getDay() !== 0);
        setEvents(validEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleImageUpload = async (event) => {
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
      const hasSundayEvent = result.data?.some(e => new Date(e.start_datetime).getDay() === 0);
      
      if (hasSundayEvent) {
        setAlertMsg("Events could not be scheduled on Sunday. These events have been ignored.");
      } else {
        setAlertMsg(null);
      }
      
      if (response.ok) fetchEvents();
    } catch (error) {
      console.error("Failed to upload.");
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const currentMonthEvents = events.filter(e => {
    const ed = new Date(e.start_datetime);
    return ed.getMonth() === month && ed.getFullYear() === year;
  });

  const getEventsForDay = (day) => currentMonthEvents.filter(e => new Date(e.start_datetime).getDate() === day);

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800">My AI Calendar</h1>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*, application/pdf" 
              onChange={handleImageUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              disabled={loading} 
            />
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
              {loading ? 'Processing...' : '📸 Upload Schedule'}
            </button>
          </div>
        </div>

        {alertMsg && (
          <div className="mb-6 p-4 bg-amber-100 text-amber-800 rounded-xl border border-amber-200 flex justify-between items-center">
            <span>{alertMsg}</span>
            <button onClick={() => setAlertMsg(null)} className="font-bold">✕</button>
          </div>
        )}

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
              const dayEvents = getEventsForDay(day);
              const isSunday = new Date(year, month, day).getDay() === 0;
              return (
                <div key={day} onClick={() => setSelectedDay(day)} className={`border-b border-r border-slate-100 p-2 cursor-pointer hover:bg-indigo-50 transition-colors ${isSunday ? 'bg-red-50' : ''}`}>
                  <div className="text-xs font-bold text-slate-400">{day}</div>
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="text-[10px] bg-indigo-100 text-indigo-700 p-1 rounded mt-1 truncate">{e.title}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}