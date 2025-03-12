"use client";

// Import pdfMake with specific fonts configuration
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configure the virtual file system (VFS) for pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Define full font configuration
pdfMake.fonts = {
  // Keep Roboto as the default font with explicit paths to all styles
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

export default pdfMake;