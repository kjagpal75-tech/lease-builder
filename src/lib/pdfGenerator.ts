import jsPDF from 'jspdf';
import { LeaseDocument } from '@/types/lease';
import { generateLeaseText } from './leaseTemplate';

export const generatePDF = async (lease: LeaseDocument): Promise<Blob> => {
  const doc = new jsPDF();
  const leaseText = generateLeaseText(lease);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RESIDENTIAL LEASE AGREEMENT', 105, 20, { align: 'center' });
  
  // Reset font for body
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Add lease content
  const lines = doc.splitTextToSize(leaseText, 160);
  let yPosition = 35;
  const lineHeight = 5;
  const pageHeight = 270;
  
  lines.forEach((line: string) => {
    if (yPosition > pageHeight) {
      doc.addPage();
      yPosition = 20;
    }
    // Parse **bold** markers and render word-by-word with justify
    const segments = line.split('**');
    let xPos = 18;
    segments.forEach((segment, idx) => {
      const isBold = idx % 2 === 1;
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const words = segment.split(' ');
      words.forEach((word, wIdx) => {
        if (word) {
          doc.text(word, xPos, yPosition);
          xPos += doc.getTextWidth(word) + (wIdx < words.length - 1 ? 2 : 0);
        }
      });
      if (idx < segments.length - 1) {
        xPos += 2;
      }
    });
    yPosition += lineHeight;
  });
  
  // Footer with page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  // Add signature images if they exist
  if ((lease.landlordSignatures && lease.landlordSignatures.length > 0) || (lease.tenantSignatures && lease.tenantSignatures.length > 0)) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Add all landlord signatures
    if (lease.landlordSignatures && lease.landlordSignatures.length > 0) {
      lease.landlordSignatures.forEach((signature, index) => {
        const landlord = lease.landlords[index];
        if (landlord) {
          doc.text(`Landlord${lease.landlords.length > 1 ? ` ${index + 1}` : ''}: ${landlord.name}`, 15, yPosition);
          yPosition += 10;
          
          // Add signature image
          try {
            const imgWidth = 80;
            const imgHeight = 40;
            doc.addImage(signature.signatureData, 'PNG', 15, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
            
            doc.text(`Signed: ${new Date(signature.date).toLocaleString()}`, 15, yPosition);
            yPosition += 6;
            doc.text(`IP Address: ${signature.ipAddress}`, 15, yPosition);
            yPosition += 15;
          } catch (error) {
            console.error('Error adding landlord signature image:', error);
          }
        }
      });
    }
    
    // Add all tenant signatures
    if (lease.tenantSignatures && lease.tenantSignatures.length > 0) {
      lease.tenantSignatures.forEach((signature, index) => {
        const tenant = lease.tenants[index];
        if (tenant) {
          doc.text(`Tenant${lease.tenants.length > 1 ? ` ${index + 1}` : ''}: ${tenant.name}`, 15, yPosition);
          yPosition += 10;
          
          // Add signature image
          try {
            const imgWidth = 80;
            const imgHeight = 40;
            doc.addImage(signature.signatureData, 'PNG', 15, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
            
            doc.text(`Signed: ${new Date(signature.date).toLocaleString()}`, 15, yPosition);
            yPosition += 6;
            doc.text(`IP Address: ${signature.ipAddress}`, 15, yPosition);
            yPosition += 15;
          } catch (error) {
            console.error('Error adding tenant signature image:', error);
          }
        }
      });
    }
  }

  // Add legal notice
  doc.addPage();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('LEGAL NOTICE:', 15, 20);
  doc.setFont('helvetica', 'normal');
  
  const noticeText = [
    'This document was generated electronically and contains digital signatures.',
    'Digital signatures are legally binding in both California and Nevada when properly implemented',
    'with appropriate audit trails, as is the case with this document.',
    '',
    'The signature records include:',
    '- Timestamp of when the signature was applied',
    '- IP address of the signatory',
    '- Browser user agent information',
    '- The actual signature image',
    '',
    'These audit trail elements help establish the authenticity and integrity of the signatures',
    'under the Electronic Signatures in Global and National Commerce Act (E-SIGN) and the',
    'Uniform Electronic Transactions Act (UETA), both of which California and Nevada have adopted.',
    '',
    'This document is provided for informational purposes only and does not constitute legal advice.',
    'Both parties should consult with legal counsel to ensure this lease agreement complies with',
    'all applicable laws and regulations.'
  ];
  
  yPosition = 30;
  noticeText.forEach(line => {
    doc.text(line, 15, yPosition);
    yPosition += 6;
  });

  return doc.output('blob');
};

export const previewPDF = async (lease: LeaseDocument) => {
  try {
    const pdfBlob = await generatePDF(lease);
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw new Error('Failed to preview PDF');
  }
};

export const downloadPDF = async (lease: LeaseDocument, filename?: string) => {
  try {
    const pdfBlob = await generatePDF(lease);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `lease-agreement-${lease.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};