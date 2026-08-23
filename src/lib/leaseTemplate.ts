import { LeaseDocument, defaultDisclosureFlags } from '@/types/lease';
import { formatDisclosuresForLease, getStateSpecificClauses } from './stateRequirements';
import { totalLeasePetRent, totalPetCount, formatLocalDate } from './storage';

export const generateLeaseText = (lease: LeaseDocument): string => {
  const {
    landlords,
    tenants,
    coSigners,
    property,
    terms,
    landlordSignatures,
    tenantSignatures,
    coSignerSignatures,
  } = lease;

  const normalizedProperty = {
    ...property,
    disclosureFlags: {
      ...defaultDisclosureFlags(),
      ...(property.disclosureFlags || {}),
    },
  };

  const stateClauses = getStateSpecificClauses(normalizedProperty.state);
  const disclosuresSection = formatDisclosuresForLease(normalizedProperty);

  const landlordText = landlords.map((landlord, index) => 
    `LANDLORD${landlords.length > 1 ? ` ${index + 1}` : ''}: ${landlord.name}
${landlord.address}
Phone: ${landlord.phone}
Email: ${landlord.email}`
  ).join('\n\n');

  const tenantText = tenants.map((tenant, index) => 
    `TENANT${tenants.length > 1 ? ` ${index + 1}` : ''}: ${tenant.name}
${tenant.address}
Phone: ${tenant.phone}
Email: ${tenant.email}`
  ).join('\n\n');

  const leaseText = `
RESIDENTIAL LEASE AGREEMENT

THIS RESIDENTIAL LEASE AGREEMENT ("Lease") is made and entered into on ${new Date().toLocaleDateString()} by and between:

${landlordText}

AND

${tenantText}

${coSigners && coSigners.length > 0 ? `
CO-SIGNER / GUARANTOR
The following co-signer(s) guarantee the obligations of the Tenant(s) under this Lease and agree to be jointly and severally liable with the Tenant(s) for all obligations, including but not limited to payment of rent, damages, and any other amounts due under this Lease, to the extent permitted by applicable law.

${coSigners.map((coSigner, index) => 
  `CO-SIGNER ${coSigners.length > 1 ? index + 1 : ''}: ${coSigner.name}
${coSigner.address}
Phone: ${coSigner.phone}
Email: ${coSigner.email}
${coSigner.relationship ? `Relationship to Tenant: ${coSigner.relationship}` : ''}`
).join('\n\n')}

CO-SIGNER RESPONSIBILITIES (Per Applicable Rental Laws)
The co-signer acknowledges and agrees to the following responsibilities under applicable state rental laws (${property.state === 'CA' ? 'California Civil Code' : 'Nevada Revised Statutes'}):
1. The co-signer guarantees the full and timely performance of all obligations of the Tenant(s) under this Lease, including payment of all rent, fees, and charges.
2. The co-signer may be held jointly and severally liable with the Tenant(s) for any breach of this Lease, including non-payment of rent, property damage beyond normal wear and tear, and any other amounts owed.
3. The co-signer's liability extends to the full term of the Lease and any renewals or extensions, unless released in writing by the Landlord.
4. The co-signer agrees that the Landlord may pursue remedies against the co-signer without first exhausting remedies against the Tenant(s), to the extent permitted by applicable law.
5. The co-signer acknowledges receipt of a copy of this Lease and understands the obligations being guaranteed.
6. This guarantee is unconditional and irrevocable, except as may be required by applicable law, and shall survive any modification of the Lease terms unless the co-signer is specifically released in writing.

` : ''}

1. PROPERTY DESCRIPTION
Property Address:
${property.address}
${property.city}, ${property.state} ${property.zipCode}
${property.unitNumber ? `Unit: ${property.unitNumber}` : ''}
Property Type:
${property.type}
Year Built:
${property.yearBuilt || 'N/A'}

2. TERM OF LEASE
The term of this Lease shall begin on ${formatLocalDate(terms.startDate)} and end on ${formatLocalDate(terms.endDate)}.

3. RENT
${
  (terms.paymentSchedule || 'monthly') === 'prepaid'
    ? `This is a seasonal / prepaid lease. Tenant agrees to pay Landlord the total sum of $${(terms.totalRent ?? 0).toFixed(2)} as rent for the entire Lease term ("Rent").
The full Rent is due in advance on or before ${formatLocalDate(terms.prepaidDueDate || terms.startDate)}, and covers occupancy for the full term from ${formatLocalDate(terms.startDate)} through ${formatLocalDate(terms.endDate)}. No additional monthly rent installments are due during the term unless otherwise agreed in writing.
${terms.petsAllowed && terms.petRent && totalPetCount(terms) > 0 ? `The total Rent of $${(terms.totalRent ?? 0).toFixed(2)} consists of base rent $${((terms.totalRent ?? 0) - totalLeasePetRent(terms)).toFixed(2)} plus pet rent $${totalLeasePetRent(terms).toFixed(2)} ($${(terms.petRent || 0).toFixed(2)} per pet per month × ${totalPetCount(terms)} pet(s) over the lease term).` : ''}
${terms.monthlyRent > 0 ? `For reference and statutory deposit calculations, the monthly rent equivalent is $${terms.monthlyRent.toFixed(2)}.` : ''}
${terms.lateFeePercent || terms.lateFee ? `Late Fee: ${terms.lateFeePercent ?? ''}% of the applicable rent${terms.lateFee ? ` ($${terms.lateFee.toFixed(2)})` : ''} if the prepaid Rent is not received by the due date above${property.state === 'NV' ? ', and not earlier than 3 calendar days after that due date (NRS 118A.210)' : ' (Civil Code § 1671 — reasonable late fee)'}.` : ''}`
    : `Tenant agrees to pay Landlord the sum of $${terms.monthlyRent.toFixed(2)} per month ("Rent").
Rent is due on the ${terms.rentDueDay}${getOrdinalSuffix(terms.rentDueDay)} day of each month.
${terms.lateFeePercent || terms.lateFee ? `Late Fee: ${terms.lateFeePercent ?? ''}% of the periodic rent${terms.lateFee ? ` ($${terms.lateFee.toFixed(2)})` : ''}${
  property.state === 'NV'
    ? `, which shall not exceed 5% of the periodic rent and shall not be imposed until at least 3 calendar days after the rent due date (NRS 118A.210). Late fees shall not compound.`
    : ` if rent is not received when due. This late fee is intended as a reasonable estimate of Landlord's damages under Civil Code § 1671 and shall not exceed 5% of the periodic rent.`
}` : ''}`
}
${
  terms.returnedCheckFee
    ? property.state === 'CA'
      ? `Returned Check Fee: $${terms.returnedCheckFee.toFixed(2)} for the first check returned for insufficient funds, and $${(terms.returnedCheckFeeSubsequent ?? 35).toFixed(2)} for each subsequent returned check (Civil Code § 1719).`
      : `Returned Check Fee: $${terms.returnedCheckFee.toFixed(2)} for any check returned unpaid / dishonored (NRS 118A.200).`
    : ''
}

