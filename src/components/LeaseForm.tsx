'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  LeaseDocument,
  Party,
  Property,
  PropertyDisclosureFlags,
  LeaseTerms,
  OwnedProperty,
  HoldingDepositApplication,
  LeasePet,
  RentPaymentSchedule,
  SmokingPolicy,
  State,
  defaultDisclosureFlags,
  emptyProperty,
} from '@/types/lease';
import { v4 as uuidv4 } from 'uuid';
import { getApplicableDisclosures, getStateRequirements } from '@/lib/stateRequirements';
import { ownedPropertiesService } from '@/lib/ownedProperties';
import {
  normalizeLeaseTerms,
  rentForLimits,
  applyStateFeeDefaults,
  totalPetCount,
  totalMonthlyPetRent,
  totalLeasePetRent,
  totalMonthlyRent,
  totalMonthlyUtilityReimbursement,
} from '@/lib/storage';
import OwnedPropertiesManager from './OwnedPropertiesManager';
import { landlordProfilesService } from '@/lib/landlordProfiles';
import { CoSigner } from '@/types/lease';

interface LeaseFormProps {
  onSave: (lease: LeaseDocument) => void;
  initialData?: Partial<LeaseDocument>;
}

function normalizeProperty(property?: Partial<Property>): Property {
  const base = emptyProperty(property?.state || 'CA');
  return {
    ...base,
    ...property,
    disclosureFlags: {
      ...defaultDisclosureFlags(),
      ...(property?.disclosureFlags || {}),
    },
  };
}

