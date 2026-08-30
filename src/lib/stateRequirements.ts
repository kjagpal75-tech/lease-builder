import {
  ApplicableDisclosure,
  Property,
  PropertyType,
  State,
  StateRequirements,
  defaultDisclosureFlags,
} from '@/types/lease';

const MULTI_UNIT_TYPES: PropertyType[] = ['apartment', 'condo', 'townhouse'];

const CA_LOCAL_RENT_NOTICE_CITIES: Record<string, string> = {
  'san francisco': 'San Francisco rent ordinance / Just Cause eviction rules may apply in addition to state law.',
  oakland: 'Oakland Rent Adjustment Program and Just Cause for Eviction Ordinance may apply.',
  berkeley: 'Berkeley Rent Stabilization and Eviction for Good Cause Ordinance may apply.',
  'los angeles': 'City of Los Angeles RSO / Just Cause rules may apply depending on the unit.',
  'santa monica': 'Santa Monica Rent Control Charter Amendment may apply.',
  'west hollywood': 'West Hollywood rent stabilization rules may apply.',
  sacramento: 'Sacramento Tenant Protection and Relief Act / local just-cause rules may apply.',
  'san diego': 'San Diego Tenant Protection Ordinance may apply to covered units.',
  'long beach': 'Long Beach rent stabilization / just-cause rules may apply.',
  richmond: 'Richmond Fair Rent, Just Cause for Eviction and Homeowner Protection Ordinance may apply.',
  alameda: 'City of Alameda rent stabilization rules may apply.',
  hayward: 'Hayward Residential Rent Stabilization and Tenant Protection Ordinance may apply.',
  'mountain view': 'Mountain View Community Stabilization and Fair Rent Act may apply.',
};

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function isPre1978(property: Property): boolean {
  return typeof property.yearBuilt === 'number' && property.yearBuilt > 0 && property.yearBuilt < 1978;
}

function isPre1981(property: Property): boolean {
  return typeof property.yearBuilt === 'number' && property.yearBuilt > 0 && property.yearBuilt < 1981;
}

function flagsOf(property: Property) {
  return {
    ...defaultDisclosureFlags(),
    ...(property.disclosureFlags || {}),
  };
}

