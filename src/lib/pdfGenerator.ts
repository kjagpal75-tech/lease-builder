import { LeaseDocument } from '@/types/lease';
import { generateProfessionalLeaseHTML } from './html2pdfGenerator';

/** Sanitize string for use in filename - remove/replace invalid characters */
function sanitizeFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s\-_,]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/** Generate filename for PDF based on property address */
export function generatePDFFilename(lease: LeaseDocument): string {
  const address = lease.property.address || 'Unknown_Address';
  const sanitizedAddress = sanitizeFilename(address);
  return `Lease_Agreement_${sanitizedAddress}.pdf`;
}

export const generatePDF = async (lease: LeaseDocument, filename?: string): Promise<void> => {
  // Generate the professional HTML template (same as HTML preview)
  const htmlContent = generateProfessionalLeaseHTML(lease);
  
  // Use provided filename or generate one based on address
  const pdfFilename = filename || generatePDFFilename(lease);

  // Open the HTML in a new window with print styles for PDF generation
  const printWindow = window.open('', '_blank', 'width=800,height=900,popup=yes');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  // Write the HTML content with print-optimized styles
  // The document title will be used as the suggested filename when saving as PDF
  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${pdfFilename.replace('.pdf', '')}</title>
      <style>
        @media print {
          body { 
            margin: 0; 
            padding: 0; 
            background: white;
          }
          .page-container {
            max-width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  printWindow.document.close();

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
};

export const previewPDF = async (lease: LeaseDocument) => {
  try {
    await generatePDF(lease);
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw new Error('Failed to preview PDF');
  }
};

export const downloadPDF = async (lease: LeaseDocument, filename?: string) => {
  try {
    // Use the address-based filename when downloading
    const pdfFilename = filename || generatePDFFilename(lease);
    await generatePDF(lease, pdfFilename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to download PDF');
  }
};