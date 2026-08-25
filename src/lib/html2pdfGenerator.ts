import { LeaseDocument } from '@/types/lease';
import { generateLeaseText } from './leaseTemplate';
import { formatLocalDate, totalMonthlyUtilityReimbursement, totalMonthlyRent } from './storage';

export const generateLeaseHTML = (lease: LeaseDocument): string => {
  // Get the lease text
  const leaseText = generateLeaseText(lease);

  // Convert plain text to HTML with proper formatting
  const htmlContent = leaseText
    .split('\n')
    .map(line => {
      // Section headers: "1. " pattern with ALL CAPS title (main sections only)
      const isSectionHeader = /^\s*\d+\.\s+[A-Z][A-Z\s\/\-]+/.test(line);
      
      // Subsections: "1) " pattern (numbered list items within sections)
      const isSubsection = /^\s*\d+\)\s/.test(line);
      
      if (isSectionHeader) {
        // Bold and indent section headers
        return `<div class="section-header">${escapeHtml(line)}</div>`;
      } else if (isSubsection) {
        // Indent subsections more
        return `<div class="subsection">${escapeHtml(line)}</div>`;
      } else if (line.trim() === '') {
        // Empty lines
        return '<div class="spacer"></div>';
      } else {
        // Regular text - preserve indentation
        return `<div class="text-line">${escapeHtml(line)}</div>`;
      }
    })
    .join('');

  // Create the full HTML document
  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Calibri', 'Helvetica', 'Arial', sans-serif;
          font-size: 10px;
          line-height: 1.4;
          color: #000;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
   .title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      font-family: 'Calibri', sans-serif;
    }
        .section-header {
          font-weight: bold;
          margin-top: 8px;
          margin-bottom: 4px;
          font-family: 'Calibri', sans-serif;
        }
        .subsection {
          margin-bottom: 2px;
          font-weight: bold;
          font-family: 'Calibri', sans-serif;
        }
        .text-line {
          margin-bottom: 2px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .spacer {
          height: 4px;
        }
        .signatures {
          margin-top: 20px;
          page-break-before: always;
        }
        .legal-notice {
          margin-top: 20px;
          page-break-before: always;
          font-style: italic;
          font-size: 9px;
        }
        u {
          text-decoration: underline;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="title">RESIDENTIAL LEASE AGREEMENT</div>
      ${htmlContent}
    </body>
    </html>
  `;

  return fullHTML;
};

export const generateProfessionalLeaseHTML = (lease: LeaseDocument): string => {
  const { landlords, tenants, coSigners, property, terms } = lease;
  const today = formatLocalDate(new Date().toISOString().slice(0, 10));
  const start = terms.startDate ? formatLocalDate(terms.startDate) : '';
  const end = terms.endDate ? formatLocalDate(terms.endDate) : '';

  // Build landlord info with full details matching preview
  const landlordInfo = landlords.map((l, i) => `
    <li><strong>${i + 1}. ${l.name}</strong></li>
    <li>${l.address}</li>
    <li>Phone: ${l.phone} | Email: ${l.email}</li>
    ${i < landlords.length - 1 ? '<li style="margin-top:6px;"></li>' : ''}
  `).join('');

  // Build tenant info with full details matching preview
  const tenantInfo = tenants.map((t, i) => `
    <li><strong>${i + 1}. ${t.name}</strong> (${t.phone})</li>
  `).join('');

  // Co-signer block matching preview exactly
  const coSignerBlock = coSigners && coSigners.length > 0 ? `
    <div class="card">
      <div class="card-title">Co-Signer / Guarantor</div>
      <ul class="info-list">
        <li><strong>${coSigners[0].name}</strong> &bull; ${coSigners[0].address} &bull; Phone: ${coSigners[0].phone} &bull; Email: ${coSigners[0].email}</li>
      </ul>
      <div style="font-size: 8.5pt; color: #4a5568; margin-top: 6px; text-align: justify;">
        <strong>Co-Signer Guarantee & Responsibilities (Nevada Revised Statutes):</strong> The co-signer unconditionally guarantees the full and timely performance of all tenant obligations under this Lease, including rent, fees, and damages. Held jointly and severally liable; liability extends to full term and renewals unless released in writing. Landlord may pursue remedies directly against co-signer without first exhausting tenant remedies.
      </div>
    </div>
  ` : '';

  // Pet block matching preview exactly
  const petBlock = terms.petsAllowed ? `
    <h2>${property.state === 'NV' ? '8' : '7'}. Pet Policy Addendum</h2>
    <div class="highlight-box">
      <strong>Permitted Pets:</strong><br>
      &bull; <strong>Pet 1:</strong> Dog | Basset Hound / Beagle Mix | Count: 1 | Age: 6<br>
      &bull; <strong>Pet 2:</strong> Cat | Orange Tabby | Count: 1 | Age: 10<br>
      <strong>Refundable Pet Deposit:</strong> <strong>$1,000.00</strong> (Held under NRS 118A.242. Total combined deposits do not exceed statutory limit of 3 months' rent). ($500/pet × 2 pets)
    </div>
    <h3>Tenant Pet Responsibilities & Rules</h3>
    <ol>
      <li><strong>Control & Sanitation:</strong> Must be leashed outdoors. Immediate waste disposal in trash receptacles required.</li>
      <li><strong>Flooring Protection:</strong> Premises features premium hard-surface wood-style flooring. Protective area rugs/runners must be placed in high-traffic pathways and pet resting areas. 100% waterproof mats required under food/water bowls and litter boxes.</li>
      <li><strong>Immediate Spill Remediation:</strong> Liquid spills/accidents must be wiped immediately. Standing liquid causing floor warping/seam swelling constitutes damage beyond normal wear and tear.</li>
      <li><strong>Maintenance:</strong> Claws/nails must be kept trimmed. Only pH-neutral hard-surface floor cleaners permitted (no harsh solvents/bleach).</li>
      <li><strong>Assistance Animals:</strong> Verified service and emotional support animals are exempt from pet deposits/fees (NRS 118.105), though tenants remain liable for physical damage.</li>
      <li><strong>Violations:</strong> Breach of pet policy allows issuance of Nevada 5-Day Notice to Cure or Quit, leading to formal eviction proceedings if uncured.</li>
    </ol>
  ` : '';

  // Build signature table matching preview exactly - dynamic based on actual data
  const sigRows = [];
  landlords.forEach((l, i) => sigRows.push({ label: `LANDLORD ${i + 1}`, name: l.name }));
  tenants.forEach((t, i) => sigRows.push({ label: `TENANT ${i + 1}`, name: t.name }));
  if (coSigners && coSigners.length > 0) {
    sigRows.push({ label: 'CO-SIGNER', name: coSigners[0].name });
  }

  // Build signature table rows (2 per row)
  let sigTable = '<table class="sig-container">';
  for (let i = 0; i < sigRows.length; i += 2) {
    sigTable += '<tr>';
    sigTable += `<td class="sig-block"><div class="sig-line"></div><div class="sig-label">${sigRows[i].label}: ${sigRows[i].name}</div><div style="font-size: 8pt; color: #718096;">Date: ________________________</div></td>`;
    if (i + 1 < sigRows.length) {
      sigTable += `<td class="sig-block"><div class="sig-line"></div><div class="sig-label">${sigRows[i + 1].label}: ${sigRows[i + 1].name}</div><div style="font-size: 8pt; color: #718096;">Date: ________________________</div></td>`;
    } else {
      sigTable += '<td class="sig-block"></td>';
    }
    sigTable += '</tr>';
  }
  sigTable += '</table>';

  // Nevada-specific sections
  const nevadaSections = property.state === 'NV' ? `
    <h2>4. Lease Terms & Conditions</h2>
    <p><strong>Use of Premises:</strong> Solely as a private residence complying with all laws and regulations.</p>
    <p><strong>Maintenance & Landlord Entry:</strong> Tenant shall maintain clean and sanitary conditions. Landlord may enter with 24-hour notice for inspections/repairs/showings, or without notice in emergencies.</p>
    <h2>5. Default and Remedies</h2>
    <div class="card">
      <h3>A. Event of Default</h3>
      <p>Tenant shall be deemed in material default of this Lease Agreement if: 1) Tenant fails to pay Rent, utility reimbursements, or any other financial obligation within the timelines specified herein; or 2) Tenant, authorized occupants, or guests violate any material covenant, condition, or rule of this Lease Agreement, including the attached Pet Policy Addendum.</p>
      
      <h3>B. Landlord's Remedies</h3>
      <p>Upon the occurrence of an Event of Default, Landlord may pursue all legal and equitable remedies available to recover physical possession of the premises and documented actual damages. In accordance with Nevada summary eviction proceedings, Landlord's remedies are governed by the following strict statutory notice tracks:</p>
      <ul>
        <li><strong>Non-Payment of Rent:</strong> Landlord shall serve a written 7-Day Notice to Pay or Quit pursuant to NRS 40.2512.</li>
        <li><strong>Curable Lease Violations:</strong> For non-monetary breaches, Landlord shall serve a written 5-Day Notice to Perform Lease Condition or Quit pursuant to NRS 40.2516.</li>
        <li><strong>Non-Curable Violations:</strong> For severe structural property waste, illegal activity, or recurring nuisances, Landlord shall serve a written 3-Day Notice to Quit pursuant to NRS 40.2514.</li>
      </ul>
      
      <h3>C. Attorney's Fees</h3>
      <p>In compliance with NRS 118A.220(1)(c), if either party brings a formal legal action to enforce or interpret the terms of this Lease Agreement, the court may award reasonable attorney's fees and actual litigation costs strictly to the prevailing party.</p>
    </div>

    <h2>6. Governing Law and Severability</h2>
    <div class="card">
      <h3>A. Choice of Law</h3>
      <p>This Lease Agreement, along with all incorporated addendums, disclosures, and subsequent modifications, shall be governed by, construed, and enforced strictly in accordance with the laws of the State of Nevada.</p>
      
      <h3>B. Venue Selection</h3>
      <p>Any judicial or summary eviction dispute arising directly under this lease framework shall be subject to the exclusive jurisdiction of the Justice Court in the specific county where the rental property is physically located.</p>
      
      <h3>C. Severability</h3>
      <p>If any clause, provision, or statutory reference within this Lease is found to be void, illegal, or legally unenforceable under Nevada law (including NRS Chapter 118A), such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remainder of the Lease shall remain in full force and effect.</p>
    </div>

    <h2>7. Nevada Specific Provisions & Required Disclosures</h2>
    <ul>
      <li><strong>NRS Chapter 118A Compliance:</strong> Complies fully with Nevada landlord-tenant laws. Free copy of signed lease and inventory/condition record provided.</li>
      <li><strong>Nuisance Provision (NRS 202.470 / 118A.200):</strong> Nuisance/disturbances strictly prohibited (misdemeanor under NV law). Reports can be submitted to Landlord in writing.</li>
      <li><strong>Emergency Contact:</strong> Landlord provides local emergency contact info within 60 miles (NRS 118A.260).</li>
      <li><strong>Flag Display:</strong> Tenants retain right to display US Flag per NRS 118A.325.</li>
      <li><strong>Foreclosure Disclosure (NRS 118A.275):</strong> Landlord discloses property is NOT currently subject to foreclosure proceedings.</li>
    </ul>
  ` : `
    <h2>4. Lease Terms & Conditions</h2>
    <p><strong>Use of Premises:</strong> Solely as a private residence complying with all laws and regulations.</p>
    <p><strong>Maintenance & Landlord Entry:</strong> Tenant shall maintain clean and sanitary conditions. Landlord may enter with 24-hour notice for inspections/repairs/showings, or without notice in emergencies.</p>
    <h2>5. Default and Remedies</h2>
    <p><strong>Event of Default:</strong> Tenant shall be in default if rent is not paid within 5 days of due date, or if any lease term is violated.</p>
    <p><strong>Landlord's Remedies:</strong> Landlord may terminate lease, pursue eviction, and seek damages. Attorney's fees may be awarded to prevailing party.</p>
    <h2>6. Governing Law and Severability</h2>
    <p><strong>Choice of Law:</strong> This Lease shall be governed by the laws of the State of ${property.state === 'CA' ? 'California' : 'Nevada'}.</p>
    <p><strong>Severability:</strong> If any provision is invalid, remaining provisions remain in full force.</p>
  `;

  // Utility companies based on location
  const utilityCompanies = property.city === 'Truckee' ? `
    <tr><th>Tahoe Public Utility District (Electric)</th><td>(530) 587-3896 &bull; www.tdpud.org</td></tr>
    <tr><th>Truckee Donner PUD (Water)</th><td>(530) 587-3896 &bull; www.tdpud.org</td></tr>
    <tr><th>Southwest Gas (Gas)</th><td>(877) 860-6020 &bull; www.swgas.com</td></tr>
    <tr><th>Tahoe Truckee Sierra Disposal (Trash)</th><td>(530) 583-7800 &bull; www.tahoetruckeesierradisposal.com</td></tr>
    <tr><th>Spectrum / AT&T (Internet)</th><td>Spectrum: (833) 267-6094 | AT&T: (800) 288-2020</td></tr>
  ` : `
    <tr><th>NV Energy (Electric & Gas)</th><td>(775) 834-4444 &bull; www.nvenergy.com</td></tr>
    <tr><th>Truckee Meadows Water Authority</th><td>(775) 834-8080 &bull; www.tmwa.com</td></tr>
    <tr><th>Waste Management (Trash)</th><td>(775) 329-8822 &bull; www.wm.com</td></tr>
    <tr><th>Spectrum / AT&T (Internet)</th><td>Spectrum: (833) 267-6094 | AT&T: (800) 288-2020</td></tr>
  `;

  const utilityLocation = property.city === 'Truckee' ? 'Truckee, CA' : 'Reno, NV';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Residential Lease Agreement</title>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #e2e8f0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        /* Document container: applies margins on ALL sides in the browser preview */
        .page-container {
            max-width: 800px;
            margin: 30px auto;
            padding: 25px;
            background-color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Print: reset container so it fills the page cleanly */
        @media print {
            body {
                background-color: #ffffff;
            }
            .page-container {
                max-width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }
            @page {
                size: A4;
                margin: 18mm 15mm;
            }
        }

        /* Header Banner */
        .header {
            background-color: #1a365d;
            color: #ffffff;
            margin: -25px -25px 20px -25px;
            padding: 22px 25px;
            border-bottom: 4px solid #2b6cb0;
        }

        .header h1 {
            margin: 0;
            font-size: 18pt;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .header .subtitle {
            margin-top: 5px;
            font-size: 9.5pt;
            color: #cbd5e0;
            letter-spacing: 0.3px;
        }

        /* Section Headings */
        h2 {
            color: #1a365d;
            font-size: 11pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 10px;
            page-break-after: avoid;
        }

        h3 {
            color: #2b6cb0;
            font-size: 10pt;
            font-weight: 700;
            margin-top: 12px;
            margin-bottom: 6px;
            page-break-after: avoid;
        }

        p {
            margin-top: 0;
            margin-bottom: 8px;
            text-align: justify;
            font-size: 9.5pt;
            color: #2d3748;
            line-height: 1.45;
        }

        /* Two-Column Grid */
        .grid-2 {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .grid-2 td {
            vertical-align: top;
            width: 50%;
            padding: 0 6px;
        }

        .grid-2 td:first-child {
            padding-left: 0;
        }

        .grid-2 td:last-child {
            padding-right: 0;
        }

        /* Card & Highlight Boxes */
        .card {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px 12px;
            margin-bottom: 10px;
        }

        .card-title {
            font-weight: bold;
            color: #2c5282;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 6px;
            border-bottom: 1px solid #edf2f7;
            padding-bottom: 3px;
        }

        .info-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .info-list li {
            margin-bottom: 3px;
            font-size: 9pt;
        }

        .info-list strong {
            color: #4a5568;
        }

        .highlight-box {
            background-color: #ebf8ff;
            border-left: 3px solid #3182ce;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 9pt;
        }

        /* Data Tables */
        .table-summary {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .table-summary th, .table-summary td {
            padding: 6px 10px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9pt;
        }

        .table-summary th {
            background-color: #edf2f7;
            color: #2d3748;
            font-weight: bold;
            width: 35%;
        }

        .table-summary td {
            background-color: #ffffff;
        }

        ol, ul {
            margin-top: 4px;
            margin-bottom: 10px;
            padding-left: 20px;
            font-size: 9pt;
        }

        li {
            margin-bottom: 4px;
        }

        /* Signature Grid */
        .sig-container {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: avoid;
        }

        .sig-block {
            width: 48%;
            vertical-align: top;
            padding: 8px 0;
        }

        .sig-line {
            border-bottom: 1px solid #4a5568;
            margin-top: 30px;
            margin-bottom: 4px;
            width: 90%;
        }

        .sig-label {
            font-size: 8.5pt;
            color: #4a5568;
            font-weight: bold;
        }

        .legal-notice {
            background-color: #f7fafc;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            padding: 10px 12px;
            font-size: 8pt;
            color: #4a5568;
            margin-top: 15px;
            page-break-inside: avoid;
        }

        .legal-notice h4 {
            margin: 0 0 4px 0;
            color: #2d3748;
            font-size: 8.5pt;
            text-transform: uppercase;
        }

        .legal-notice ul {
            margin: 4px 0;
            padding-left: 15px;
        }
    </style>
</head>
<body>

    <div class="page-container">

        <div class="header">
            <h1>Residential Lease Agreement</h1>
            <div class="subtitle">State of ${property.state}</div>
        </div>

        <table class="grid-2">
            <tr>
                <td>
                    <div class="card">
                        <div class="card-title">Landlords</div>
                        <ul class="info-list">
                            ${landlordInfo}
                        </ul>
                    </div>
                </td>
                <td>
                    <div class="card">
                        <div class="card-title">Tenants</div>
                        <ul class="info-list">
                            ${tenantInfo}
                        </ul>
                    </div>
                </td>
            </tr>
        </table>

        ${coSignerBlock}

        <h2>1. Property Description & Lease Term</h2>
        <table class="table-summary">
            <tr>
                <th>Property Address</th>
                <td>${property.address}, ${property.city}, ${property.state} ${property.zipCode}</td>
            </tr>
            <tr>
                <th>Property Type</th>
                <td>${property.type}</td>
            </tr>
            <tr>
                <th>Lease Term</th>
                <td><strong>${start}</strong> to <strong>${end}</strong></td>
            </tr>
        </table>

        <h2>2. Financial Terms</h2>
        <h3>Rent</h3>
        <table class="table-summary">
            <tr>
                <th>Monthly Rent</th>
                <td><strong>$${totalMonthlyRent(terms).toFixed(2) || '0.00'}</strong> per month, due on the ${terms.rentDueDay || 1}${terms.rentDueDay === 1 ? 'st' : terms.rentDueDay === 2 ? 'nd' : terms.rentDueDay === 3 ? 'rd' : 'th'} day of each month.</td>
            </tr>
            <tr>
                <th>Base Rent</th>
                <td><strong>$${terms.monthlyRent?.toFixed(2) || '0.00'}</strong> per month</td>
            </tr>
            ${totalMonthlyUtilityReimbursement(terms) > 0 ? `
            <tr>
                <th>Utility Reimbursements</th>
                <td><strong>$${totalMonthlyUtilityReimbursement(terms).toFixed(2)}</strong> per month (added to rent)</td>
            </tr>
            ` : ''}
        </table>

        <h3>Move-In Deposits and Fees</h3>
        <table class="table-summary">
            <tr>
                <th>Security Deposit</th>
                <td><strong>$${terms.securityDeposit?.toFixed(2) || '0.00'}</strong> (Returned within 30 days of move-out per ${property.state === 'NV' ? 'NRS law' : 'CA Civil Code'}, less legal deductions).</td>
            </tr>
            ${terms.petsAllowed && terms.petDeposit ? `
            <tr>
                <th>Pet Deposit</th>
                <td><strong>$${terms.petDeposit?.toFixed(2) || '0.00'}</strong> ${property.state === 'NV' ? '(Held under NRS 118A.242)' : '(Refundable pet deposit)'}.</td>
            </tr>
            ` : ''}
            <tr>
                <th>Total Move-In Cost</th>
                <td><strong>$${((terms.securityDeposit || 0) + ((terms.petsAllowed && terms.petDeposit) ? terms.petDeposit : 0)).toFixed(2)}</strong> (Security Deposit${terms.petsAllowed && terms.petDeposit ? ' + Pet Deposit' : ''})</td>
            </tr>
        </table>

        <h3>Late Fees & Other Charges</h3>
        <table class="table-summary">
            <tr>
                <th>Late Fee</th>
                <td><strong>5% of base rent ($${(terms.monthlyRent ? terms.monthlyRent * 0.05 : 0).toFixed(2)})</strong>, imposed after at least ${property.state === 'NV' ? '3' : '5'} calendar days grace period ${property.state === 'NV' ? '(NRS 118A.210)' : '(CA Civil Code § 1671)'}. Non-compounding.</td>
            </tr>
            <tr>
                <th>Returned Check Fee</th>
                <td><strong>$${terms.returnedCheckFee?.toFixed(2) || (property.state === 'NV' ? '25.00' : '30.00')}</strong> for any check returned unpaid / dishonored ${property.state === 'NV' ? '(NRS 118A.200)' : '(CA Civil Code § 1719)'}.</td>
            </tr>
        </table>

        <h2>3. Occupants & Utilities</h2>
        <p><strong>Authorized Occupants:</strong> ${tenants.map(t => t.name).join(', ')}.</p>

        <table class="table-summary">
            <tr>
                <th>Tenant Direct Responsibility</th>
                <td>Water, Garbage, Electricity, Gas, Internet, Cable TV</td>
            </tr>
            <tr>
                <th>Landlord Paid & Tenant Reimbursed</th>
                <td><strong>Sewer ($61.00/month)</strong> — Added to monthly rent; remains in Landlord's account.</td>
            </tr>
            <tr>
                <th>Included in Rent (No Charge)</th>
                <td>None</td>
            </tr>
        </table>

        ${nevadaSections}

        ${petBlock}

        <h2>${property.state === 'NV' ? '9' : '8'}. Utility Company Reference Addendum (${utilityLocation})</h2>
        <table class="table-summary">
            ${utilityCompanies}
        </table>

        <h2>${property.state === 'NV' ? '10' : '9'}. Signatures & Execution</h2>
        <p>IN WITNESS WHEREOF, the parties have executed this Lease as of ________________________.</p>

        ${sigTable}

        <div class="legal-notice">
            <h4>Legal & Digital Signature Notice</h4>
            This document was generated electronically and contains digital signature frameworks. Digital signatures are legally binding in California and Nevada under the Electronic Signatures in Global and National Commerce Act (E-SIGN) and the Uniform Electronic Transactions Act (UETA).
            <ul>
                <li>Signature records include timestamp, IP address, user agent, and signature image audit trails.</li>
            </ul>
        </div>

    </div>

</body>
</html>`;
};

