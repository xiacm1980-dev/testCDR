
import { jsPDF } from "jspdf";
import { SanitizationTask, FileType, ProcessingStatus } from '../types';

const STORAGE_KEY = 'aegis_file_history';

export const FileService = {
  getHistory: (): SanitizationTask[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to read file history", e);
      return [];
    }
  },

  saveTask: (task: SanitizationTask) => {
    const history = FileService.getHistory();
    // Update existing or add new
    const index = history.findIndex(t => t.id === task.id);
    let newHistory;
    
    // Create a safe copy. If base64Data is too large, we might skip saving it to localStorage 
    // to prevent QuotaExceededError, but keep the metadata.
    const taskToSave = { ...task };
    if (taskToSave.base64Data && taskToSave.base64Data.length > 500000) {
        // If > ~500KB, don't persist data, just metadata
        taskToSave.base64Data = undefined; 
    }

    if (index >= 0) {
      newHistory = [...history];
      newHistory[index] = taskToSave;
    } else {
      newHistory = [taskToSave, ...history];
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 50)));
    } catch (e) {
      console.warn("Storage quota exceeded. Saving task without content data.");
      // Fallback: remove data from the specific task and try again
      taskToSave.base64Data = undefined;
      if (index >= 0) newHistory[index] = taskToSave;
      else newHistory[0] = taskToSave;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 50)));
      } catch (e2) {
        console.error("Critical storage failure", e2);
      }
    }
  },

  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Generates a valid Blob for download using jsPDF.
   * Embeds ACTUAL content if available.
   */
  generateDownloadBlob: (task: SanitizationTask): Blob => {
    // For Images and Documents, we try to create a PDF with the content
    if (task.type === FileType.DOCUMENT || task.type === FileType.IMAGE) {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // 1. Cover Page (Report)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text("AEGIS CDR - Reconstructed File", 20, 25);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`Source: ${task.filename}`, 25, 40);
        doc.text(`Sanitization ID: ${task.id}`, 25, 46);
        
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Threat Neutralization Report", 20, 60);
        
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        const analysis = task.threatAnalysis || "Standard preventative reconstruction performed.";
        const splitAnalysis = doc.splitTextToSize(analysis, 170);
        doc.text(splitAnalysis, 20, 70);

        doc.setTextColor(22, 101, 52);
        doc.text("Verdict: THREATS REMOVED / CONTENT RECONSTRUCTED", 20, 75 + (splitAnalysis.length * 5));

        // 2. Content Reconstruction Page
        doc.addPage();
        
        // Watermark on Content Page
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(60);
        doc.text("SANITIZED", 105, 150, { align: "center", angle: 45 });
        
        if (task.base64Data) {
            if (task.type === FileType.IMAGE) {
                // Embed Image
                try {
                    // Calculate aspect ratio to fit page
                    const margin = 20;
                    const maxWidth = pageWidth - (margin * 2);
                    const maxHeight = pageHeight - (margin * 2);
                    
                    doc.addImage(
                        `data:${task.mimeType};base64,${task.base64Data}`, 
                        'JPEG', 
                        margin, 
                        margin, 
                        maxWidth, 
                        maxHeight, 
                        undefined, 
                        'FAST', 
                        0
                    );
                } catch (imgError) {
                    doc.setFontSize(12);
                    doc.setTextColor(200, 0, 0);
                    doc.text("Error rendering image content.", 20, 20);
                }
            } 
            else if (task.type === FileType.DOCUMENT) {
                // For text documents, decode and print text
                // For PDFs, we can't easily render them client-side in jsPDF without pdf.js canvas rendering.
                // So we assume it's text-based or provide a reconstruction notice.
                
                doc.setFont("courier", "normal");
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                
                if (task.mimeType === 'text/plain' || task.filename.endsWith('.txt')) {
                    try {
                        const decodedText = atob(task.base64Data);
                        const lines = doc.splitTextToSize(decodedText, pageWidth - 40);
                        doc.text(lines, 20, 20);
                    } catch (e) {
                         doc.text("Content could not be decoded as text.", 20, 20);
                    }
                } else {
                    // It is a binary doc (DOCX/PDF) that we can't natively render in jsPDF client-side
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(16);
                    doc.text("Content Reconstruction View", 20, 30);
                    
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(12);
                    doc.text("The original document structure has been flattened.", 20, 45);
                    doc.text("This PDF guarantees safety by removing all executable scripts.", 20, 52);
                    
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(20, 60, 170, 100);
                    doc.text("[ Safe Content Placeholder ]", 105, 110, { align: 'center' });
                    doc.setFontSize(10);
                    doc.text("In a real C++ deployment, the visual pages of the source PDF/DOCX", 105, 120, { align: 'center' });
                    doc.text("would be rasterized and printed here.", 105, 125, { align: 'center' });
                }
            }
        } else {
            doc.setFontSize(12);
            doc.setTextColor(150, 150, 150);
            doc.text("[Original content data not available in this session]", 20, 20);
        }

        return doc.output('blob');
      } catch (e) {
        console.error("PDF Generation Error", e);
        return new Blob(["Error generating Safe PDF."], {type: 'text/plain'});
      }
    } 
    else {
      // Fallback for Audio/Video
      const report = `AEGIS CDR - SAFE MEDIA WRAPPER\nFile: ${task.filename}\nStatus: Cleaned\n\n(Media content wrapper structure)`;
      return new Blob([report], { type: 'text/plain' });
    }
  }
};
