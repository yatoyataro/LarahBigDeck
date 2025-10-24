import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Convert DOCX buffer to PDF buffer (server-side compatible)
 * @param buffer - The DOCX file as Buffer
 * @returns Promise<Buffer> - The converted PDF as Buffer
 */
export async function convertDocxToPdf(buffer: Buffer): Promise<Buffer> {
  try {
    console.log('Converting DOCX to PDF, input size:', buffer.length, 'bytes');
    
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    let text = result.value;
    
    console.log('Extracted text length:', text.length, 'characters');
    
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
    
    if (!text || text.length === 0) {
      throw new Error('No text could be extracted from the DOCX file');
    }
    
    console.log('Text cleaned and normalized');
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const margin = 50;
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPosition = height - margin;
    
    console.log('PDF document created, page size:', width, 'x', height);
    
    // Split text into lines that fit the page width
    const maxWidth = width - (2 * margin);
    const words = text.split(' ');
    let currentLine = '';
    let lineCount = 0;
    
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
          lineCount++;
        } catch (drawError) {
          console.warn('Skipping line due to encoding error:', currentLine.substring(0, 50));
        }
        
        yPosition -= lineHeight;
        currentLine = word;
        
        // Add new page if needed
        if (yPosition < margin) {
          page = pdfDoc.addPage();
          yPosition = height - margin;
          console.log('Added new page, total lines so far:', lineCount);
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
        lineCount++;
      } catch (drawError) {
        console.warn('Skipping last line due to encoding error:', currentLine.substring(0, 50));
      }
    }
    
    console.log('PDF generation complete, total lines:', lineCount, 'pages:', pdfDoc.getPageCount());
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    console.log('PDF saved, output size:', pdfBytes.length, 'bytes');
    
    // Return as Buffer
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('DOCX to PDF conversion error:', error);
    throw new Error(`Failed to convert DOCX to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert PPTX buffer to PDF buffer (placeholder - not fully implemented)
 * PPTX conversion is complex and would require additional libraries
 * For now, we'll just throw an error suggesting manual conversion
 */
export async function convertPptxToPdf(buffer: Buffer): Promise<Buffer> {
  throw new Error('PPTX to PDF conversion is not yet implemented. Please convert your PowerPoint to PDF manually before uploading.');
}