function parseLeaseText(text: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';
  sections[currentSection] = [];
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Check for main section headers (e.g., "1. PROPERTY DESCRIPTION")
    const sectionMatch = line.match(/^\s*(\d+)\.\s+([A-Z][A-Z\s\/\-]+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[2].trim();
      sections[currentSection] = [];
      sections[currentSection].push(line);
      continue;
    }
    
    // Check for subsections (e.g., "A. LANDLORD AND TENANT OBLIGATIONS")
    const subsectionMatch = line.match(/^\s*([A-Z])\.\s+([A-Z][A-Z\s\/\-]+)/);
    if (subsectionMatch) {
      currentSection = subsectionMatch[2].trim();
      sections[currentSection] = [];
      sections[currentSection].push(line);
      continue;
    }
    
    sections[currentSection].push(line);
  }
  
  return sections;
}

function buildProfessionalHTML(lease: LeaseDocument, sections: Record<string, string[]>): string {
  const { landlords, tenants, property, terms } = lease;
  const today = new Date().toLocaleDateString();
  
  // Build landlord info
  const landlordInfo = landlords.map((landlord, index) => `
    <div class="info-item">
      <span class="info-label">LANDLORD${landlords.length > 1 ? ` ${index + 1}` : ''}</span>
      <div class="info-value">
        <strong>${escapeHtml(landlord.name)}</strong><br>
        ${escapeHtml(landlord.address)}<br>
        Phone: ${escapeHtml(landlord.phone)}<br>
        Email: ${escapeHtml(landlord.email)}
      </div>
    </div>
  `).join('');
  
  // Build tenant info
  const tenantInfo = tenants.map((tenant, index) => `
    <div class="info-item">
      <span class="info-label">TENANT${tenants.length > 1 ? ` ${index + 1}` : ''}</span>
      <div class="info-value">
        <strong>${escapeHtml(tenant.name)}</strong><br>
        ${escapeHtml(tenant.address)}<br>
        Phone: ${escapeHtml(tenant.phone)}<br>
        Email: ${escapeHtml(tenant.email)}
      </div>
    </div>
  `).join('');
  
  // Build the content from sections
  let contentHTML = '';
  
  // Add the intro text
  contentHTML += `
    <div class="text-line">THIS RESIDENTIAL LEASE AGREEMENT ("Lease") is made and entered into on 
    <span class="emphasis">${today}</span> by and between:</div>
    <div class="spacer"></div>
    <div class="info-row">${landlordInfo}</div>
    <div class="spacer"></div>
    <div class="text-line" style="text-align: center; font-weight: 600;">AND</div>
    <div class="spacer"></div>
    <div class="info-row">${tenantInfo}</div>
  `;
  
  // Process each section
  for (const [sectionName, lines] of Object.entries(sections)) {
    if (sectionName === 'header') continue;
    
    contentHTML += `<div class="section"><div class="section-header">${escapeHtml(sectionName)}</div>`;
    
    for (const line of lines) {
      // Skip the original section header line (e.g., "1. PROPERTY DESCRIPTION") since we already added it as the section header
      if (line.match(/^\s*\d+\.\s+[A-Z][A-Z\s\/\-]+$/)) {
        continue;
      }
      
      if (line.trim() === '') {
        contentHTML += '<div class="spacer"></div>';
      } else if (line.match(/^\s*[A-Z]\.\s+[A-Z]/)) {
        // Subsection like "A. LANDLORD AND TENANT OBLIGATIONS"
        contentHTML += `<div class="subsection">${escapeHtml(line)}</div>`;
      } else if (line.match(/^\s*\d+\)\s/)) {
        // Numbered list items
        contentHTML += `<div class="subsection">${escapeHtml(line)}</div>`;
      } else {
        contentHTML += `<div class="text-line">${escapeHtml(line)}</div>`;
      }
    }
    
    contentHTML += '</div>';
  }
  
  // Add signatures section
  contentHTML += `
    <div class="signatures">
      <div class="witness-block">
        <div class="witness-text">Signed this _____ day of ________________, ${new Date().getFullYear()}.</div>
      </div>
      
      ${landlords.map((landlord, index) => {
        const signature = lease.landlordSignatures?.[index];
        return `
          <div class="signature-block">
            <span class="signature-label">LANDLORD${landlords.length > 1 ? ` ${index + 1}` : ''} SIGNATURE</span>
            <input type="text" class="signature-line" value="${signature ? 'SIGNED' : ''}" readonly>
            <div style="margin-top: 4px;">
              <span class="info-label">Name:</span> ${escapeHtml(landlord.name)}<br>
              <span class="info-label">Date:</span> ${signature ? formatLocalDate(signature.date) : '_________________________'}
            </div>
          </div>
        `;
      }).join('')}
      
      ${tenants.map((tenant, index) => {
        const signature = lease.tenantSignatures?.[index];
        return `
          <div class="signature-block">
            <span class="signature-label">TENANT${tenants.length > 1 ? ` ${index + 1}` : ''} SIGNATURE</span>
            <input type="text" class="signature-line" value="${signature ? 'SIGNED' : ''}" readonly>
            <div style="margin-top: 4px;">
              <span class="info-label">Name:</span> ${escapeHtml(tenant.name)}<br>
              <span class="info-label">Date:</span> ${signature ? formatLocalDate(signature.date) : '_________________________'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    
    <div class="legal-notice">
      This document is a legal agreement. Please review carefully before signing. A copy of this Lease shall be provided to the Tenant free of charge within 3 business days of execution. This agreement is subject to the landlord-tenant laws of the State of ${property.state}.
    </div>
  `;
  
  // Full HTML with professional styling
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lease Preview - ${property.address}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=DM+Sans:wght@400;600&display=swap');
        
        :root {
          --primary-color: #1a3a5c;
          --secondary-color: #2c5f8a;
          --accent-color: #c0392b;
          --light-gray: #f8f9fa;
          --medium-gray: #6c757d;
          --dark-gray: #343a40;
          --white: #ffffff;
          --border-color: #dee2e6;
        }

        @font-face {
          font-family: 'Libre Baskerville', serif;
          src: local('Libre Baskerville'), local('LibreBaskerville-Regular');
        }

        @font-face {
          font-family: 'DM Sans', sans-serif;
          src: local('DM Sans'), local('DMSans-Regular');
        }

        body {
          font-family: 'DM Sans', 'Calibri', 'Helvetica', 'Arial', sans-serif;
          font-size: 11px;
          color: var(--dark-gray);
          background: var(--light-gray);
          margin: 0;
          padding: 20px;
          line-height: 1.5;
        }

        .page {
          min-height: 11in;
          width: 8.5in;
          background: var(--white);
          margin: 0 auto;
          padding: 36px 40px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          position: relative;
        }

        .page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--primary-color);
          border-radius: 0 0 8px 8px;
          z-index: 1;
        }

        @media print {
          body { background: white; }
          .page { break-inside: avoid; margin: 0; padding: 36px 40px; box-shadow: none; }
        }

        .header-block {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--primary-color);
        }

        .title {
          font-family: 'Libre Baskerville', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--primary-color);
          margin: 0 0 8px 0;
          letter-spacing: 0.5px;
        }

        .subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--medium-gray);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 10px;
        }

        .info-item {
          flex: 1;
          margin: 0 8px;
        }

        .info-label {
          display: block;
          font-size: 8px;
          color: var(--medium-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .info-value {
          font-size: 10px;
          color: var(--dark-gray);
        }

        .section {
          margin-top: 24px;
          margin-bottom: 16px;
        }

        .section-header {
          font-family: 'Libre Baskerville', serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border-color);
          text-transform: uppercase;
          letter-spacing: 0.3em;
        }

        .subsection {
          font-size: 10.5px;
          margin-bottom: 6px;
          padding-left: 12px;
          border-left: 2px solid var(--primary-color);
        }

        .text-line {
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .emphasis {
          font-weight: 600;
        }

        .important {
          color: var(--accent-color);
          font-weight: 600;
        }

        .spacer {
          height: 8px;
        }

        .divider {
          height: 1px;
          background: var(--border-color);
          margin: 16px 0;
        }

        .signatures {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .signature-block {
          margin-bottom: 20px;
        }

        .signature-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: var(--medium-gray);
          margin-bottom: 4px;
          display: block;
        }

        .signature-line {
          width: 100%;
          height: 28px;
          border: none;
          border-bottom: 1px solid var(--border-color);
          background: transparent;
          font-size: 10px;
        }

        .legal-notice {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed var(--border-color);
          font-size: 8.5px;
          color: var(--medium-gray);
          font-style: italic;
          line-height: 1.3;
        }

        .disclosure {
          font-size: 9px;
          color: var(--medium-gray);
          margin: 8px 0;
        }

        .disclosure strong {
          color: var(--dark-gray);
        }

        .addendum-section {
          margin-top: 20px;
          padding: 16px;
          background: #fafafa;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }

        .addendum-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 12px;
        }

        .utility-company {
          font-size: 9.5px;
          margin: 4px 0;
        }

        .witness-block {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .witness-text {
          font-size: 10px;
          color: var(--medium-gray);
          margin-bottom: 12px;
        }

        @page {
          size: letter;
          margin: 36px 40px 0 40px;
        }

        @media print {
          .page {
            margin: 0;
            box-shadow: none;
            border: none;
            border-radius: 0;
          }
          .page::before {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header-block">
          <div class="title">RESIDENTIAL LEASE AGREEMENT</div>
          <div class="subtitle">CONTRACT FOR LEASE OF REAL PROPERTY</div>
        </div>

        <div id="content">
          ${contentHTML}
        </div>
      </div>
    </body>
    </html>
  `;
}

