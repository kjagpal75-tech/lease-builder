export type State = 'CA' | 'NV';

export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'other';

export type SmokingPolicy = 'prohibited' | 'allowed' | 'restricted';

export interface Party {
  name: string;
  address: string;
  phone: string;
  email: string;
}

/** Property attributes that drive which disclosures apply */
export interface PropertyDisclosureFlags {
  inFloodHazardArea: boolean;
  nearMilitaryOrdnance: boolean;
  deathOnPropertyLast3Years: boolean;
  knownMoldHazard: boolean;
  pestControlContract: boolean;
  sharedUtilityMeters: boolean;
  subjectToForeclosure: boolean;
  knownAsbestos: boolean;
  demolitionPermitPending: boolean;
  methContaminationHistory: boolean;
  smokingPolicy: SmokingPolicy;
  /** CA AB 1482 single-family / duplex owner-occupied exemptions, etc. */
  ab1482Exempt: boolean;
}

export interface Property {
  address: string;
  city: string;
  state: State;
  zipCode: string;
  unitNumber?: string;
  type: PropertyType;
  yearBuilt?: number;
  /** Optional label for portfolio (e.g. "Lake Tahoe Cabin") */
  label?: string;
  county?: string;
  disclosureFlags: PropertyDisclosureFlags;
}

export interface OwnedProperty extends Property {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type RentPaymentSchedule = 'monthly' | 'prepaid';

export type HoldingDepositApplication =
  | 'credit_rent'
  | 'credit_security'
  | 'credit_rent_then_security';

export interface LeasePet {
  type: string;
  count: number;
}

export interface LeaseTerms {
  startDate: string;
  endDate: string;
  /** monthly = recurring monthly rent; prepaid = full term paid upfront (ski/seasonal) */
  paymentSchedule: RentPaymentSchedule;
  monthlyRent: number;
  /** Total rent for the full lease term when paymentSchedule is prepaid */
  totalRent?: number;
  securityDeposit: number;
  rentDueDay: number;
  /** When prepaid rent is due (defaults to lease start date in the form) */
  prepaidDueDate?: string;
  /**
   * Optional reservation / hold deposit to secure the tenancy when the lease
   * is signed before the start date (common for ski / seasonal leases).
   */
  holdingDeposit?: number;
  holdingDepositDueDate?: string;
  holdingDepositApplication?: HoldingDepositApplication;
  /** If Tenant cancels or fails to take occupancy, Landlord may retain the holding deposit */
  holdingDepositForfeitedIfTenantCancels?: boolean;
  /** Late fee as percent of periodic rent, capped at state max (e.g. 5) */
  lateFeePercent?: number;
  /** Dollar amount derived from lateFeePercent × rent (stored for PDF convenience) */
  lateFee?: number;
  /** Returned / NSF check fee — set to state statutory max */
  returnedCheckFee?: number;
  /** CA: subsequent NSF fee (Civil Code 1719); optional for NV */
  returnedCheckFeeSubsequent?: number;
  petsAllowed: boolean;
  /** Approved pets on the lease (type + count) */
  pets?: LeasePet[];
  petDeposit?: number;
  /** Monthly pet rent charged per pet */
  petRent?: number;
  occupants: string[];
  utilitiesIncluded: string[];
  utilitiesTenantResponsible: string[];
  /** Utilities landlord pays but tenant reimburses (added to rent) */
  utilitiesReimbursed?: string[];
  /** Monthly reimbursement amount per utility (if fixed) */
  utilityReimbursementAmounts?: Record<string, number>;
  /** Utilities checked by tenant/landlord for setup */
  checkedUtilities?: string[];
}

export interface Signature {
  name: string;
  signatureData: string;
  date: string;
  ipAddress: string;
  userAgent: string;
}

export interface LandlordProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoSigner {
  name: string;
  address: string;
  phone: string;
  email: string;
  relationship?: string;
}

export interface Attachment {
  data: string;
  filename: string;
  title: string;
}

export interface LeaseDocument {
  id: string;
  landlords: Party[];
  tenants: Party[];
  coSigners?: CoSigner[];
  property: Property;
  terms: LeaseTerms;
  landlordSignatures?: Signature[];
  tenantSignatures?: Signature[];
  coSignerSignatures?: Signature[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicableDisclosure {
  id: string;
  title: string;
  statute?: string;
  category: 'required' | 'conditional' | 'local';
  reason: string;
  leaseText: string;
}

export interface StateRequirements {
  requiredDisclosures: string[];
  requiredClauses: string[];
  maxSecurityDeposit: (rent: number) => number;
  /** Maximum late fee as a percentage of periodic rent (e.g. 5 = 5%) */
  maxLateFeePercent: number;
  maxLateFee: (rent: number) => number;
  /** Primary / first returned-check (NSF) fee max */
  maxReturnedCheckFee: number;
  /** Subsequent returned-check fee max (CA Civil Code 1719); same as first if N/A */
  maxReturnedCheckFeeSubsequent: number;
  /** Calendar days after rent due before a late fee may be imposed (NV = 3) */
  lateFeeGraceDays: number;
  lateFeeAuthority: string;
  returnedCheckFeeAuthority: string;
  additionalNotices: string[];
}

export const defaultDisclosureFlags = (): PropertyDisclosureFlags => ({
  inFloodHazardArea: false,
  nearMilitaryOrdnance: false,
  deathOnPropertyLast3Years: false,
  knownMoldHazard: false,
  pestControlContract: false,
  sharedUtilityMeters: false,
  subjectToForeclosure: false,
  knownAsbestos: false,
  demolitionPermitPending: false,
  methContaminationHistory: false,
  smokingPolicy: 'prohibited',
  ab1482Exempt: false,
});

export const emptyProperty = (state: State = 'CA'): Property => ({
  address: '',
  city: '',
  state,
  zipCode: '',
  type: 'apartment',
  disclosureFlags: defaultDisclosureFlags(),
});