import {
  LeaseDocument,
  LeaseTerms,
  State,
  defaultDisclosureFlags,
  emptyProperty,
} from '@/types/lease';
import { getStateRequirements } from './stateRequirements';

/** Format date string (YYYY-MM-DD or ISO) to local date string without timezone issues */
export function formatLocalDate(dateString: string): string {
  if (!dateString) return '';
  // Handle ISO date strings by splitting at T to get just the date part
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  // Parse the date string (YYYY-MM-DD) to avoid timezone issues
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
}

const STORAGE_KEY = 'lease_builder_documents';

export function normalizeLeaseTerms(terms?: Partial<LeaseTerms>): LeaseTerms {
  const normalizedPets = (terms?.pets || [])
    .map((p) => ({
      type: (p.type || '').trim(),
      count: Math.max(1, Number(p.count) || 1),
      breed: p.breed || undefined,
      age: p.age ? Number(p.age) : undefined,
    }))
    .filter((p) => p.type.length > 0);
  
  return {
    startDate: terms?.startDate || '',
    endDate: terms?.endDate || '',
    paymentSchedule: terms?.paymentSchedule || 'monthly',
    monthlyRent: terms?.monthlyRent ?? 0,
    totalRent: terms?.totalRent,
    securityDeposit: terms?.securityDeposit ?? 0,
    rentDueDay: terms?.rentDueDay ?? 1,
    prepaidDueDate: terms?.prepaidDueDate,
    holdingDeposit: terms?.holdingDeposit,
    holdingDepositDueDate: terms?.holdingDepositDueDate,
    holdingDepositApplication: terms?.holdingDepositApplication || 'credit_rent',
    holdingDepositForfeitedIfTenantCancels:
      terms?.holdingDepositForfeitedIfTenantCancels ?? true,
    lateFeePercent: terms?.lateFeePercent,
    lateFee: terms?.lateFee,
    returnedCheckFee: terms?.returnedCheckFee,
    returnedCheckFeeSubsequent: terms?.returnedCheckFeeSubsequent,
    petsAllowed: terms?.petsAllowed ?? false,
    pets: normalizedPets,
    petDeposit: terms?.petDeposit,
    petRent: terms?.petRent,
    occupants: terms?.occupants || [],
    utilitiesIncluded: terms?.utilitiesIncluded || [],
    utilitiesTenantResponsible: terms?.utilitiesTenantResponsible || [],
    utilitiesReimbursed: terms?.utilitiesReimbursed || [],
    utilityReimbursementAmounts: terms?.utilityReimbursementAmounts || {},
  };
}

