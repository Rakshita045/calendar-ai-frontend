import React, { useState, useEffect } from 'react';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Setting default to August 2026 so your test data shows up immediately!
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));

  // 1. Fetch saved events from our Python Backend (UPDATED TO LIVE CLOUD URL)
  const fetchEvents = async () => {
    try {
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/events/');
      const data = await response.json();
      if (data.status === 'success') {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setErrorMsg("Could not connect to the database. Make sure your Python server is running.");
    }
  };

  // Run this once when the page loads
  useEffect(() => {
    fetchEvents();
  }, []);

  // 2. Handle Image Upload to Gemini (UPDATED TO LIVE CLOUD URL)
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(""); // Clear previous errors
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://calendar-ai-backend-t8u7.onrender.com/upload-event-image/', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        // Refresh the calendar with the newly saved events
        fetchEvents();
      } else {
        setErrorMsg("Failed to extract events from the image.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorMsg("Failed to upload image. Make sure your backend is running!");
    } finally {
      setLoading(false);
    }
  };

  // --- Calendar Math & Navigation ---
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My AI Calendar</h1>
            <p className="text-slate-500 mt-1">Upload a flyer or note, and AI will add it to your schedule.</p>
          </div>
          
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <button className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}>
              {loading ? '🧠 AI is reading...' : '📸 Upload Schedule Image'}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium shadow-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Calendar UI */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white">
            <button onClick={prevMonth} className="px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors font-medium">
              &larr; Prev
            </button>
            <h2 className="text-2xl font-bold tracking-wide">{monthName} {year}</h2>
            <button onClick={nextMonth} className="px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors font-medium">
              Next &rarr;
            </button>
          </div>

          {/* Days of the week header */}
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={day} className={`py-3 text-center text-sm font-semibold uppercase tracking-wider ${index === 0 ? 'text-red-500' : 'text-slate-600'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Actual Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {/* Blank spaces for the start of the specific month */}
            {[...Array(firstDayOfMonth)].map((_, i) => (
              <div key={`blank-${i}`} className="border-b border-r border-slate-100 bg-slate-50/50"></div>
            ))}

            {/* Loop through actual days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSunday = new Date(year, month, day).getDay() === 0;

              // Find events that happen on this specific day/month/year combination
              const dayEvents = events.filter(e => {
                const eventDate = new Date(e.start_datetime);
                return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
              });

              return (
                <div key={day} className={`border-b border-r border-slate-100 p-2 transition-colors ${isSunday ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                  <div className={`font-medium text-sm mb-1 ${isSunday ? 'text-red-400' : 'text-slate-400'}`}>
                    {day}
                  </div>
                  
                  {/* College Sunday Enforcement */}
                  {isSunday ? (
                    <div className="mt-2 text-center text-xs font-bold text-red-500 border border-red-200 bg-red-100/50 rounded py-1 px-2">
                      College Holiday
                    </div>
                  ) : (
                    /* Render standard events for Monday-Saturday */
                    <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                      {dayEvents.map(event => (
                        <div key={event.id} className="text-xs bg-indigo-100 text-indigo-700 p-1.5 rounded-md font-medium truncate border border-indigo-200" title={event.description}>
                          {new Date(event.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {event.title}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}