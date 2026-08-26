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
    ? `Pets are permitted upon this property. See the attached Pet Policy Addendum for specific pet details, financial terms, and tenant responsibilities.`
    : 'No pets are permitted on the property without prior written consent from Landlord.'
}

${terms.petsAllowed ? `PET POLICY ADDENDUM
__________________________

PERMISSION AND IDENTIFICATION
Landlord grants Tenant permission to keep the designated pet(s) verified below at the Premises. No other animals, including offspring, are permitted without prior written consent from the Landlord.
${(terms.pets || []).map((pet, i) => `* Pet ${i + 1}: Type: ${pet.type || 'N/A'} | Breed: ${pet.breed || 'N/A'} | Age: ${pet.age || 'N/A'}`).join('\n')}
${(terms.pets || []).length === 0 ? '* No pets specified' : ''}
${(terms.pets || []).length < 2 ? `* Pet ${(terms.pets || []).length + 1}: Type: N/A | Breed: N/A | Age: N/A` : ''}

B. FINANCIAL TERMS & DISCLOSURES
${property.state === 'NV' ? 'In compliance with Nevada\'s maximum rent disclosure standards, all pet-related financial obligations are strictly itemized below:' : 'All pet-related financial obligations are strictly itemized below:'}
${terms.petRent !== undefined && terms.petRent !== null && terms.pets && terms.pets.length > 0 ? `* Monthly Pet Rent: Tenant agrees to pay an additional $${(terms.petRent * terms.pets.length).toFixed(2)} per month as pet rent ($${terms.petRent.toFixed(2)} per pet × ${terms.pets.length} pet(s)). This fee is included in the advertised Maximum Monthly Gross Rent.\n` : ''}
${terms.petDeposit !== undefined && terms.petDeposit !== null ? `* Refundable Pet Deposit: Tenant shall deposit the sum of $${terms.petDeposit.toFixed(2)} as a pet deposit. This sum is held under ${property.state === 'NV' ? 'NRS 118A.242. The combined total of all deposits (security, key, pet) does not exceed the statutory limit of three (3) months\' rent.' : 'California Civil Code § 1950.5. The combined total of all deposits (security, key, pet) does not exceed the statutory limit.'}\n` : ''}
${terms.nonRefundableFee !== undefined && terms.nonRefundableFee !== null ? `* Non-Refundable Pet Fee: Tenant shall pay a one-time, non-refundable fee of $${terms.nonRefundableFee.toFixed(2)} for professional carpet cleaning and deodorization upon move-out.\n` : ''}
D. EXCLUSION FOR ASSISTANCE ANIMALS
${property.state === 'NV'
  ? 'In accordance with federal Fair Housing laws and NRS 118.105, verified service animals and emotional support animals (ESAs) are exempt from pet rent, pet fees, or breed/weight restrictions. However, owners of assistance animals remain financially liable for any physical damage caused by the animal to the premises.'
  : 'In accordance with the federal Fair Housing Act (FHA) and the California Fair Employment and Housing Act (FEHA), verified service animals and emotional support animals (ESAs) are exempt from pet rent, pet fees, or breed/weight restrictions. However, owners of assistance animals remain financially liable for any physical damage caused by the animal to the premises.'}

E. VIOLATIONS AND LEASE TERMINATION
Any breach of this Pet Policy constitutes a material lease violation. Landlord reserves the right to issue a ${property.state === 'NV' ? 'Nevada 5-Day Notice to Cure or Quit' : 'California 3-Day Notice to Perform Covenant or Quit'}. Failure to remedy the violation or remove the unauthorized pet within ${property.state === 'NV' ? 'five (5) judicial days' : 'three (3) calendar days'} will result in the immediate initiation of formal eviction proceedings.

` : ''}
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

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '12' : '11'}. ${property.state === 'NV' ? 'DEFAULT AND REMEDIES' : 'DEFAULT'}
${property.state === 'NV' ? `
A. Event of Default: Tenant shall be deemed in material default of this Lease Agreement if:
   1) Tenant fails to pay Rent, utility reimbursements, or any other financial obligation within the timelines specified herein; or
   2) Tenant, authorized occupants, or guests violate any material covenant, condition, or rule of this Lease Agreement, including the attached Pet Policy Addendum.

B. Landlord’s Remedies: Upon the occurrence of an Event of Default, Landlord may pursue all legal and equitable remedies available to recover physical possession of the premises and documented actual damages. In accordance with Nevada summary eviction proceedings, Landlord’s remedies are governed by the following strict statutory notice tracks:
   1) Non-Payment of Rent: Landlord shall serve a written 7-Day Notice to Pay or Quit pursuant to NRS 40.2512.
   2) Curable Lease Violations: For non-monetary breaches, Landlord shall serve a written 5-Day Notice to Perform Lease Condition or Quit pursuant to NRS 40.2516.
   3) Non-Curable Violations: For severe structural property waste, illegal activity, or recurring nuisances, Landlord shall serve a written 3-Day Notice to Quit pursuant to NRS 40.2514.

C. Attorney's Fees: In compliance with NRS 118A.220(1)(c), if either party brings a formal legal action to enforce or interpret the terms of this Lease Agreement, the court may award reasonable attorney's fees and actual litigation costs strictly to the prevailing party.
` : `If Tenant fails to pay rent when due or violates any term of this Lease, Landlord may pursue all legal remedies available under ${property.state === 'CA' ? 'California' : 'Nevada'} law.`}

