/**
 * Lightweight client-side iCalendar (.ics) parser.
 */
export function parseIcsCalendar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const events = [];
        const lines = text.split(/\r?\n/);
        
        let currentEvent = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
          } else if (line === 'END:VEVENT' && currentEvent) {
            if (currentEvent.date && currentEvent.title) {
              // Heuristically classify type based on title
              const lowerTitle = currentEvent.title.toLowerCase();
              let type = 'event';
              if (
                lowerTitle.includes('holiday') ||
                lowerTitle.includes('vacation') ||
                lowerTitle.includes('break') ||
                lowerTitle.includes('closed') ||
                lowerTitle.includes('off')
              ) {
                type = 'holiday';
              } else if (
                lowerTitle.includes('exam') ||
                lowerTitle.includes('test') ||
                lowerTitle.includes('ese') ||
                lowerTitle.includes('midterm') ||
                lowerTitle.includes('practical')
              ) {
                type = 'exam';
              }

              events.push({
                id: Math.random().toString(36).substr(2, 9),
                title: currentEvent.title,
                date: currentEvent.date,
                type: type,
                semesters: [] // General by default
              });
            }
            currentEvent = null;
          } else if (currentEvent) {
            // Find key-value split
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              const keyPart = line.substring(0, colonIndex);
              const val = line.substring(colonIndex + 1);
              
              if (keyPart.startsWith('SUMMARY')) {
                currentEvent.title = val;
              } else if (keyPart.startsWith('DTSTART')) {
                // DTSTART can be DTSTART;VALUE=DATE:20260815 or DTSTART:20260815T090000Z
                // We extract the pure date section
                const rawDate = val.split('T')[0];
                if (rawDate && rawDate.length >= 8) {
                  const y = rawDate.substring(0, 4);
                  const m = rawDate.substring(4, 6);
                  const d = rawDate.substring(6, 8);
                  currentEvent.date = `${y}-${m}-${d}`;
                }
              }
            }
          }
        }
        resolve(events.sort((a, b) => new Date(a.date) - new Date(b.date)));
      } catch (err) {
        console.error("ICS parsing error:", err);
        reject(new Error("Failed to parse ICS file. Please check if it is a valid iCalendar format."));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
