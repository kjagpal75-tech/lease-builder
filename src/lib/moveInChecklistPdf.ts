import { Property, MoveInChecklistItem, Attachment } from '@/types/lease';

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface ChecklistFeatures {
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  garage: boolean;
  basement: boolean;
  fireplace: boolean;
  deck: boolean;
  pool: boolean;
}

/** Render a fill-in line: shows the saved value when present, otherwise a blank rule */
function fillLine(label: string, value?: string): string {
  return `
    <div class="meta-cell">
      <span class="meta-label">${escapeHtml(label)}</span>
      <span class="meta-value">${value ? escapeHtml(value) : '&nbsp;'}</span>
    </div>`;
}

/** Build one pen-friendly checklist row (Condition / Item / Comments) */
function buildItemRow(item: MoveInChecklistItem, explanations: Record<string, string>): string {
  const note = explanations[item.id] && explanations[item.id].trim() ? explanations[item.id].trim() : '';
  const hasIssue = !item.checked;
  const okBox = item.checked
    ? '<span class="box box-checked">X</span>'
    : '<span class="box"></span>';
  const issueBox = hasIssue && note
    ? '<span class="box box-checked">X</span>'
    : '<span class="box"></span>';

  const prefill = note
    ? `<div class="note-prefill">${escapeHtml(note)}</div>`
    : '';

  return `
            <tr>
              <td class="col-status">
                <div class="status-line"><span class="status-box">${okBox}</span><span class="status-text">OK</span></div>
                <div class="status-line"><span class="status-box">${issueBox}</span><span class="status-text">ISSUE</span></div>
              </td>
              <td class="col-item">${escapeHtml(item.item)}</td>
              <td class="col-note">
                ${prefill}
                <div class="rule"></div>
                <div class="rule"></div>
              </td>
            </tr>`;
}

/** Optional per-room labels used to disambiguate bedrooms and bathrooms in the checklist. */
interface RoomLabels {
  bedrooms: string[];
  bathrooms: string[];
}