export const getStateRequirements = (state: State): StateRequirements => {
  switch (state) {
    case 'NV':
      return {
        requiredDisclosures: [
          'Owner/Manager Information (NRS 118A.260)',
          'Signed Lease Copy (NRS 118A.200)',
          'Inventory/Condition Record (NRS 118A.200)',
          'Foreclosure Disclosure when applicable (NRS 118A.275)',
          'Nuisance Rule Provision (NRS 118A.200 / NRS 202.470)',
          'Lead-Based Paint Disclosure for pre-1978 housing (Federal Title X)',
        ],
        requiredClauses: [
          'Duration of Agreement',
          'Amount of Rent and Manner/Time of Payment',
          'Occupancy by Children or Pets',
          'Services Included with Dwelling Rental',
          'Required Fees and Their Purpose',
          'Required Deposits and Conditions for Refund',
          'Charges for Late/Partial Payment or Returned Checks',
          'Landlord Inspection Rights',
          'List of Persons Who Will Live on Property',
          'Utility Payment Responsibilities',
          'Signed Record of Inventory and Condition',
          'Summary of NRS 202.470 (Nuisance Criminal Penalty)',
          'Procedure for Reporting Nuisances or Code Violations',
          'Tenant Right to Display U.S. Flag',
        ],
        maxSecurityDeposit: (rent: number) => rent * 3,
        maxLateFeePercent: 5,
        maxLateFee: (rent: number) => rent * 0.05,
        maxReturnedCheckFee: 25,
        maxReturnedCheckFeeSubsequent: 25,
        lateFeeGraceDays: 3,
        lateFeeAuthority: 'NRS 118A.210 (max 5% of periodic rent; not before 3 calendar days after due date)',
        returnedCheckFeeAuthority: 'NRS 118A.200 (dishonored check charge must be stated in the lease)',
        additionalNotices: [
          'Tenant must be provided with landlord/agent emergency contact information',
          'Landlord must provide copy of lease within reasonable time if requested',
          'Any rules/regulations must be provided to tenants and apply fairly',
        ],
      };
    case 'CA':
      return {
        requiredDisclosures: [
          'Authorized Manager Information (CA Civil Code 1962)',
          "Megan's Law / Sex Offender Registry Notice (Civil Code 2079.10a)",
          'Bed Bug Disclosure (Civil Code 1954.603)',
          'Smoking Policy (Civil Code 1947.5)',
          'Lead-Based Paint for pre-1978 housing (Federal Title X)',
          'Flood Hazard when applicable (Gov. Code 8589.45)',
          'Additional condition-based disclosures (mold, asbestos, ordnance, death, shared utilities, pest control)',
        ],
        requiredClauses: [
          'Rent Amount and Due Date',
          'Security Deposit Amount and Terms (AB 12 compliant)',
          'Late Fee Policy',
          'Returned Check Fee Policy',
          'Pet Policy and Pet Deposit (if applicable)',
          'Occupancy Limits',
          'Utilities and Services Included',
          'Utilities Tenant Responsible For',
          'Maintenance and Repair Responsibilities',
          'Entry and Inspection Rights',
          'Termination and Renewal Terms',
          'Rent Increase Policy (AB 1482 compliant if applicable)',
          'Dispute Resolution Process',
          'Disaster and Emergency Procedures (SB 610 compliant)',
        ],
        maxSecurityDeposit: (rent: number) => rent,
        maxLateFeePercent: 5,
        maxLateFee: (rent: number) => rent * 0.05,
        maxReturnedCheckFee: 25,
        maxReturnedCheckFeeSubsequent: 35,
        lateFeeGraceDays: 0,
        lateFeeAuthority: 'Civil Code § 1671 (must be reasonable; 5% used as maximum in this app)',
        returnedCheckFeeAuthority: 'Civil Code § 1719 ($25 first returned check; $35 each subsequent)',
        additionalNotices: [
          'AB 1482 Rent Cap - If property is subject to rent stabilization',
          'AB 628 Appliance Requirements - Landlord must maintain certain appliances',
          'Social Security Tenant Protection Act - Tenants may claim Social Security hardship for nonpayment',
          'Disaster Protections - Presumption of uninhabitability if unit contains disaster debris',
        ],
      };
    default:
      throw new Error(`Unsupported state: ${state}`);
  }
};

/**
 * Returns disclosures that apply to this specific property (state, type, age, location, flags).
 */