${
  terms.holdingDeposit && terms.holdingDeposit > 0
    ? `4. HOLDING / RESERVATION DEPOSIT
To secure this tenancy before the Lease start date, Tenant shall pay Landlord a holding deposit of $${terms.holdingDeposit.toFixed(2)} (the "Holding Deposit"), due on or before ${terms.holdingDepositDueDate ? formatLocalDate(terms.holdingDepositDueDate) : new Date().toLocaleDateString()}.
Upon Tenant taking occupancy and commencing the Lease term, the Holding Deposit shall be ${
        terms.holdingDepositApplication === 'credit_security'
          ? 'credited toward the Security Deposit'
          : terms.holdingDepositApplication === 'credit_rent_then_security'
            ? 'credited first toward Rent, with any remainder credited toward the Security Deposit'
            : 'credited toward Rent'
      } due under this Lease.
${
  terms.holdingDepositForfeitedIfTenantCancels !== false
    ? 'If Tenant cancels this Lease, fails to pay remaining sums when due, or fails to take occupancy on the start date for any reason other than Landlord\'s material default, Landlord may retain the Holding Deposit as liquidated damages for holding the premises off the market, and Tenant shall have no further right to occupy the premises. The parties agree this amount is a reasonable pre-estimate of Landlord\'s damages and is not a penalty.'
    : 'If Tenant cancels this Lease or fails to take occupancy, Landlord shall refund the Holding Deposit within the time required by applicable law, less any documented costs Landlord is legally entitled to deduct.'
}
If Landlord fails to deliver possession of the premises as required by this Lease, Landlord shall refund the Holding Deposit in full within the time required by applicable law.
The Holding Deposit is separate from the Security Deposit until credited as stated above. This provision does not increase the maximum security deposit permitted by law beyond the Security Deposit amount stated in this Lease once credits are applied.

`
    : ''
}${
  terms.holdingDeposit && terms.holdingDeposit > 0 ? '5' : '4'
}. SECURITY DEPOSIT
Tenant shall deposit with Landlord the sum of $${terms.securityDeposit.toFixed(2)} as security for the faithful performance of the terms of this Lease.
This deposit shall be returned within the time required by ${property.state === 'CA' ? 'California (21 days)' : 'Nevada (30 days)'} law, less any deductions for damages beyond normal wear and tear.

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '6' : '5'}. OCCUPANTS
The premises may be occupied by no more than the following persons:
${tenants.map((tenant, i) => `${i + 1}. ${tenant.name} (Tenant)`).join('\n')}
${terms.occupants.length > 0 && terms.occupants[0] ? terms.occupants.map((occupant, i) => `${tenants.length + i + 1}. ${occupant}`).join('\n') : ''}

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '7' : '6'}. PETS
${
  terms.petsAllowed
    ? `Pets are permitted upon this property as follows:
${
  (terms.pets || []).length > 0
    ? (terms.pets || []).map((p) => `- ${p.count} × ${p.type}`).join('\n')
    : '- Pet types/counts to be approved by Landlord in writing'
}
Total approved pets: ${totalPetCount(terms)}
Pet Deposit: $${(terms.petDeposit || 0).toFixed(2)} (total)
Pet Rent: $${(terms.petRent || 0).toFixed(2)} per pet per month
Total Pet Rent: $${totalPetCount(terms) > 0 && terms.petRent ? (terms.petRent * totalPetCount(terms)).toFixed(2) : '0.00'} per month${terms.paymentSchedule === 'prepaid' ? ` ($${totalLeasePetRent(terms).toFixed(2)} for full lease term)` : ''}
Additional pets require prior written consent from Landlord. Unauthorized pets are a material breach of this Lease.`
    : 'No pets are permitted on the property without prior written consent from Landlord.'
}

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '8' : '7'}. UTILITIES AND SERVICES
Included with Rent (Landlord Paid — No Charge):
${terms.utilitiesIncluded.length > 0 ? terms.utilitiesIncluded.map(u => `- ${u}`).join('\n') : 'None'}

