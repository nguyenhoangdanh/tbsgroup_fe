import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// This is a helper file to provide TypeScript support for jsPDF with autotable

// Define the extension of jsPDF for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export type WorkLogTypesCast = {}; // Empty type, just to make the file importable