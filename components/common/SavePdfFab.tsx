import React from 'react';
import { DocumentArrowDownIcon } from '../Icons.js';

// Declare html2canvas and jspdf from global scope (loaded via CDN)
// Fix: Added html2canvas to the global Window interface for TypeScript.
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

interface SavePdfFabProps {
  targetId: string;
  screenName: string;
}

const SavePdfFab: React.FC<SavePdfFabProps> = ({ targetId, screenName }) => {
  const handleSavePdf = async () => {
    if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
      alert('PDF generation library is still loading. Please try again in a moment.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const targetElement = document.getElementById(targetId);
    
    if (!targetElement) {
      console.error('Target element for PDF capture not found');
      return;
    }

    // Add a class to the body to hide FABs during capture
    document.body.classList.add('is-capturing-pdf');

    try {
      // Fix: Use window.html2canvas as it's a global from a CDN.
      const canvas = await window.html2canvas(targetElement, {
        scale: 2, // Improve resolution
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        // Use dimensions from canvas to prevent cropping
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${screenName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Sorry, there was an error generating the PDF.");
    } finally {
        // Remove the class after capture is complete
        document.body.classList.remove('is-capturing-pdf');
    }
  };

  return (
    <button
      onClick={handleSavePdf}
      className="fixed bottom-[130px] right-4 bg-gradient-to-br from-slate-700 to-slate-800 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-slate-400 z-10 fab-to-hide"
      aria-label="Save as PDF"
    >
      <DocumentArrowDownIcon className="h-7 w-7" />
    </button>
  );
};

export default SavePdfFab;