/** Amount used for deposit / late-fee statutory guidance */
export function rentForLimits(terms: LeaseTerms): number {
  if (terms.paymentSchedule === 'prepaid') {
    if (terms.monthlyRent > 0) return terms.monthlyRent;
    const total = terms.totalRent || 0;
    if (!terms.startDate || !terms.endDate || total <= 0) return total;
    const start = new Date(terms.startDate);
    const end = new Date(terms.endDate);
    const months = Math.max(
      1,
      (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        (end.getDate() >= start.getDate() ? 0 : -1)
    );
    return total / months;
  }
  return terms.monthlyRent;
}

/** Apply state-maximum late fee % and returned-check fees; recompute late $ from rent. */
export function applyStateFeeDefaults(
  terms: LeaseTerms,
  state: State
): Pick<
  LeaseTerms,
  | 'lateFeePercent'
  | 'lateFee'
  | 'returnedCheckFee'
  | 'returnedCheckFeeSubsequent'
> {
  const req = getStateRequirements(state);
  const rent = rentForLimits(terms);
  const percent = req.maxLateFeePercent;
  const lateFee =
    rent > 0 ? Math.round(rent * (percent / 100) * 100) / 100 : undefined;

  return {
    lateFeePercent: percent,
    lateFee,
    returnedCheckFee: req.maxReturnedCheckFee,
    returnedCheckFeeSubsequent: req.maxReturnedCheckFeeSubsequent,
  };
}

/** Calculate total monthly utility reimbursement amount */
export function totalMonthlyUtilityReimbursement(terms: LeaseTerms): number {
  const amounts = terms.utilityReimbursementAmounts || {};
  return Object.values(amounts).reduce((sum, amount) => sum + (amount || 0), 0);
}

/** Calculate total monthly rent including utility reimbursements */
export function totalMonthlyRent(terms: LeaseTerms): number {
  return terms.monthlyRent + totalMonthlyUtilityReimbursement(terms);
}

export function formatRentSummary(terms: LeaseTerms): string {
  const utilityReimbursement = totalMonthlyUtilityReimbursement(terms);
  if (terms.paymentSchedule === 'prepaid') {
    const total = terms.totalRent ?? 0;
    const petRentTotal = totalLeasePetRent(terms);
    const baseRent = total - petRentTotal;
    if (petRentTotal > 0) {
      return `$${total.toFixed(2)} prepaid (base: $${baseRent.toFixed(2)} + pet rent: $${petRentTotal.toFixed(2)})`;
    }
    return `$${total.toFixed(2)} prepaid`;
  }
  const baseRent = terms.monthlyRent;
  const totalRent = baseRent + utilityReimbursement;
  if (utilityReimbursement > 0) {
    return `$${totalRent.toFixed(2)}/month (base rent: $${baseRent.toFixed(2)} + utility reimbursements: $${utilityReimbursement.toFixed(2)})`;
  }
  return `$${terms.monthlyRent.toFixed(2)}/month`;
}

export function totalPetCount(terms: LeaseTerms): number {
  if (!terms.petsAllowed) return 0;
  return (terms.pets || []).reduce((sum, pet) => sum + (pet.count || 0), 0);
}

/** Monthly pet rent total (per-pet rate × number of pets) */
export function totalMonthlyPetRent(terms: LeaseTerms): number {
  const count = totalPetCount(terms);
  if (count <= 0 || !terms.petRent) return 0;
  return Math.round(terms.petRent * count * 100) / 100;
}

/** Total pet rent for the entire lease term (monthly pet rent × number of months) */
export function totalLeasePetRent(terms: LeaseTerms): number {
  const monthlyPetRent = totalMonthlyPetRent(terms);
  if (monthlyPetRent <= 0) return 0;
  
  if (!terms.startDate || !terms.endDate) return 0;
  
  const start = new Date(terms.startDate);
  const end = new Date(terms.endDate);
  const months = Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      (end.getDate() >= start.getDate() ? 0 : -1)
  );
  
  return Math.round(monthlyPetRent * months * 100) / 100;
}

export function formatPetsSummary(terms: LeaseTerms): string {
  if (!terms.petsAllowed) return 'No pets permitted';
  const pets = terms.pets || [];
  if (pets.length === 0) return 'Pets permitted (none specified)';
  return pets.map((p) => `${p.count} ${p.type}${p.count === 1 ? '' : 's'}`).join(', ');
}

function normalizeLease(lease: LeaseDocument): LeaseDocument {
  const terms = normalizeLeaseTerms(lease.terms);
  const fees = applyStateFeeDefaults(terms, lease.property?.state || 'CA');
  return {
    ...lease,
    property: {
      ...emptyProperty(lease.property?.state || 'CA'),
      ...lease.property,
      disclosureFlags: {
        ...defaultDisclosureFlags(),
        ...(lease.property?.disclosureFlags || {}),
      },
    },
    terms: { ...terms, ...fees },
  };
}

export const storageService = {
  getAllLeases: (): LeaseDocument[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const leases: LeaseDocument[] = data ? JSON.parse(data) : [];
      return leases.map(normalizeLease);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveLease: (lease: LeaseDocument): void => {
    if (typeof window === 'undefined') return;
    try {
      const leases = storageService.getAllLeases();
      const normalized = normalizeLease(lease);
      const existingIndex = leases.findIndex((l) => l.id === normalized.id);

      if (existingIndex >= 0) {
        leases[existingIndex] = normalized;
      } else {
        leases.push(normalized);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(leases));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  getLeaseById: (id: string): LeaseDocument | null => {
    if (typeof window === 'undefined') return null;
    try {
      const leases = storageService.getAllLeases();
      return leases.find((l) => l.id === id) || null;
    } catch (error) {
      console.error('Error reading lease from localStorage:', error);
      return null;
    }
  },

  deleteLease: (id: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const leases = storageService.getAllLeases();
      const filtered = leases.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  },

  clearAllLeases: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};