${terms.holdingDeposit && terms.holdingDeposit > 0 ? '13' : '12'}. ${property.state === 'NV' ? 'GOVERNING LAW AND SEVERABILITY' : 'GOVERNING LAW'}
${property.state === 'NV' ? `
A. Choice of Law: This Lease Agreement, along with all incorporated addendums, disclosures, and subsequent modifications, shall be governed by, construed, and enforced strictly in accordance with the laws of the State of Nevada.

B. Venue Selection: Any judicial or summary eviction dispute arising directly under this lease framework shall be subject to the exclusive jurisdiction of the Justice Court in the specific county where the rental property is physically located.

C. Severability: If any clause, provision, or statutory reference within this Lease is found to be void, illegal, or legally unenforceable under Nevada law (including NRS Chapter 118A), such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remainder of the Lease shall remain in full force and effect.
` : `This Lease shall be governed by and construed in accordance with the laws of the State of ${property.state === 'CA' ? 'California' : 'Nevada'}.`}

${stateClauses.join('\n')}

${disclosuresSection}

ADDENDUM A — TENANT RESPONSIBILITIES AND RULES (PET-RELATED)
__________________________

This Addendum forms part of the Residential Lease Agreement between Landlord and Tenant. By signing the Lease, Tenant acknowledges and agrees to the following pet-related responsibilities and rules:

C. TENANT RESPONSIBILITIES AND RULES
1) Control and Containment: Pets must be kept on a leash at all times when outside the dwelling unit. Pets are prohibited from roaming common areas unattended.
2) Sanitation: Tenant is strictly responsible for the immediate disposal of all pet waste. Waste must be placed in designated trash receptacles.
3) Damage and Disturbance: Tenant ensures pets will not cause property damage or disturb neighbors (e.g., excessive barking). Tenant accepts full financial liability for repairs or flooring replacement caused by pet damage.
4) Flooring Protection and Rug Requirements: Tenant acknowledges that the premises features premium hard-surface wood-style flooring. To prevent localized wear, deep scratches, and finish dulling, Tenant agrees to place protective area rugs, runners, or mats over high-traffic pathways and underneath all designated pet resting areas.
5) Moisture Barriers and Food Stations: Tenant must place a 100% waterproof mat or protective tray underneath all pet food bowls, water dishes, and litter boxes. Disposable training pads or pet beds are strictly prohibited from sitting directly on the bare flooring surfaces if they are damp or lack a solid rubber/plastic backing.
6) Immediate Spill and Waste Remediation: Standing liquid is the primary cause of floor warping, seam swelling, and permanent staining. Tenant is strictly required to wipe up all pet liquid accidents (including urine, saliva, or vomit) immediately upon discovery. Any liquid left standing that seeps into floorboard seams, baseboards, or subflooring resulting in structural buckle, stain, or odor will be deemed property damage and not normal wear and tear.
7) Claw and Scratch Prevention: Tenant agrees to keep the pet's claws and nails routinely trimmed short and filed smooth to minimize physical scratching, gouging, or chipping of the floor's protective wear layer.
8) Safe Cleaning Practices: Tenant agrees to refrain from using harsh abrasive scrubbers, bleach, heavy solvents, or soaking mops on the flooring. Only manufacturer-approved, pH-neutral hard-surface cleaners may be used.
9) End-of-Tenancy Liability: Upon move-out, Tenant accepts full financial liability for the costs of professional board replacement, deep sanding, or chemical refinishing required to correct pet-inflicted floor damage or neutralize deep-set biological odors.

