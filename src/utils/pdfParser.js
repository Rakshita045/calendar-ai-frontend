import { parseAcademicText } from './textHeuristics';

/**
 * Extracts text page-by-page from a PDF file using the CDN-loaded PDF.js library.
 * Passes the accumulated text to the text heuristic parser.
 */
export async function parsePdfCalendar(file, defaultYear = new Date().getFullYear()) {
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    throw new Error("PDF.js library is not loaded. Please make sure you are online and refresh the page.");
  }

  // Set the worker source path to the CDN matching the script tag
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Reconstruct lines based on y-coordinate grouping (transform[5] is the Y coordinate)
          // Sort items first by Y descending (top-to-bottom), then by X ascending (left-to-right)
          const items = [...textContent.items].sort((a, b) => {
            const yA = a.transform[5];
            const yB = b.transform[5];
            if (Math.abs(yA - yB) < 5) {
              return a.transform[4] - b.transform[4]; // X coordinate
            }
            return yB - yA; // Y coordinate descending
          });

          let pageText = '';
          let lastY = null;

          for (const item of items) {
            const y = item.transform[5];
            if (lastY !== null && Math.abs(y - lastY) >= 8) {
              pageText += '\n';
            } else if (pageText !== '' && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            pageText += item.str;
            lastY = y;
          }

          fullText += pageText + '\n';
        }

        const parsedEvents = parseAcademicText(fullText, defaultYear);
        resolve(parsedEvents);
      } catch (error) {
        console.error("PDF Parsing error:", error);
        reject(new Error("Failed to parse PDF content. Please make sure it is a readable text PDF, or try pasting the calendar text manually."));
      }
    };
    reader.onerror = function(err) {
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
}