Tenant Responsibility (Direct to Utility Company):
${terms.utilitiesTenantResponsible.length > 0 ? terms.utilitiesTenantResponsible.map(u => `- ${u}`).join('\n') : 'None'}

Landlord-Paid / Tenant-Reimbursed (Added to Rent):
${(terms.utilitiesReimbursed || []).length > 0 ? (terms.utilitiesReimbursed || []).map(u => {
  const amount = terms.utilityReimbursementAmounts?.[u];
  return `- ${u}${amount ? ` — $${amount.toFixed(2)}/month` : ''}`;
}).join('\n') : 'None'}
${(terms.utilitiesReimbursed || []).length > 0 ? `The above utilities are paid by Landlord and reimbursed by Tenant as part of the Rent. These utilities cannot be transferred to Tenant's name and remain in Landlord's account.` : ''}

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '9' : '8'}. USE OF PREMISES
The premises shall be used and occupied by Tenant solely as a private residence. Tenant shall comply with all laws, ordinances, and regulations regarding the use of the premises.

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '10' : '9'}. MAINTENANCE AND REPAIRS
Tenant shall maintain the premises in clean and sanitary condition and shall surrender the premises at the end of the term in the same condition as received, normal wear and tear excepted.

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '11' : '10'}. LANDLORD ENTRY
Landlord may enter the premises at reasonable times with 24-hour notice for inspection, maintenance, or to show the property to prospective tenants or buyers. In case of emergency, Landlord may enter without notice.

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '12' : '11'}. DEFAULT
If Tenant fails to pay rent when due or violates any term of this Lease, Landlord may pursue all legal remedies available under ${property.state === 'CA' ? 'California' : 'Nevada'} law.

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '13' : '12'}. GOVERNING LAW
This Lease shall be governed by and construed in accordance with the laws of the State of ${property.state === 'CA' ? 'California' : 'Nevada'}.