__________________________
LANDLORD SIGNATURE: __________________________
Date: __________________________

TENANT SIGNATURE: __________________________
Date: __________________________

ADDENDUM B — UTILITY COMPANY CHECKLIST
The following utility companies apply to the property (${property.city === 'Truckee' ? 'Truckee, CA' : 'Reno, NV'}). Tenant and Landlord should verify contact information and set up accounts before move-in.

${terms.checkedUtilities && terms.checkedUtilities.length > 0 ? terms.checkedUtilities.map(u => {
  const lines = property.city === 'Truckee' ? [
    'Tahoe Public Utility District (Electric) — Phone: (530) 587-3896 | www.tdpud.org',
    'Truckee Donner PUD (Water) — Phone: (530) 587-3896 | www.tdpud.org',
    'Southwest Gas (Gas) — Phone: (877) 860-6020 | www.swgas.com',
    'Tahoe Truckee Sierra Disposal (Trash) — Phone: (530) 583-7800 | www.tahoetruckeesierradisposal.com',
    'Spectrum / AT&T (Internet) — Spectrum: (833) 267-6094 | AT&T: (800) 288-2020 | www.spectrum.com | www.att.com',
  ] : [
    'NV Energy (Electric & Gas) — Phone: (775) 834-4444 | www.nvenergy.com',
    'Truckee Meadows Water Authority (Water) — Phone: (775) 834-8080 | www.tmwa.com',
    'Waste Management (Trash) — Phone: (775) 329-8822 | www.wm.com',
    'Spectrum / AT&T (Internet) — Spectrum: (833) 267-6094 | AT&T: (800) 288-2020 | www.spectrum.com | www.att.com',
  ];
  const match = lines.find(l => l.includes(u.split(' (')[0]));
  return match ? `- ${match}` : `- ${u}`;
}).join('\n') : (property.city === 'Truckee' ? `- Tahoe Public Utility District (Electric) — Phone: (530) 587-3896 | www.tdpud.org
- Truckee Donner PUD (Water) — Phone: (530) 587-3896 | www.tdpud.org
- Southwest Gas (Gas) — Phone: (877) 860-6020 | www.swgas.com
- Tahoe Truckee Sierra Disposal (Trash) — Phone: (530) 583-7800 | www.tahoetruckeesierradisposal.com
- Spectrum / AT&T (Internet) — Spectrum: (833) 267-6094 | AT&T: (800) 288-2020 | www.spectrum.com | www.att.com` : `- NV Energy (Electric & Gas) — Phone: (775) 834-4444 | www.nvenergy.com
- Truckee Meadows Water Authority (Water) — Phone: (775) 834-8080 | www.tmwa.com
- Waste Management (Trash) — Phone: (775) 329-8822 | www.wm.com
- Spectrum / AT&T (Internet) — Spectrum: (833) 267-6094 | AT&T: (800) 288-2020 | www.spectrum.com | www.att.com`)}

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