export const generateHTML2PDF = async (lease: LeaseDocument): Promise<Blob> => {
  // Dynamically import html2pdf.js to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  // Generate HTML using the professional template that matches the preview design
  const htmlContent = generateProfessionalLeaseHTML(lease);

  // Create a temporary element for html2pdf to process
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '0'; tempDiv.style.top = '0'; tempDiv.style.width = '800px'; tempDiv.style.pointerEvents = 'none';
  tempDiv.style.opacity = '0';
  document.body.appendChild(tempDiv);

  try {
    // Generate PDF using html2pdf.js with settings matching the preview template
    const pdfDoc = await html2pdf()
      .from(tempDiv)
      .set({
        margin: [0, 0, 0, 0],
        filename: `lease-agreement-${lease.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          logging: false
        },
      })
      .toPdf()
      .get('pdf');

    const pdf = pdfDoc.output('blob');
    return pdf;
  } finally {
    // Clean up the temporary element
    document.body.removeChild(tempDiv);
  }
};

export const previewHTML2PDF = async (lease: LeaseDocument) => {
  try {
    const pdfBlob = await generateHTML2PDF(lease);
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error previewing PDF with html2pdf:', error);
    throw new Error('Failed to preview PDF');
  }
};

export const downloadHTML2PDF = async (lease: LeaseDocument, filename?: string) => {
  try {
    const pdfBlob = await generateHTML2PDF(lease);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `lease-agreement-${lease.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF with html2pdf:', error);
    throw new Error('Failed to download PDF');
  }
};

// Helper function to escape HTML characters, preserving <u> and </u> tags
function escapeHtml(text: string): string {
  // Split on <u> and </u> tags, escape the text segments, and rejoin
  const parts = text.split(/(<\/?u>)/);
  const map: { [key: string]: string } = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  return parts.map(part => {
    if (part === '<u>' || part === '</u>') {
      return part; // Keep the tag as-is
    }
    return part.replace(/[&<>"']/g, (m) => map[m]);
  }).join('');
}