${stateClauses.join('\n')}

${disclosuresSection}

ADDENDUM — UTILITY COMPANY CHECKLIST
The following utility companies apply to the property. Tenant and Landlord should verify contact information and set up accounts before move-in.

RENO, NV
- NV Energy (Electric) — Phone: (775) 834-4444 | www.nvenergy.com
- Truckee Meadows Water Authority (Water) — Phone: (775) 834-8080 | www.tmwa.com
- Southwest Gas (Gas) — Phone: (877) 860-6020 | www.swgas.com
- Waste Management (Trash) — Phone: (775) 329-8822 | www.wm.com
- Spectrum / AT&T (Internet) — Spectrum: (833) 267-6094 | AT&T: (800) 288-2020 | www.spectrum.com | www.att.com

TRUCKEE, CA
- Tahoe Public Utility District (Electric) — Phone: (530) 587-3896 | www.tdpud.org
- Truckee Donner PUD (Water) — Phone: (530) 587-3896 | www.tdpud.org
- Southwest Gas (Gas) — Phone: (877) 860-6020 | www.swgas.com
- Tahoe Truckee Sierra Disposal (Trash) — Phone: (530) 583-7800 | www.tahoetruckeesierradisposal.com
- Spectrum / AT&T (Internet) — Spectrum: (833) 267-6094 | AT&T: (800) 288-2020 | www.spectrum.com | www.att.com

IN WITNESS WHEREOF, the parties have executed this Lease as of the date first written above.

${landlords.map((landlord, index) => {
  const signature = landlordSignatures?.[index];
  return `LANDLORD${landlords.length > 1 ? ` ${index + 1}` : ''} SIGNATURE: ${signature ? 'SIGNED' : '_________________________'}
Name: ${landlord.name}
Date: ${signature ? formatLocalDate(signature.date) : '_________________________'}`;
}).join('\n\n')}

${tenants.map((tenant, index) => {
  const signature = tenantSignatures?.[index];
  return `TENANT${tenants.length > 1 ? ` ${index + 1}` : ''} SIGNATURE: ${signature ? 'SIGNED' : '_________________________'}
Name: ${tenant.name}
Date: ${signature ? formatLocalDate(signature.date) : '_________________________'}`;
}).join('\n\n')}

${landlordSignatures?.map((signature, index) => `
LANDLORD${landlords.length > 1 ? ` ${index + 1}` : ''} ELECTRONIC SIGNATURE RECORD
Signature Date: ${new Date(signature.date).toLocaleString()}
IP Address: ${signature.ipAddress}
User Agent: ${signature.userAgent}
`).join('') || ''}

${coSigners && coSigners.length > 0 ? `
CO-SIGNER SIGNATURES
${coSigners.map((coSigner, index) => {
  const signature = coSignerSignatures?.[index];
  return `CO-SIGNER ${coSigners.length > 1 ? index + 1 : ''} SIGNATURE: ${signature ? 'SIGNED' : '_________________________'}
Name: ${coSigner.name}
Date: ${signature ? formatLocalDate(signature.date) : '_________________________'}`;
}).join('\n\n')}

${coSignerSignatures?.map((signature, index) => `
CO-SIGNER ${coSigners.length > 1 ? index + 1 : ''} ELECTRONIC SIGNATURE RECORD
Signature Date: ${new Date(signature.date).toLocaleString()}
IP Address: ${signature.ipAddress}
User Agent: ${signature.userAgent}
`).join('') || ''}
` : ''}

${tenantSignatures?.map((signature, index) => `
TENANT${tenants.length > 1 ? ` ${index + 1}` : ''} ELECTRONIC SIGNATURE RECORD
Signature Date: ${new Date(signature.date).toLocaleString()}
IP Address: ${signature.ipAddress}
User Agent: ${signature.userAgent}
`).join('') || ''}
`;

  return leaseText.trim();
};

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}