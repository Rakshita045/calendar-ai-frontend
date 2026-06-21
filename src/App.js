import React, { useState, useEffect } from 'react';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));

  const fetchEvents = async () => {
    try {
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/events/');
      const data = await response.json();
      if (data.status === 'success') {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setErrorMsg("Could not connect to the database.");
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
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/upload-event-image/', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) fetchEvents();
    } catch (error) {
      setErrorMsg("Failed to upload.");
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

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-800">My AI Calendar</h1>
            <p className="text-xs sm:text-sm text-slate-500">Upload a schedule image to sync.</p>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={loading} />
            <button className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {loading ? 'Processing...' : '📸 Upload'}
            </button>
          </div>
        </div>

        {/* Calendar UI - Responsive Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 bg-slate-800 text-white">
            <button onClick={prevMonth} className="text-sm">Prev</button>
            <h2 className="text-lg font-bold">{monthName} {year}</h2>
            <button onClick={nextMonth} className="text-sm">Next</button>
          </div>

          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
            {['S','M','T','W','T','F','S'].map(d => <div key={d} className="py-2 text-center text-xs font-bold text-slate-500">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 auto-rows-[80px] sm:auto-rows-[120px]">
            {[...Array(firstDayOfMonth)].map((_, i) => <div key={`b-${i}`} className="border-b border-r border-slate-100 bg-slate-50/50"></div>)}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvents = events.filter(e => {
                const ed = new Date(e.start_datetime);
                return ed.getDate() === day && ed.getMonth() === month && ed.getFullYear() === year;
              });

              return (
                <div key={day} className="border-b border-r border-slate-100 p-1 sm:p-2 hover:bg-slate-50 overflow-hidden">
                  <div className="text-xs text-slate-400 font-bold">{day}</div>
                  <div className="space-y-1 mt-1">
                    {dayEvents.map(e => (
                      <div key={e.id} className="text-[10px] sm:text-xs bg-indigo-100 text-indigo-700 p-0.5 sm:p-1 rounded truncate">
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}