export const getApplicableDisclosures = (property: Property): ApplicableDisclosure[] => {
  const flags = flagsOf(property);
  const disclosures: ApplicableDisclosure[] = [];
  const multiUnit = MULTI_UNIT_TYPES.includes(property.type);

  if (property.state === 'CA') {
    disclosures.push({
      id: 'ca-manager-info',
      title: 'Authorized Manager / Owner Information',
      statute: 'Civil Code § 1962',
      category: 'required',
      reason: 'Required for all California residential leases',
      leaseText: [
        'AUTHORIZED MANAGER AND OWNER INFORMATION (Civil Code § 1962)',
        'Landlord discloses in this Lease the name, telephone number, and usual street address',
        'at which personal service may be effected of (1) the manager of the premises, and',
        '(2) an owner of the premises or a person authorized to act for and on behalf of the',
        'owner for the purpose of service of process and receiving notices and demands.',
        'A copy of this signed Lease will be provided to Tenant within 15 days of execution.',
        '',
        'PAYMENT OF RENT: Rent shall be paid via Electronic Funds Transfer / Zelle / Check to the Landlord at the address set forth above. Electronic Funds Transfer (EFT) and Zelle payments are the preferred and primary methods of payment. Personal or cashier checks are also accepted, made payable to the Landlord and mailed or delivered to the Landlord at the address disclosed in this Lease. Cash is not accepted.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'ca-megans-law',
      title: "Megan's Law / Sex Offender Registry Notice",
      statute: 'Civil Code § 2079.10a',
      category: 'required',
      reason: 'Required for all California residential leases',
      leaseText: [
        "NOTICE REGARDING MEGAN'S LAW (Civil Code § 2079.10a)",
        'Notice: Pursuant to Section 290.46 of the Penal Code, information about specified',
        'registered sex offenders is made available to the public via an Internet Web site',
        'maintained by the Department of Justice at www.meganslaw.ca.gov. Depending on an',
        "offender's criminal history, this information will include either the address at which",
        'the offender resides or the community of residence and ZIP Code in which he or she resides.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'ca-bed-bugs',
      title: 'Bed Bug Disclosure',
      statute: 'Civil Code § 1954.603',
      category: 'required',
      reason: 'Required before creating a new California tenancy',
      leaseText: [
        'BED BUG DISCLOSURE (Civil Code § 1954.603)',
        'Information about Bed Bugs: Bed bug infestations can seriously affect the health',
        'and quality of life of occupants. Bed bugs are small insects that feed on human blood.',
        'They are typically active at night and hide in cracks, crevices, mattresses, and furniture.',
        'Tenant agrees to promptly notify Landlord in writing of any known or suspected bed bug',
        'infestation. Tenant shall not bring onto the premises personal belongings that Tenant',
        'knows or reasonably should know are infested. Landlord will respond in accordance with',
        'applicable law. Additional educational materials may be provided as an attachment.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'ca-smoking',
      title: 'Smoking Policy',
      statute: 'Civil Code § 1947.5',
      category: 'required',
      reason: 'Required for California residential leases',
      leaseText: [
        'SMOKING POLICY (Civil Code § 1947.5)',
        flags.smokingPolicy === 'prohibited'
          ? 'Smoking of tobacco products and cannabis is prohibited in the dwelling unit and in all enclosed and common areas of the property.'
          : flags.smokingPolicy === 'allowed'
            ? 'Smoking is permitted in the dwelling unit subject to applicable law and any building rules. Smoking may be restricted in shared or common areas.'
            : 'Smoking is restricted: smoking is prohibited in common areas and outdoor areas within 25 feet of building entrances, operable, and operable windows, and may be further limited inside the unit by building rules.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'ca-co-smoke-detectors',
      title: 'Smoke and Carbon Monoxide Detectors',
      statute: 'Health & Safety Code §§ 13113.7, 17926',
      category: 'required',
      reason: 'Required detector compliance for California dwellings',
      leaseText: [
        'SMOKE AND CARBON MONOXIDE DETECTORS',
        'Landlord represents that the premises are equipped with operable smoke detectors',
        'and, where required by Health & Safety Code § 17926 (fossil-fuel appliances or',
        'attached garage), carbon monoxide detectors. Tenant shall not disable detectors',
        'and shall promptly notify Landlord of any malfunction.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'ca-water-conservation',
      title: 'Water-Conserving Plumbing Fixtures',
      statute: 'Civil Code § 1101.5 / related water fixture standards',
      category: 'required',
      reason: 'California water-conserving fixture standards for residential rentals',
      leaseText: [
        'WATER-CONSERVING PLUMBING FIXTURES',
        'Landlord discloses that the premises are intended to comply with applicable',
        'California water-conserving plumbing fixture requirements for residential rental property.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'ca-ab1482',
      title: 'AB 1482 Tenant Protection Act Notice',
      statute: 'Civil Code §§ 1946.2, 1947.12',
      category: 'required',
      reason: flags.ab1482Exempt
        ? 'Exempt status disclosed for this property'
        : multiUnit || property.type === 'house'
          ? 'Status notice required for covered California residential properties'
          : 'Status notice included for California residential leases',
      leaseText: flags.ab1482Exempt
        ? [
            'NOTICE OF EXEMPTION FROM AB 1482 (Civil Code §§ 1946.2, 1947.12)',
            'Landlord represents that this tenancy is exempt from the Tenant Protection Act of 2019',
            '(AB 1482) rent caps and/or just-cause eviction provisions based on an applicable statutory exemption',
            '(for example, certain single-family homes / condominiums owned by natural persons with proper notice,',
            'or other qualifying exemptions). Tenant acknowledges receipt of this exemption notice.',
          ].join('\n')
        : [
            'NOTICE REGARDING AB 1482 TENANT PROTECTION ACT (Civil Code §§ 1946.2, 1947.12)',
            'This property may be subject to California statewide rent caps and just-cause eviction protections',
            'under AB 1482, unless a statutory exemption applies. Annual rent increases for covered units are',
            'limited as provided by statute. Landlord will provide any additional locally required notices.',
          ].join('\n'),
    });

    if (isPre1978(property)) {
      disclosures.push({
        id: 'ca-lead-paint',
        title: 'Lead-Based Paint Disclosure',
        statute: '42 U.S.C. § 4852d (Federal Title X)',
        category: 'conditional',
        reason: `Property year built (${property.yearBuilt}) is before 1978`,
        leaseText: [
          'LEAD WARNING STATEMENT (Federal Title X)',
          'Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips,',
          'and dust can pose health hazards if not managed properly. Lead exposure is especially',
          'harmful to young children and pregnant women. Before renting pre-1978 housing,',
          'landlords must disclose the presence of known lead-based paint and/or lead-based paint',
          'hazards in the dwelling. Tenants must also receive a federally approved pamphlet on',
          'lead poisoning prevention ("Protect Your Family From Lead in Your Home").',
          'Landlord has no knowledge of lead-based paint and/or lead-based paint hazards in the',
          'housing except as otherwise disclosed in writing, and has provided Tenant any available',
          'records or reports pertaining to lead-based paint and/or lead-based paint hazards.',
        ].join('\n'),
      });
    }

    if (isPre1981(property) || flags.knownAsbestos) {
      disclosures.push({
        id: 'ca-asbestos',
        title: 'Asbestos Advisory',
        statute: 'Cal/OSHA / H&S asbestos rules',
        category: 'conditional',
        reason: flags.knownAsbestos
          ? 'Known asbestos disclosed for this property'
          : `Property year built (${property.yearBuilt}) is before 1981 — asbestos advisory included`,
        leaseText: [
          'ASBESTOS ADVISORY',
          flags.knownAsbestos
            ? 'Landlord discloses that asbestos-containing materials are known or believed to be present at the property. Tenant shall not disturb suspect materials and shall notify Landlord before any alterations.'
            : 'Buildings constructed before 1981 may contain asbestos-containing materials. Tenant shall not sand, drill, or otherwise disturb suspect materials and shall notify Landlord before alterations that may disturb building materials.',
        ].join('\n'),
      });
    }

    disclosures.push({
      id: 'ca-flood',
      title: 'Flood Hazard Disclosure',
      statute: 'Government Code § 8589.45',
      category: 'required',
      reason: 'Required for all California residential leases (Gov. Code § 8589.45)',
      leaseText: [
        'FLOOD HAZARD DISCLOSURE (Government Code § 8589.45)',
        `Landlord discloses that the property is ${flags.inFloodHazardArea ? '' : 'NOT '}located in a Special Flood Hazard Area or Area of Potential Flooding to Landlord's actual knowledge.`,
      ].join('\n'),
    });




    if (flags.nearMilitaryOrdnance) {
      disclosures.push({
        id: 'ca-ordnance',
        title: 'Former Military Ordnance Disclosure',
        statute: 'Civil Code § 1940.7',
        category: 'conditional',
        reason: 'Property flagged as within one mile of a former military ordnance location',
        leaseText: [
          'FORMER FEDERAL OR STATE ORDNANCE LOCATION (Civil Code § 1940.7)',
          'Landlord has actual knowledge that this property is located within one mile of a former',
          'federal or state ordnance location which may contain explosive munitions.',
        ].join('\n'),
      });
    }

    if (flags.deathOnPropertyLast3Years) {
      disclosures.push({
        id: 'ca-death',
        title: 'Death on Property Disclosure',
        statute: 'Civil Code § 1710.2',
        category: 'conditional',
        reason: 'Death occurred on the property within the past 3 years',
        leaseText: [
          'DEATH ON PROPERTY DISCLOSURE (Civil Code § 1710.2)',
          'Landlord discloses that a death occurred upon the property within the previous three years.',
          'Additional details will be provided upon written request to the extent required by law',
          '(note: deaths from AIDS-related or other protected categories are subject to statutory limits).',
        ].join('\n'),
      });
    }

    if (flags.knownMoldHazard) {
      disclosures.push({
        id: 'ca-mold',
        title: 'Mold Disclosure',
        statute: 'Health & Safety Code §§ 26147–26148',
        category: 'conditional',
        reason: 'Known or visible mold hazard disclosed',
        leaseText: [
          'MOLD DISCLOSURE (Health & Safety Code §§ 26147–26148)',
          'Landlord discloses known presence of mold that exceeds permissible exposure limits or poses',
          'an indoor air quality hazard. Tenant should promptly report water intrusion, leaks, or',
          'suspected mold growth in writing.',
        ].join('\n'),
      });
    }

    if (flags.pestControlContract || multiUnit) {
      // Periodic pest-control notice is required when a contract exists; for multi-unit we surface the checkbox prompt via reason
      if (flags.pestControlContract) {
        disclosures.push({
          id: 'ca-pest-control',
          title: 'Periodic Pest Control Notice',
          statute: 'Civil Code § 1940.8; Bus. & Prof. Code § 8538',
          category: 'conditional',
          reason: 'Property has a periodic pest-control service contract',
          leaseText: [
            'PEST CONTROL NOTICE (Civil Code § 1940.8)',
            'The premises are covered by a periodic pest control service contract. Landlord will provide',
            'Tenant with the notice required by Business and Professions Code § 8538 regarding pesticides',
            'used, including the frequency of application and any precautions.',
          ].join('\n'),
        });
      }
    }

    if (flags.sharedUtilityMeters) {
      disclosures.push({
        id: 'ca-shared-utilities',
        title: 'Shared Utility Meters Disclosure',
        statute: 'Civil Code § 1940.9',
        category: 'conditional',
        reason: 'Gas or electric service is shared with other units or common areas',
        leaseText: [
          'SHARED UTILITY METERS (Civil Code § 1940.9)',
          'Landlord discloses that gas and/or electric service to the dwelling also serves other areas',
          'or dwelling units. The method of allocating utility costs among tenants and common areas is',
          'as stated in this Lease or an attached utility allocation addendum.',
        ].join('\n'),
      });
    }

    if (flags.demolitionPermitPending) {
      disclosures.push({
        id: 'ca-demolition',
        title: 'Demolition Permit Disclosure',
        statute: 'Civil Code § 1940.6',
        category: 'conditional',
        reason: 'Demolition permit applied for / pending affecting the unit',
        leaseText: [
          'DEMOLITION PERMIT DISCLOSURE (Civil Code § 1940.6)',
          'Landlord discloses that an application for a permit to demolish the residential dwelling',
          'unit has been submitted to a public agency.',
        ].join('\n'),
      });
    }

    if (flags.methContaminationHistory) {
      disclosures.push({
        id: 'ca-meth',
        title: 'Methamphetamine / Fentanyl Contamination Disclosure',
        statute: 'Health & Safety Code §§ 25400.10 et seq.',
        category: 'conditional',
        reason: 'Property has documented contamination history requiring disclosure',
        leaseText: [
          'CONTAMINATION DISCLOSURE',
          'Landlord discloses that the property has a documented history related to methamphetamine',
          'or other controlled-substance contamination and remediation status as required by applicable',
          'Health & Safety Code provisions. Supporting documentation is available upon request to the',
          'extent required by law.',
        ].join('\n'),
      });
    }

    if (property.type === 'condo' || property.type === 'townhouse') {
      disclosures.push({
        id: 'ca-hoa',
        title: 'HOA / Common Interest Development Notice',
        statute: 'Civil Code §§ 4740 et seq. (Davis-Stirling)',
        category: 'conditional',
        reason: `Property type is ${property.type}`,
        leaseText: [
          'COMMON INTEREST DEVELOPMENT / HOA NOTICE',
          'This property is part of a common interest development. Tenant acknowledges that occupancy',
          'is subject to applicable CC&Rs, bylaws, and operating rules of the homeowners association.',
          'Landlord will provide governing documents reasonably necessary for Tenant\'s occupancy,',
          'and Tenant agrees to comply with all association rules. Fines or charges arising from',
          'Tenant violations may be charged to Tenant as additional rent where permitted by law.',
        ].join('\n'),
      });
    }

    if (property.type === 'apartment') {
      disclosures.push({
        id: 'ca-prop65',
        title: 'Proposition 65 Warning (Multi-Unit Housing)',
        statute: 'Health & Safety Code § 25249.5 et seq.',
        category: 'conditional',
        reason: 'Apartment / multi-unit residential properties commonly require Prop 65 posting/notice',
        leaseText: [
          'CALIFORNIA PROPOSITION 65 WARNING',
          'WARNING: Some materials and products on the property can expose you to chemicals including',
          'tobacco smoke, engine exhaust, and other chemicals known to the State of California to cause',
          'cancer, birth defects, or other reproductive harm. For more information go to',
          'www.P65Warnings.ca.gov/apartments.',
        ].join('\n'),
      });
    }

    const cityKey = normalizeCity(property.city);
    const localNotice = CA_LOCAL_RENT_NOTICE_CITIES[cityKey];
    if (localNotice) {
      disclosures.push({
        id: `ca-local-${cityKey.replace(/\s+/g, '-')}`,
        title: `Local Ordinance Notice — ${property.city}`,
        category: 'local',
        reason: `Property city (${property.city}, CA) has additional local tenant protections`,
        leaseText: [
          `LOCAL ORDINANCE NOTICE — ${property.city.toUpperCase()}, CALIFORNIA`,
          localNotice,
          'Landlord and Tenant acknowledge that local ordinances may impose additional notice,',
          'registration, rent limit, or just-cause requirements beyond statewide law.',
        ].join('\n'),
      });
    }
  }

  if (property.state === 'NV') {
    disclosures.push({
      id: 'nv-owner-manager',
      title: 'Owner / Manager / Emergency Contact Disclosure',
      statute: 'NRS 118A.260',
      category: 'required',
      reason: 'Required for all Nevada residential tenancies',
      leaseText: [
        'OWNER, MANAGER, AND EMERGENCY CONTACT DISCLOSURE (NRS 118A.260)',
        'Landlord discloses the name and address of: (a) persons authorized to manage the premises;',
        '(b) a person within Nevada authorized to act for the landlord for service of process and',
        'receiving notices and demands; and (c) the principal or corporate owner, as applicable.',
        'Landlord also provides a telephone number at which a responsible person who resides in the',
        'county or within 60 miles of the premises may be called in case of emergency. The contact',
        'information for these persons appears in the Landlord Information section of this Lease',
        'and will be kept current.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'nv-lease-inventory',
      title: 'Signed Lease and Inventory / Condition Record',
      statute: 'NRS 118A.200',
      category: 'required',
      reason: 'Required contents of Nevada rental agreements',
      leaseText: [
        'SIGNED LEASE AND INVENTORY / CONDITION RECORD (NRS 118A.200)',
        'Landlord will provide Tenant a free copy of this signed rental agreement. The parties will',
        'complete and sign a separate inventory and record of the condition of the premises, which',
        'shall be attached to or kept with this Lease.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'nv-nuisance',
      title: 'Nuisance Provision and Reporting Procedure',
      statute: 'NRS 118A.200; NRS 202.470',
      category: 'required',
      reason: 'Required Nevada rental agreement provisions',
        leaseText: [
          'Tenant shall not engage in conduct that constitutes a nuisance. Under NRS 202.470, a person',
          'who commits or maintains a public nuisance is guilty of a misdemeanor. Tenant may report',
          'suspected nuisances or building/housing code violations to Landlord in writing and/or to',
          'the appropriate local code enforcement agency. Landlord\'s procedure for receiving such',
          'reports is via the contact information stated in this Lease.',
        ].join('\n'),
    });

    disclosures.push({
      id: 'nv-flag',
      title: 'Right to Display United States Flag',
      statute: 'NRS 118A.325 (and related flag display protections)',
      category: 'required',
      reason: 'Nevada tenant flag-display rights',
        leaseText: [
          'Tenant has the right to display the flag of the United States on the premises in a manner',
        'consistent with Nevada law and any reasonable rules regarding size, placement, and safety.',
      ].join('\n'),
    });

    disclosures.push({
      id: 'nv-foreclosure-status',
      title: 'Foreclosure Proceedings Disclosure',
      statute: 'NRS 118A.275',
      category: flags.subjectToForeclosure ? 'conditional' : 'required',
      reason: flags.subjectToForeclosure
        ? 'Property is subject to foreclosure proceedings'
        : 'Affirmative disclosure required; property not currently in foreclosure',
      leaseText: flags.subjectToForeclosure
        ? [
            'WARNING: Landlord discloses that the property to be leased is the subject of foreclosure',
            'proceedings. Willful failure to disclose foreclosure proceedings is a deceptive trade practice.',
          ].join('\n')
        : [
            'Landlord discloses that, as of the date of this Lease, the property is not the subject of',
            'any foreclosure proceedings. If that status changes, Landlord will notify Tenant as required by law.',
          ].join('\n'),
    });

    if (isPre1978(property)) {
      disclosures.push({
        id: 'nv-lead-paint',
        title: 'Lead-Based Paint Disclosure',
        statute: '42 U.S.C. § 4852d (Federal Title X)',
        category: 'conditional',
        reason: `Property year built (${property.yearBuilt}) is before 1978`,
        leaseText: [
          'LEAD WARNING STATEMENT (Federal Title X)',
          'Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips,',
          'and dust can pose health hazards if not managed properly. Lead exposure is especially',
          'harmful to young children and pregnant women. Before renting pre-1978 housing,',
          'landlords must disclose the presence of known lead-based paint and/or lead-based paint',
          'hazards in the dwelling. Tenants must also receive a federally approved pamphlet on',
          'lead poisoning prevention ("Protect Your Family From Lead in Your Home").',
          'Landlord has no knowledge of lead-based paint and/or lead-based paint hazards in the',
          'housing except as otherwise disclosed in writing, and has provided Tenant any available',
          'records or reports pertaining to lead-based paint and/or lead-based paint hazards.',
        ].join('\n'),
      });
    }

    if (property.type === 'condo' || property.type === 'townhouse') {
      disclosures.push({
        id: 'nv-hoa',
        title: 'HOA / Common Interest Community Notice',
        category: 'conditional',
        reason: `Property type is ${property.type}`,
        leaseText: [
          'COMMON INTEREST COMMUNITY / HOA NOTICE',
          'This property is part of a common-interest community. Tenant acknowledges that occupancy',
          'is subject to the association\'s governing documents and rules. Tenant agrees to comply',
          'with those rules; association fines arising from Tenant violations may be charged to',
          'Tenant as additional rent where permitted.',
        ].join('\n'),
      });
    }
  }

  return disclosures;
};

export const getStateSpecificClauses = (state: State): string[] => {
  switch (state) {
    case 'NV':
      return [
        '<u>NEVADA SPECIFIC PROVISIONS</u>',
        '',
        'A. LANDLORD AND TENANT OBLIGATIONS (NRS 118A.200)',
        '   Both parties acknowledge that this lease agreement complies with Nevada Revised Statutes Chapter 118A.',
        '',
        'B. NUISANCE PROVISION (NRS 202.470)',
        '   Tenant agrees not to engage in any activity that constitutes a nuisance under Nevada law. A nuisance includes any activity that disturbs the peace, comfort, or repose of others. Violations may result in criminal penalties.',
        '',
        'C. EMERGENCY CONTACT INFORMATION',
        '   Landlord shall provide emergency contact information within the county or within 60 miles of the property.',
        '',
        'D. PROPERTY CONDITION RECORD',
        '   A separate inventory and condition record has been signed by both parties and is attached to this lease.',
        '',
        'E. U.S. FLAG DISPLAY',
        '   Tenant has the right to display the United States flag on the rental property in accordance with Nevada law.',
      ];
    case 'CA':
      return [
        '<u>CALIFORNIA SPECIFIC PROVISIONS</u>',
        '',
        '<u>1. CALIFORNIA CIVIL CODE COMPLIANCE</u>',
        '   This lease agreement complies with all applicable California Civil Code provisions including but not limited to Sections 1940-1954.6.',
        '',
        '<u>2. SECURITY DEPOSIT LIMITATION (AB 12)</u>',
        '   The security deposit is limited to one month\'s rent as required by California law for unfurnished residential properties, subject to statutory exceptions.',
        '',
        '<u>3. DISASTER AND EMERGENCY PROCEDURES (SB 610)</u>',
        '   In the event of a disaster, landlord shall provide detailed information about repairs and remediation within a reasonable time.',
      ];
    default:
      throw new Error(`Unsupported state: ${state}`);
  }
};

/**
 * Formats disclosures for lease generation as HTML cards matching the application layout.
 * Each disclosure becomes a card with title and text content.
 */
/**
 * Strips the duplicated title from the disclosure body. The body text typically
 * starts with the title in all caps, followed by the actual disclosure content.
 * This removes the first line if it duplicates the title.
 */
function stripDuplicateTitle(body: string, title: string, statute?: string): string {
  if (!body) return body;

  // Normalize a string for comparison: uppercase, replace special chars with spaces, collapse spaces
  const normalize = (s: string): string => {
    return s.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const titleNorm = normalize(title);
  const lines = body.split('\n');

  for (let i = 0; i < Math.min(2, lines.length); i++) {
    const line = lines[i].trim();
    const lineNorm = normalize(line);

    // Get significant words from the title (3+ chars)
    const titleWords = titleNorm.split(' ').filter(w => w.length >= 3);
    if (titleWords.length === 0) continue;

    // Check if all title words appear in order in the line (fuzzy prefix match)
    let allFound = true;
    let searchFrom = 0;
    for (const tw of titleWords) {
      const idx = lineNorm.indexOf(tw, searchFrom);
      if (idx === -1) {
        allFound = false;
        break;
      }
      searchFrom = idx + tw.length;
    }

    if (allFound) {
      lines.splice(i, 1);
      return lines.join('\n').trim();
    }
  }

  return body;
}

export const formatDisclosuresForLease = (property: Property): string => {
  const disclosures = getApplicableDisclosures(property);
  if (disclosures.length === 0) return '';

  return `
        <h2>8. REQUIRED AND APPLICABLE DISCLOSURES (${property.state === 'CA' ? 'California' : 'Nevada'})</h2>
        <ol>
        ${disclosures.map((d) => {
          const title = `${d.title}${d.statute ? ` (${d.statute})` : ''}`;
          const body = stripDuplicateTitle(d.leaseText, d.title, d.statute);
          return `<li><strong>${title}</strong><br>${body}</li>`;
        }).join('')}
        </ol>`;
};