export default function LeaseForm({ onSave, initialData }: LeaseFormProps) {
  const [landlords, setLandlords] = useState<Party[]>(
    initialData?.landlords || [{ name: '', address: '', phone: '', email: '' }]
  );
  const [tenants, setTenants] = useState<Party[]>(
    initialData?.tenants || [{ name: '', address: '', phone: '', email: '' }]
  );
  const [property, setProperty] = useState<Property>(
    normalizeProperty(initialData?.property)
  );
  const [terms, setTerms] = useState<LeaseTerms>(
    normalizeLeaseTerms(initialData?.terms)
  );
  // Store base rent separately for prepaid leases to avoid circular logic
  const [baseRent, setBaseRent] = useState<number>(() => {
    if (initialData?.terms?.paymentSchedule === 'prepaid' && initialData?.terms?.totalRent) {
      // When loading existing data, extract base rent from total
      return (initialData.terms.totalRent || 0) - totalLeasePetRent(initialData.terms);
    }
    return initialData?.terms?.totalRent || 0;
  });
  const isUpdatingTotalRent = useRef(false);
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);
  const [selectedOwnedId, setSelectedOwnedId] = useState<string>('');
  const [showPropertyManager, setShowPropertyManager] = useState(false);
  const [coSigners, setCoSigners] = useState<CoSigner[]>(
    initialData?.coSigners && initialData.coSigners.length > 0 ? initialData.coSigners : []
  );
  const [includeCoSigner, setIncludeCoSigner] = useState<boolean>(
    !!(initialData?.coSigners && initialData.coSigners.length > 0)
  );

  useEffect(() => {
    setOwnedProperties(ownedPropertiesService.getAll());
  }, []);

  // When loading initial data for prepaid leases, update baseRent state
  useEffect(() => {
    if (initialData?.terms && initialData.terms.paymentSchedule === 'prepaid' && initialData.terms.totalRent) {
      const petRentTotal = totalLeasePetRent(initialData.terms);
      const currentBaseRent = (initialData.terms.totalRent || 0) - petRentTotal;
      if (currentBaseRent >= 0) {
        setBaseRent(currentBaseRent);
      }
    }
  }, [initialData?.terms]);

  // Update baseRent when payment schedule changes to prepaid (but not during normal updates)
  useEffect(() => {
    if (terms.paymentSchedule === 'prepaid' && terms.totalRent && !isUpdatingTotalRent.current) {
      const petRentTotal = totalLeasePetRent(terms);
      const currentBaseRent = (terms.totalRent || 0) - petRentTotal;
      if (currentBaseRent >= 0) {
        setBaseRent(currentBaseRent);
      }
    }
  }, [terms.paymentSchedule, terms.totalRent]);

  // Keep late fee % and returned-check fees at state statutory / max amounts
  useEffect(() => {
    const fees = applyStateFeeDefaults(terms, property.state);
    setTerms((prev) => {
      if (
        prev.lateFeePercent === fees.lateFeePercent &&
        prev.lateFee === fees.lateFee &&
        prev.returnedCheckFee === fees.returnedCheckFee &&
        prev.returnedCheckFeeSubsequent === fees.returnedCheckFeeSubsequent
      ) {
        return prev;
      }
      return { ...prev, ...fees };
    });
    // Recalculate when state or rent inputs that affect limits change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    property.state,
    terms.monthlyRent,
    terms.totalRent,
    terms.paymentSchedule,
    terms.startDate,
    terms.endDate,
  ]);

  const applicableDisclosures = useMemo(
    () => getApplicableDisclosures(property),
    [property]
  );

  const stateRequirements = useMemo(
    () => getStateRequirements(property.state),
    [property.state]
  );

  const handlePartyChange = (party: 'landlord' | 'tenant', field: keyof Party, value: string, index?: number) => {
    if (party === 'landlord' && typeof index === 'number') {
      setLandlords(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    } else if (party === 'tenant' && typeof index === 'number') {
      setTenants(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  const addLandlord = () => {
    setLandlords(prev => [...prev, { name: '', address: '', phone: '', email: '' }]);
  };

  const removeLandlord = (index: number) => {
    setLandlords(prev => prev.filter((_, i) => i !== index));
  };

  const addTenant = () => {
    setTenants(prev => [...prev, { name: '', address: '', phone: '', email: '' }]);
  };

  const removeTenant = (index: number) => {
    setTenants(prev => prev.filter((_, i) => i !== index));
  };

  const copyFirstLandlordAddress = (index: number) => {
    if (landlords.length > 0 && landlords[0].address) {
      handlePartyChange('landlord', 'address', landlords[0].address, index);
    }
  };

  const copyFirstTenantAddress = (index: number) => {
    if (tenants.length > 0 && tenants[0].address) {
      handlePartyChange('tenant', 'address', tenants[0].address, index);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Check if the input is of correct length
    if (cleaned.length === 0) return '';
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (party: 'landlord' | 'tenant', value: string, index?: number) => {
    const formatted = formatPhoneNumber(value);
    handlePartyChange(party, 'phone', formatted, index);
  };

  const handlePropertyChange = <K extends keyof Property>(field: K, value: Property[K]) => {
    setSelectedOwnedId('');
    setProperty((prev) => ({ ...prev, [field]: value }));
  };

  const handleDisclosureFlagChange = <K extends keyof PropertyDisclosureFlags>(
    field: K,
    value: PropertyDisclosureFlags[K]
  ) => {
    setSelectedOwnedId('');
    setProperty((prev) => ({
      ...prev,
      disclosureFlags: { ...prev.disclosureFlags, [field]: value },
    }));
  };

  const handleSelectOwnedProperty = (id: string) => {
    setSelectedOwnedId(id);
    if (!id) return;
    const owned = ownedPropertiesService.getById(id);
    if (owned) {
      setProperty(normalizeProperty(owned));
    }
  };

  const handleSaveCurrentAsOwned = () => {
    if (!property.address.trim() || !property.city.trim() || !property.zipCode.trim()) {
      alert('Fill in address, city, and ZIP before saving to your portfolio.');
      return;
    }
    const saved = ownedPropertiesService.save({
      ...property,
      id: selectedOwnedId || undefined,
    });
    setOwnedProperties(ownedPropertiesService.getAll());
    setSelectedOwnedId(saved.id);
  };

  const handleTermsChange = (field: keyof LeaseTerms, value: any) => {
    setTerms(prev => ({ ...prev, [field]: value }));
  };

  const handleOccupantChange = (index: number, value: string) => {
    const newOccupants = [...terms.occupants];
    newOccupants[index] = value;
    setTerms(prev => ({ ...prev, occupants: newOccupants }));
  };

  const addOccupant = () => {
    setTerms(prev => ({ ...prev, occupants: [...prev.occupants, ''] }));
  };

  const removeOccupant = (index: number) => {
    setTerms(prev => ({
      ...prev,
      occupants: prev.occupants.filter((_, i) => i !== index)
    }));
  };

  const toggleUtility = (field: 'utilitiesIncluded' | 'utilitiesTenantResponsible', utility: string) => {
    const currentList = terms[field];
    const newList = currentList.includes(utility)
      ? currentList.filter(u => u !== utility)
      : [...currentList, utility];
    handleTermsChange(field, newList);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Check if phone matches (XXX) XXX-XXXX format
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone numbers
    for (const landlord of landlords) {
      if (!validatePhoneNumber(landlord.phone)) {
        alert(`Please enter a valid phone number for landlord ${landlord.name} in format (XXX) XXX-XXXX`);
        return;
      }
    }
    
    for (const tenant of tenants) {
      if (!validatePhoneNumber(tenant.phone)) {
        alert(`Please enter a valid phone number for tenant ${tenant.name} in format (XXX) XXX-XXXX`);
        return;
      }
    }
    
    const lease: LeaseDocument = {
      id: initialData?.id || uuidv4(),
      landlords,
      tenants,
      property: normalizeProperty(property),
      terms: normalizeLeaseTerms({
        ...terms,
        ...applyStateFeeDefaults(terms, property.state),
        prepaidDueDate:
          terms.paymentSchedule === 'prepaid'
            ? terms.prepaidDueDate || terms.startDate
            : terms.prepaidDueDate,
      }),
      coSigners: includeCoSigner ? coSigners : undefined,
      coSignerSignatures: initialData?.coSignerSignatures,
      landlordSignatures: initialData?.landlordSignatures,
      tenantSignatures: initialData?.tenantSignatures,
      attachments: initialData?.attachments || [],
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // For prepaid leases, totalRent is already calculated as baseRent + petRentTotal
    // in the form's onChange handler, so no additional adjustment is needed here.
    onSave(lease);
  };

  const commonUtilities = [
    'Water', 'Sewer', 'Garbage', 'Electricity', 'Gas',
    'Internet', 'Cable TV', 'HOA Fees', 'Landscaping', 'Snow Removal'
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        {initialData?.id ? 'Edit Lease Agreement' : 'New Lease Agreement'}
      </h1>

      {/* Landlord Information */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Landlord Information</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (landlords.length > 0 && landlords[0].name.trim()) {
                  landlordProfilesService.save({
                    name: landlords[0].name,
                    address: landlords[0].address,
                    phone: landlords[0].phone,
                    email: landlords[0].email,
                  });
                  alert('Landlord profile saved.');
                } else {
                  alert('Fill in the first landlord details before saving a profile.');
                }
              }}
              className="px-3 py-1 bg-green-50 text-green-800 rounded-md hover:bg-green-100 text-sm"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={addLandlord}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Add Landlord
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Load saved landlord profile
          </label>
          <select
            value=""
            onChange={(e) => {
              const profile = landlordProfilesService.getById(e.target.value);
              if (profile) {
                const party = landlordProfilesService.toParty(profile);
                setLandlords([party, ...landlords.slice(1)]);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="">Choose a saved profile…</option>
            {landlordProfilesService.getAll().map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
            ))}
          </select>
        </div>
        
        {landlords.map((landlord, index) => (
          <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700">
                Landlord {index + 1}
              </h3>
              {landlords.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLandlord(index)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={landlord.name}
                  onChange={(e) => handlePartyChange('landlord', 'name', e.target.value, index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={landlord.phone}
                  onChange={(e) => handlePhoneChange('landlord', e.target.value, index)}
                  placeholder="(XXX) XXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">Address *</label>
                  {index > 0 && landlords[0].address && (
                    <button
                      type="button"
                      onClick={() => copyFirstLandlordAddress(index)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Copy from first landlord
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={landlord.address}
                  onChange={(e) => handlePartyChange('landlord', 'address', e.target.value, index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={landlord.email}
                  onChange={(e) => handlePartyChange('landlord', 'email', e.target.value, index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Tenant Information */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Tenant Information</h2>
          <button
            type="button"
            onClick={addTenant}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Add Tenant
          </button>
        </div>
        
        {tenants.map((tenant, index) => (
          <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700">
                Tenant {index + 1}
              </h3>
              {tenants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTenant(index)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={tenant.name}
                  onChange={(e) => handlePartyChange('tenant', 'name', e.target.value, index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={tenant.phone}
                  onChange={(e) => handlePhoneChange('tenant', e.target.value, index)}
                  placeholder="(XXX) XXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">Address *</label>
                  {index > 0 && tenants[0].address && (
                    <button
                      type="button"
                      onClick={() => copyFirstTenantAddress(index)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Copy from first tenant
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={tenant.address}
                  onChange={(e) => handlePartyChange('tenant', 'address', e.target.value, index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={tenant.email}
                  onChange={(e) => handlePartyChange('tenant', 'email', e.target.value, index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Property Information */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Property Information</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPropertyManager(true)}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
            >
              Manage My Properties
            </button>
            <button
              type="button"
              onClick={handleSaveCurrentAsOwned}
              className="px-3 py-1 bg-blue-50 text-blue-800 rounded-md hover:bg-blue-100 text-sm"
            >
              Save to Portfolio
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select a property you own
          </label>
          <select
            value={selectedOwnedId}
            onChange={(e) => handleSelectOwnedProperty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="">
              {ownedProperties.length === 0
                ? 'No saved properties — add one via Manage My Properties'
                : 'Choose from portfolio…'}
            </option>
            {ownedProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {ownedPropertiesService.displayLabel(p)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Selecting a property fills address, type, year built, and disclosure conditions automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (optional)</label>
            <input
              type="text"
              value={property.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              placeholder="e.g. Lake Street duplex"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
            <input
              type="text"
              required
              value={property.address}
              onChange={(e) => handlePropertyChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              required
              value={property.city}
              onChange={(e) => handlePropertyChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <select
              required
              value={property.state}
              onChange={(e) => handlePropertyChange('state', e.target.value as State)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="CA">California</option>
              <option value="NV">Nevada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
            <input
              type="text"
              required
              value={property.zipCode}
              onChange={(e) => handlePropertyChange('zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County (Optional)</label>
            <input
              type="text"
              value={property.county || ''}
              onChange={(e) => handlePropertyChange('county', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number (Optional)</label>
            <input
              type="text"
              value={property.unitNumber || ''}
              onChange={(e) => handlePropertyChange('unitNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
            <select
              required
              value={property.type}
              onChange={(e) => handlePropertyChange('type', e.target.value as Property['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
            <input
              type="number"
              value={property.yearBuilt || ''}
              onChange={(e) => handlePropertyChange('yearBuilt', parseInt(e.target.value) || undefined)}
              placeholder="Required for lead-paint rules (pre-1978)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Smoking Policy *</label>
            <select
              required
              value={property.disclosureFlags.smokingPolicy}
              onChange={(e) =>
                handleDisclosureFlagChange('smokingPolicy', e.target.value as SmokingPolicy)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="prohibited">Prohibited</option>
              <option value="restricted">Restricted</option>
              <option value="allowed">Allowed</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Property conditions (drive which disclosures are added)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(
              [
                { key: 'inFloodHazardArea', label: 'In FEMA / special flood hazard area', states: ['CA'] as State[] },
                { key: 'nearMilitaryOrdnance', label: 'Within 1 mile of former military ordnance site', states: ['CA'] as State[] },
                { key: 'deathOnPropertyLast3Years', label: 'Death on property in last 3 years', states: ['CA'] as State[] },
                { key: 'knownMoldHazard', label: 'Known mold hazard', states: ['CA'] as State[] },
                { key: 'pestControlContract', label: 'Periodic pest-control service contract', states: ['CA'] as State[] },
                { key: 'sharedUtilityMeters', label: 'Shared gas/electric meters', states: ['CA'] as State[] },
                { key: 'knownAsbestos', label: 'Known asbestos-containing materials', states: ['CA'] as State[] },
                { key: 'demolitionPermitPending', label: 'Demolition permit pending', states: ['CA'] as State[] },
                { key: 'methContaminationHistory', label: 'Meth / contamination history', states: ['CA'] as State[] },
                { key: 'ab1482Exempt', label: 'AB 1482 exempt (with proper notice)', states: ['CA'] as State[] },
                { key: 'subjectToForeclosure', label: 'Subject to foreclosure proceedings', states: ['NV'] as State[] },
              ] as const
            )
              .filter((item) => item.states.includes(property.state))
              .map((item) => (
                <label key={item.key} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(property.disclosureFlags[item.key])}
                    onChange={(e) =>
                      handleDisclosureFlagChange(item.key, e.target.checked as never)
                    }
                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
          </div>
        </div>
      </section>

      {/* Applicable Disclosures Preview */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Applicable Disclosures ({property.state})
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          These disclosures will be included in the lease PDF based on state, city, property type,
          year built, and the conditions above. Max security deposit guidance:{' '}
          {rentForLimits(terms) > 0
            ? `$${stateRequirements.maxSecurityDeposit(rentForLimits(terms)).toFixed(2)}`
            : 'enter rent to calculate'}.
        </p>
        {applicableDisclosures.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Select a state to see disclosures.</p>
        ) : (
          <ul className="space-y-3">
            {applicableDisclosures.map((d) => (
              <li key={d.id} className="border border-gray-200 rounded-md p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{d.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      d.category === 'required'
                        ? 'bg-blue-100 text-blue-800'
                        : d.category === 'local'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {d.category}
                  </span>
                </div>
                {d.statute && (
                  <p className="text-xs text-gray-500 mt-0.5">{d.statute}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">{d.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showPropertyManager && (
        <OwnedPropertiesManager
          onClose={() => setShowPropertyManager(false)}
          onChanged={(list) => setOwnedProperties(list)}
        />
      )}

      {/* Co-Signer (Optional) */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Co-Signer</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Optional</span>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
          <input
            type="checkbox"
            checked={includeCoSigner}
            onChange={(e) => {
              const checked = e.target.checked;
              setIncludeCoSigner(checked);
              if (checked && coSigners.length === 0) {
                setCoSigners([{ name: '', address: '', phone: '', email: '' }]);
              } else if (!checked) {
                setCoSigners([]);
              }
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          Include a co-signer (guarantor) for this lease
        </label>
        <p className="text-xs text-gray-500 mb-4">
          A co-signer guarantees the tenant's obligations under this lease and may be held jointly and severally liable for rent, damages, and other lease obligations per applicable rental laws.
        </p>
        {includeCoSigner && coSigners.map((coSigner, index) => (
          <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700">Co-Signer {index + 1}</h3>
              {coSigners.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCoSigners(coSigners.filter((_, i) => i !== index))}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required={includeCoSigner}
                  value={coSigner.name}
                  onChange={(e) => {
                    const updated = [...coSigners];
                    updated[index] = { ...updated[index], name: e.target.value };
                    setCoSigners(updated);
                  }}
                  placeholder="Co-signer full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required={includeCoSigner}
                  value={coSigner.phone}
                  onChange={(e) => {
                    const updated = [...coSigners];
                    updated[index] = { ...updated[index], phone: formatPhoneNumber(e.target.value) };
                    setCoSigners(updated);
                  }}
                  placeholder="(XXX) XXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  required={includeCoSigner}
                  value={coSigner.address}
                  onChange={(e) => {
                    const updated = [...coSigners];
                    updated[index] = { ...updated[index], address: e.target.value };
                    setCoSigners(updated);
                  }}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required={includeCoSigner}
                  value={coSigner.email}
                  onChange={(e) => {
                    const updated = [...coSigners];
                    updated[index] = { ...updated[index], email: e.target.value };
                    setCoSigners(updated);
                  }}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Tenant (Optional)</label>
                <input
                  type="text"
                  value={coSigner.relationship || ''}
                  onChange={(e) => {
                    const updated = [...coSigners];
                    updated[index] = { ...updated[index], relationship: e.target.value };
                    setCoSigners(updated);
                  }}
                  placeholder="e.g. Parent, Employer, Relative"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
            </div>
          </div>
        ))}
        {includeCoSigner && (
          <button
            type="button"
            onClick={() => setCoSigners([...coSigners, { name: '', address: '', phone: '', email: '' }])}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            + Add Co-Signer
          </button>
        )}
      </section>

      {/* Lease Terms */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Lease Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={terms.startDate}
              onChange={(e) => handleTermsChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              required
              value={terms.endDate}
              onChange={(e) => handleTermsChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rent Payment Schedule *
            </label>
            <select
              required
              value={terms.paymentSchedule}
              onChange={(e) => {
                const schedule = e.target.value as RentPaymentSchedule;
                setTerms((prev) => ({
                  ...prev,
                  paymentSchedule: schedule,
                  prepaidDueDate:
                    schedule === 'prepaid'
                      ? prev.prepaidDueDate || prev.startDate || ''
                      : prev.prepaidDueDate,
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="monthly">Monthly rent (standard)</option>
              <option value="prepaid">Prepaid for full term (ski / seasonal lease)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Ski / seasonal leases typically charge the entire term rent up front instead of monthly installments.
            </p>
          </div>
          {terms.paymentSchedule === 'prepaid' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Rent for Lease Term ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={baseRent || ''}
                  onChange={(e) => {
                    const newBaseRent = parseFloat(e.target.value) || 0;
                    setBaseRent(newBaseRent);
                    isUpdatingTotalRent.current = true;
                    const petRentTotal = totalLeasePetRent(terms);
                    handleTermsChange('totalRent', newBaseRent + petRentTotal);
                    setTimeout(() => { isUpdatingTotalRent.current = false; }, 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Base rent without pet fees
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm font-medium text-blue-900">
                  Total Due: ${((baseRent + totalLeasePetRent(terms))).toFixed(2)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Breakdown: Base rent $${baseRent.toFixed(2)} + Pet rent $${totalLeasePetRent(terms).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prepaid Rent Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={terms.prepaidDueDate || terms.startDate || ''}
                  onChange={(e) => handleTermsChange('prepaidDueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent Equivalent ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={terms.monthlyRent || ''}
                  onChange={(e) =>
                    handleTermsChange('monthlyRent', parseFloat(e.target.value) || 0)
                  }
                  placeholder="Optional — used for deposit cap guidance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional. Helps calculate CA/NV security deposit limits for seasonal leases.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={terms.monthlyRent}
                  onChange={(e) => handleTermsChange('monthlyRent', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day *</label>
                <select
                  required
                  value={terms.rentDueDay}
                  onChange={(e) => handleTermsChange('rentDueDay', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={terms.securityDeposit}
              onChange={(e) => handleTermsChange('securityDeposit', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
            />
          </div>
          <div className="md:col-span-2 border border-dashed border-gray-300 rounded-md p-4 space-y-4 bg-gray-50">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(terms.holdingDeposit && terms.holdingDeposit > 0)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTerms((prev) => ({
                        ...prev,
                        holdingDeposit: prev.holdingDeposit && prev.holdingDeposit > 0 ? prev.holdingDeposit : 500,
                        holdingDepositDueDate: prev.holdingDepositDueDate || new Date().toISOString().slice(0, 10),
                        holdingDepositApplication: prev.holdingDepositApplication || 'credit_rent',
                        holdingDepositForfeitedIfTenantCancels:
                          prev.holdingDepositForfeitedIfTenantCancels ?? true,
                      }));
                    } else {
                      setTerms((prev) => ({
                        ...prev,
                        holdingDeposit: undefined,
                        holdingDepositDueDate: undefined,
                      }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                Holding / reservation deposit (secure tenant before start date)
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Recommended for ski / seasonal leases signed weeks or months before occupancy.
              </p>
            </div>
            {terms.holdingDeposit !== undefined && terms.holdingDeposit > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Holding Deposit Amount ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={terms.holdingDeposit}
                    onChange={(e) =>
                      handleTermsChange('holdingDeposit', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Holding Deposit Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={terms.holdingDepositDueDate || ''}
                    onChange={(e) => handleTermsChange('holdingDepositDueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applied at move-in toward *
                  </label>
                  <select
                    value={terms.holdingDepositApplication || 'credit_rent'}
                    onChange={(e) =>
                      handleTermsChange(
                        'holdingDepositApplication',
                        e.target.value as HoldingDepositApplication
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="credit_rent">Credited toward rent</option>
                    <option value="credit_security">Credited toward security deposit</option>
                    <option value="credit_rent_then_security">
                      Credited toward rent first, remainder to security deposit
                    </option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={terms.holdingDepositForfeitedIfTenantCancels !== false}
                      onChange={(e) =>
                        handleTermsChange(
                          'holdingDepositForfeitedIfTenantCancels',
                          e.target.checked
                        )
                      }
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span>
                      If tenant cancels or does not take occupancy, landlord may retain the holding
                      deposit (liquidated damages for holding the unit off-market). Landlord must
                      still refund it if landlord fails to deliver possession.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Late Fee ({stateRequirements.maxLateFeePercent}% of rent)
            </label>
            <input
              type="text"
              readOnly
              value={
                terms.lateFee != null && terms.lateFee > 0
                  ? `${terms.lateFeePercent ?? stateRequirements.maxLateFeePercent}% = $${terms.lateFee.toFixed(2)}`
                  : `${stateRequirements.maxLateFeePercent}% (enter rent to calculate $)`
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              {stateRequirements.lateFeeAuthority}
              {stateRequirements.lateFeeGraceDays > 0
                ? ` Grace: ${stateRequirements.lateFeeGraceDays} calendar days after due date.`
                : ''}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Returned Check Fee ($)
            </label>
            <input
              type="text"
              readOnly
              value={
                property.state === 'CA'
                  ? `$${stateRequirements.maxReturnedCheckFee.toFixed(2)} first / $${stateRequirements.maxReturnedCheckFeeSubsequent.toFixed(2)} subsequent`
                  : `$${stateRequirements.maxReturnedCheckFee.toFixed(2)}`
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              {stateRequirements.returnedCheckFeeAuthority}
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="petsAllowed"
              checked={terms.petsAllowed}
              onChange={(e) => {
                const allowed = e.target.checked;
                setTerms((prev) => ({
                  ...prev,
                  petsAllowed: allowed,
                  pets: allowed
                    ? prev.pets && prev.pets.length > 0
                      ? prev.pets
                      : [{ type: 'Dog', count: 1 }]
                    : [],
                }));
              }}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="petsAllowed" className="text-sm font-medium text-gray-700">Pets Allowed</label>
          </div>
          {terms.petsAllowed && (
            <div className="md:col-span-2 border border-dashed border-gray-300 rounded-md p-4 space-y-4 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">Pets on this lease</p>
                <div className="space-y-2">
                  {(terms.pets || []).map((pet, index) => (
                    <div key={index} className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <input
                          type="text"
                          list="pet-type-options"
                          required
                          value={pet.type}
                          onChange={(e) => {
                            const pets = [...(terms.pets || [])];
                            pets[index] = { ...pets[index], type: e.target.value };
                            handleTermsChange('pets', pets as LeasePet[]);
                            // Update total rent when pets change for prepaid leases
                            if (terms.paymentSchedule === 'prepaid') {
                              const newPetRentTotal = totalLeasePetRent({ ...terms, pets });
                              handleTermsChange('totalRent', baseRent + newPetRentTotal);
                            }
                          }}
                          placeholder="Dog, Cat, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Breed</label>
                        <input
                          type="text"
                          value={pet.breed || ''}
                          onChange={(e) => {
                            const pets = [...(terms.pets || [])];
                            pets[index] = { ...pets[index], breed: e.target.value };
                            handleTermsChange('pets', pets as LeasePet[]);
                          }}
                          placeholder="e.g. Golden Retriever"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={pet.age || ''}
                          onChange={(e) => {
                            const pets = [...(terms.pets || [])];
                            pets[index] = { ...pets[index], age: parseInt(e.target.value, 10) || undefined };
                            handleTermsChange('pets', pets as LeasePet[]);
                          }}
                          placeholder="Years"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const pets = (terms.pets || []).filter((_, i) => i !== index);
                          handleTermsChange('pets', pets);
                          // Update total rent when pets change for prepaid leases
                          if (terms.paymentSchedule === 'prepaid') {
                            const newPetRentTotal = totalLeasePetRent({ ...terms, pets });
                            handleTermsChange('totalRent', baseRent + newPetRentTotal);
                          }
                        }}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <datalist id="pet-type-options">
                  <option value="Dog" />
                  <option value="Cat" />
                  <option value="Bird" />
                  <option value="Fish" />
                  <option value="Rabbit" />
                  <option value="Other" />
                </datalist>
                <button
                  type="button"
                  onClick={() => {
                    const newPets = [
                      ...(terms.pets || []),
                      { type: '', count: 1 },
                    ];
                    handleTermsChange('pets', newPets);
                    // Update total rent when pets change for prepaid leases
                    if (terms.paymentSchedule === 'prepaid') {
                      const newPetRentTotal = totalLeasePetRent({ ...terms, pets: newPets });
                      handleTermsChange('totalRent', baseRent + newPetRentTotal);
                    }
                  }}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  + Add pet type
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pet Deposit ($ total)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={terms.petDeposit || ''}
                    onChange={(e) => handleTermsChange('petDeposit', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Rent ($ per pet / month)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={terms.petRent || ''}
                    onChange={(e) => {
                      const newPetRent = parseFloat(e.target.value) || undefined;
                      handleTermsChange('petRent', newPetRent);
                      // Update total rent when pet rent changes for prepaid leases
                      if (terms.paymentSchedule === 'prepaid') {
                        const newPetRentTotal = newPetRent ? totalLeasePetRent({ ...terms, petRent: newPetRent }) : 0;
                        handleTermsChange('totalRent', baseRent + newPetRentTotal);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {(() => {
                      if (totalPetCount(terms) > 0 && (terms.petRent || 0) > 0) {
                        const monthlyTotal = totalMonthlyPetRent(terms);
                        if (terms.paymentSchedule === 'prepaid' && terms.startDate && terms.endDate) {
                          const leaseTotal = totalLeasePetRent(terms);
                          return `${totalPetCount(terms)} pet(s) × $${(terms.petRent || 0).toFixed(2)}/month = $${monthlyTotal.toFixed(2)}/month total = $${leaseTotal.toFixed(2)} for full lease term`;
                        }
                        return `${totalPetCount(terms)} pet(s) × $${(terms.petRent || 0).toFixed(2)} = $${monthlyTotal.toFixed(2)}/month total`;
                      }
                      return 'Total pet rent = rate × number of pets';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Non-Refundable Pet Fee ($ one-time)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={terms.nonRefundableFee || ''}
                    onChange={(e) => handleTermsChange('nonRefundableFee', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    One-time fee for professional carpet cleaning and deodorization upon move-out.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Occupants */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Occupants (Optional)</label>
          <p className="text-xs text-gray-500 mb-2">Children, elderly parents, or other dependents living on the property (not responsible for lease)</p>
          {terms.occupants.length > 0 ? (
            terms.occupants.map((occupant, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={occupant}
                  onChange={(e) => handleOccupantChange(index, e.target.value)}
                  placeholder="Occupant name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeOccupant(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">No additional occupants</p>
          )}
          <button
            type="button"
            onClick={addOccupant}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Occupant
          </button>
        </div>

        {/* Utilities */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Utilities Included (Landlord Paid — No Charge)</label>
            <div className="space-y-2">
              {commonUtilities.map(utility => (
                <label key={utility} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={terms.utilitiesIncluded.includes(utility)}
                    onChange={() => toggleUtility('utilitiesIncluded', utility)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{utility}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Responsible (Direct to Utility)</label>
            <div className="space-y-2">
              {commonUtilities.map(utility => (
                <label key={utility} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={terms.utilitiesTenantResponsible.includes(utility)}
                    onChange={() => toggleUtility('utilitiesTenantResponsible', utility)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{utility}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Landlord-Paid / Tenant-Reimbursed Utilities */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Landlord-Paid Utilities — Tenant Reimburses Landlord</h3>
          <p className="text-xs text-gray-500 mb-3">
            Utilities the landlord pays directly but the tenant reimburses (added to monthly rent). These cannot be transferred to the renter's name.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Reimbursed Utilities</label>
              <div className="space-y-2">
                {commonUtilities.map(utility => (
                  <label key={utility} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(terms.utilitiesReimbursed || []).includes(utility)}
                      onChange={() => {
                        const current = terms.utilitiesReimbursed || [];
                        const updated = current.includes(utility)
                          ? current.filter(u => u !== utility)
                          : [...current, utility];
                        handleTermsChange('utilitiesReimbursed', updated);
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{utility}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Reimbursement Amounts ($)</label>
              <div className="space-y-2">
                {(terms.utilitiesReimbursed || []).map((utility) => (
                  <div key={utility} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-24">{utility}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={terms.utilityReimbursementAmounts?.[utility] || ''}
                      onChange={(e) => {
                        const amounts = { ...(terms.utilityReimbursementAmounts || {}) };
                        amounts[utility] = parseFloat(e.target.value) || 0;
                        handleTermsChange('utilityReimbursementAmounts', amounts);
                      }}
                      placeholder="0.00"
                      className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                    />
                  </div>
                ))}
                {(terms.utilitiesReimbursed || []).length === 0 && (
                  <p className="text-xs text-gray-400 italic">Select utilities above to enter amounts.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Monthly Rent Summary</h3>
        <div className="space-y-1 text-sm">
          <p className="text-blue-800">
            <strong>Base Rent:</strong> ${terms.monthlyRent.toFixed(2)}
          </p>
          {totalMonthlyUtilityReimbursement(terms) > 0 && (
            <p className="text-blue-800">
              <strong>Utility Reimbursements:</strong> ${totalMonthlyUtilityReimbursement(terms).toFixed(2)}
            </p>
          )}
          <p className="text-blue-900 font-bold text-base border-t border-blue-200 pt-1 mt-1">
            <strong>Total Monthly Rent:</strong> ${totalMonthlyRent(terms).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
        >
          Save Lease Agreement
        </button>
      </div>
    </form>
  );
}