/** Generate a pen-friendly Move-In Condition Report (industry standard layout) */
export const generateMoveInChecklistHTML = (
  property: Property,
  features: ChecklistFeatures,
  items: MoveInChecklistItem[],
  explanations: Record<string, string>,
  attachments: Attachment[],
  roomLabels?: RoomLabels
): string => {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Honor property features set in Lease Review page
  // Use || (not ??) so 0/undefined both fall through to features
  const derivedFeatures: ChecklistFeatures = {
    bedrooms: property.bedrooms || features.bedrooms || 0,
    bathrooms: property.bathrooms || features.bathrooms || 0,
    kitchen: property.kitchen || features.kitchen || false,
    garage: property.garage || features.garage || false,
    basement: property.basement || features.basement || false,
    fireplace: property.fireplace || features.fireplace || false,
    deck: property.deck || features.deck || false,
    pool: property.pool || features.pool || false,
  };

  // Group items by category (preserves insertion order)
  const itemsByCategory: Record<string, MoveInChecklistItem[]> = {};
  items.forEach(item => {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  });

  const sections = Object.entries(itemsByCategory)
    .map(([category, catItems]) => `
      <div class="section">
        <div class="section-title">${escapeHtml(category.toUpperCase())}</div>
        <table class="checklist">
          <thead>
            <tr>
              <th class="col-status">Condition</th>
              <th class="col-item">Item</th>
              <th class="col-note">Comments / Issues Noted (describe damage, condition, or repairs needed)</th>
            </tr>
          </thead>
          <tbody>
            ${catItems.map(item => buildItemRow(item, explanations)).join('')}
          </tbody>
        </table>
      </div>`)
    .join('');

  const attachmentList = attachments.length
    ? attachments
        .map(att => `<li>${escapeHtml(att.title || att.filename)}</li>`)
        .join('')
    : '<li class="empty">&nbsp;</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Move-In Condition Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }

    .sheet {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.4in;
    }

    /* ---------- Document header ---------- */
    .doc-header {
      text-align: center;
      border-bottom: 2.5pt solid #000;
      padding-bottom: 6pt;
      margin-bottom: 10pt;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 1pt;
      text-transform: uppercase;
    }
    .doc-subtitle {
      font-size: 9pt;
      margin-top: 2pt;
    }

    /* ---------- Property / party information ---------- */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
    }
    .meta-row > td {
      width: 50%;
      border: 0.75pt solid #000;
      padding: 3pt 5pt;
      vertical-align: top;
    }
    .meta-cell {
      display: block;
      min-height: 15pt;
    }
    .meta-label {
      display: block;
      font-size: 7.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    .meta-value {
      display: block;
      min-height: 13pt;
      border-bottom: 0.75pt solid #000;
      font-size: 10pt;
    }

    /* ---------- Legend ---------- */
    .legend {
      border: 0.75pt solid #000;
      padding: 5pt 7pt;
      margin-bottom: 10pt;
      font-size: 8.5pt;
    }
    .legend-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8pt;
      margin-bottom: 3pt;
    }
    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 18pt;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4pt;
    }

    /* ---------- Checklist tables ---------- */
    .section {
      margin-bottom: 10pt;
      page-break-inside: auto;
    }
    .section-title {
      background: #000;
      color: #fff;
      font-weight: bold;
      font-size: 9.5pt;
      letter-spacing: 0.6pt;
      padding: 3pt 6pt;
      text-transform: uppercase;
    }
    table.checklist {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.checklist th {
      border: 0.75pt solid #000;
      border-top: none;
      padding: 3pt 4pt;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
      text-align: left;
      background: #ededed;
    }
    table.checklist td {
      border: 0.75pt solid #000;
      padding: 3pt 4pt;
      vertical-align: top;
    }
    .col-status { width: 0.85in; }
    .col-item   { width: 2.65in; }
    .col-note   { width: auto; }

    .status-line {
      display: flex;
      align-items: center;
      gap: 3pt;
      line-height: 1.15;
    }
    .status-box {
      display: inline-block;
      width: 9pt;
      height: 9pt;
    }
    .box {
      display: inline-block;
      width: 9pt;
      height: 9pt;
      border: 1pt solid #000;
      text-align: center;
      font-size: 7.5pt;
      font-weight: bold;
      line-height: 9pt;
    }
    .box-checked {
      background: #000;
      color: #fff;
    }
    .status-text {
      font-size: 7.5pt;
      font-weight: bold;
      letter-spacing: 0.2pt;
    }
    .col-item {
      font-size: 9pt;
    }
    .note-prefill {
      font-size: 8.5pt;
      font-style: italic;
      margin-bottom: 2pt;
    }
    .rule {
      height: 13pt;
      border-bottom: 0.75pt solid #666;
    }

    /* ---------- Meter readings / key handover ---------- */
    .block-title {
      background: #000;
      color: #fff;
      font-weight: bold;
      font-size: 9.5pt;
      letter-spacing: 0.6pt;
      padding: 3pt 6pt;
      text-transform: uppercase;
      margin-bottom: 0;
    }
    table.grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10pt;
    }
    table.grid th, table.grid td {
      border: 0.75pt solid #000;
      padding: 3pt 5pt;
      font-size: 9pt;
      text-align: left;
    }
    table.grid th {
      width: 1.6in;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
      background: #ededed;
    }
    .write-in {
      display: block;
      min-height: 14pt;
    }

    /* ---------- Signatures ---------- */
    .signature-block {
      margin-top: 12pt;
      page-break-inside: avoid;
    }
    .sig-row {
      display: flex;
      gap: 18pt;
      margin-top: 14pt;
    }
    .sig-party {
      flex: 1;
    }
    .sig-role {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
      margin-bottom: 2pt;
    }
    .sig-line {
      border-bottom: 0.75pt solid #000;
      height: 20pt;
      margin-bottom: 1pt;
    }
    .sig-caption {
      font-size: 7.5pt;
    }
    .attestation {
      font-size: 8.5pt;
      margin-bottom: 6pt;
    }

    /* ---------- Photo log ---------- */
    .photo-log td {
      height: 52pt;
    }

    .footer-note {
      margin-top: 10pt;
      border-top: 0.75pt solid #000;
      padding-top: 4pt;
      font-size: 7.5pt;
      text-align: center;
    }

    @page {
      size: letter portrait;
      margin: 0.45in;
    }
    @media print {
      body { background: #fff; }
      .sheet { max-width: none; padding: 0; }
      table.checklist thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="sheet">

    <div class="doc-header">
      <div class="doc-title">Move-In Condition Report</div>
      <div class="doc-subtitle">Residential Rental Property Condition Record &amp; Inventory</div>
    </div>

    <table class="meta-table">
      <tr class="meta-row">
        <td>
          ${fillLine('Property Address', property.address)}
          ${fillLine('Unit / Apt #', property.unitNumber)}
        </td>
        <td>
          ${fillLine('City / State / ZIP', [property.city, property.state, property.zipCode].filter(Boolean).join(' '))}
          ${fillLine('Inspection Date', today)}
        </td>
      </tr>
      <tr class="meta-row">
        <td>
          ${fillLine('Landlord / Property Manager')}
          ${fillLine('Tenant(s)')}
        </td>
        <td>
          ${fillLine('Move-In Date')}
          ${fillLine('Lease Term Starts')}
        </td>
      </tr>
    </table>

    <div class="legend">
      <div class="legend-title">How to Complete This Form</div>
      <div class="legend-items">
        <div class="legend-item"><span class="box"></span><span>Inspected &mdash; good condition (OK)</span></div>
        <div class="legend-item"><span class="box"></span><span>Issue found &mdash; describe in the Comments column</span></div>
        <div class="legend-item"><span class="box"></span><span>Not applicable to this property</span></div>
      </div>
    </div>

    ${sections}

    <div class="section">
      <div class="block-title">Utility Meter Readings at Move-In</div>
      <table class="grid">
        <tr><th>Water Meter</th><td><span class="write-in"></span></td><th style="width:1.6in">Electric Meter</th><td><span class="write-in"></span></td></tr>
        <tr><th>Gas Meter</th><td><span class="write-in"></span></td><th style="width:1.6in">Other</th><td><span class="write-in"></span></td></tr>
      </table>
    </div>

    <div class="section">
      <div class="block-title">Keys, Remotes &amp; Accessories Issued</div>
      <table class="grid">
        <tr><th>Item</th><td><span class="write-in"></span></td><th style="width:1.6in">Number / Description</th><td><span class="write-in"></span></td></tr>
        <tr><th>Issued To</th><td><span class="write-in"></span></td><th style="width:1.6in">Date Issued</th><td><span class="write-in"></span></td></tr>
      </table>
    </div>

    <div class="section">
      <div class="block-title">Attachments / Photos</div>
      <table class="grid">
        <tr><th>Attached Documents</th><td><ul class="attachment-list">${attachmentList}</ul></td></tr>
      </table>
      <table class="grid photo-log">
        <tr><th>Photo Log (item / room)</th><td></td><th style="width:1.6in">Photo Log (item / room)</th><td></td></tr>
        <tr><th>Photo Log (item / room)</th><td></td><th style="width:1.6in">Photo Log (item / room)</th><td></td></tr>
      </table>
    </div>

    <div class="signature-block">
      <div class="block-title">Signatures</div>
      <p class="attestation">The undersigned acknowledge that the premises have been inspected and that this report accurately reflects the condition of the property at move-in. Any item marked as an issue is documented in the comments column above.</p>
      <div class="sig-row">
        <div class="sig-party">
          <div class="sig-role">Landlord / Property Manager</div>
          <div class="sig-line"></div>
          <div class="sig-caption">Signature</div>
          <div class="sig-line" style="margin-top:8pt;"></div>
          <div class="sig-caption">Printed Name</div>
          <div class="sig-line" style="margin-top:8pt;"></div>
          <div class="sig-caption">Date</div>
        </div>
        <div class="sig-party">
          <div class="sig-role">Tenant(s)</div>
          <div class="sig-line"></div>
          <div class="sig-caption">Signature</div>
          <div class="sig-line" style="margin-top:8pt;"></div>
          <div class="sig-caption">Printed Name</div>
          <div class="sig-line" style="margin-top:8pt;"></div>
          <div class="sig-caption">Date</div>
        </div>
      </div>
    </div>

    <div class="footer-note">
      Move-In Condition Report &bull; ${escapeHtml(property.address || '')} &bull; Generated ${escapeHtml(today)}
    </div>

  </div>
</body>
</html>`;
};

/** Open the move-in condition report in a new window for PDF preview */
export const previewMoveInChecklistPDF = (
  property: Property,
  features: ChecklistFeatures,
  items: MoveInChecklistItem[],
  explanations: Record<string, string>,
  attachments: Attachment[],
  roomLabels?: RoomLabels
): void => {
  const htmlContent = generateMoveInChecklistHTML(property, features, items, explanations, attachments, roomLabels);

  const printWindow = window.open('', '_blank', 'width=850,height=1000,popup=yes');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };
};
