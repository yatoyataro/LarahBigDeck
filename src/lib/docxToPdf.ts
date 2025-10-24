import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function convertDocxToPdf(file: File): Promise<Blob> {
  try {
    // Read the DOCX file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer });
    let text = result.value;
    
    // Clean text: Replace problematic characters and normalize
    text = text
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular apostrophe
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to regular quotes
      .replace(/\u2013/g, '-') // En dash to hyphen
      .replace(/\u2014/g, '--') // Em dash to double hyphen
      .replace(/\u2026/g, '...') // Ellipsis to three dots
      .replace(/[\u0080-\uFFFF]/g, '') // Remove other non-ASCII characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const margin = 50;
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - margin;
    
    // Split text into lines that fit the page width
    const maxWidth = width - (2 * margin);
    const words = text.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth > maxWidth && currentLine) {
        // Draw the current line with error handling
        try {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        } catch (drawError) {
          console.warn('Skipping line due to encoding error:', currentLine);
        }
        
        yPosition -= lineHeight;
        currentLine = word;
        
        // Add new page if needed
        if (yPosition < margin) {
          page = pdfDoc.addPage();
          yPosition = height - margin;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    // Draw the last line
    if (currentLine) {
      try {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      } catch (drawError) {
        console.warn('Skipping last line due to encoding error:', currentLine);
      }
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to Blob (cast to any to avoid TypeScript issues)
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  } catch (error) {
    console.error('DOCX to PDF conversion error:', error);
    throw new Error('Failed to convert DOCX to PDF. The document may contain unsupported characters or formatting.');
  }
}
