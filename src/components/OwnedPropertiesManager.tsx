'use client';

import { useEffect, useState } from 'react';
import {
  OwnedProperty,
  Property,
  PropertyDisclosureFlags,
  PropertyType,
  SmokingPolicy,
  State,
  defaultDisclosureFlags,
  emptyProperty,
} from '@/types/lease';
import { ownedPropertiesService } from '@/lib/ownedProperties';

interface OwnedPropertiesManagerProps {
  onClose: () => void;
  onChanged: (properties: OwnedProperty[]) => void;
  editingId?: string | null;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 bg-white';

export default function OwnedPropertiesManager({
  onClose,
  onChanged,
  editingId = null,
}: OwnedPropertiesManagerProps) {
  const [properties, setProperties] = useState<OwnedProperty[]>([]);
  const [form, setForm] = useState<Property>(emptyProperty('CA'));
  const [activeId, setActiveId] = useState<string | null>(editingId);

  const refresh = () => {
    const all = ownedPropertiesService.getAll();
    setProperties(all);
    onChanged(all);
  };

  useEffect(() => {
    refresh();
    if (editingId) {
      const existing = ownedPropertiesService.getById(editingId);
      if (existing) {
        setForm({
          address: existing.address,
          city: existing.city,
          state: existing.state,
          zipCode: existing.zipCode,
          unitNumber: existing.unitNumber,
          type: existing.type,
          yearBuilt: existing.yearBuilt,
          label: existing.label,
          county: existing.county,
          disclosureFlags: {
            ...defaultDisclosureFlags(),
            ...existing.disclosureFlags,
          },
        });
        setActiveId(editingId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const updateField = <K extends keyof Property>(field: K, value: Property[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateFlag = <K extends keyof PropertyDisclosureFlags>(
    field: K,
    value: PropertyDisclosureFlags[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      disclosureFlags: { ...prev.disclosureFlags, [field]: value },
    }));
  };

  const resetForm = () => {
    setForm(emptyProperty('CA'));
    setActiveId(null);
  };

  const handleSave = () => {
    if (!form.address.trim() || !form.city.trim() || !form.zipCode.trim()) {
      alert('Address, city, and ZIP code are required.');
      return;
    }
    ownedPropertiesService.save({
      ...form,
      id: activeId || undefined,
    });
    refresh();
    resetForm();
  };

  const handleEdit = (property: OwnedProperty) => {
    setActiveId(property.id);
    setForm({
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      unitNumber: property.unitNumber,
      type: property.type,
      yearBuilt: property.yearBuilt,
      label: property.label,
      county: property.county,
      disclosureFlags: {
        ...defaultDisclosureFlags(),
        ...property.disclosureFlags,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this property from your portfolio?')) return;
    ownedPropertiesService.delete(id);
    if (activeId === id) resetForm();
    refresh();
  };

  const flagCheckboxes: { key: keyof PropertyDisclosureFlags; label: string; states?: State[] }[] = [
    { key: 'inFloodHazardArea', label: 'In FEMA / special flood hazard area', states: ['CA'] },
    { key: 'nearMilitaryOrdnance', label: 'Within 1 mile of former military ordnance site', states: ['CA'] },
    { key: 'deathOnPropertyLast3Years', label: 'Death on property in last 3 years', states: ['CA'] },
    { key: 'knownMoldHazard', label: 'Known mold hazard', states: ['CA'] },
    { key: 'pestControlContract', label: 'Periodic pest-control service contract', states: ['CA'] },
    { key: 'sharedUtilityMeters', label: 'Shared gas/electric meters', states: ['CA'] },
    { key: 'knownAsbestos', label: 'Known asbestos-containing materials', states: ['CA'] },
    { key: 'demolitionPermitPending', label: 'Demolition permit pending', states: ['CA'] },
    { key: 'methContaminationHistory', label: 'Meth / contamination history', states: ['CA'] },
    { key: 'ab1482Exempt', label: 'AB 1482 exempt (with proper notice)', states: ['CA'] },
    { key: 'subjectToForeclosure', label: 'Subject to foreclosure proceedings', states: ['NV'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">My Properties</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-sm"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Saved portfolio
            </h3>
            {properties.length === 0 ? (
              <p className="text-sm text-gray-500">
                No properties yet. Add the rentals you own below — they will appear in the lease form dropdown.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                {properties.map((p) => (
                  <li key={p.id} className="flex justify-between items-start gap-3 p-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.label || p.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ownedPropertiesService.displayLabel(p)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {p.type} · {p.state}
                        {p.yearBuilt ? ` · built ${p.yearBuilt}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {activeId ? 'Edit property' : 'Add property'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname (optional)</label>
                <input
                  type="text"
                  value={form.label || ''}
                  onChange={(e) => updateField('label', e.target.value)}
                  placeholder="e.g. Reno duplex, Sacramento unit B"
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value as State)}
                  className={inputClass}
                >
                  <option value="CA">California</option>
                  <option value="NV">Nevada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => updateField('zipCode', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County (optional)</label>
                <input
                  type="text"
                  value={form.county || ''}
                  onChange={(e) => updateField('county', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit #</label>
                <input
                  type="text"
                  value={form.unitNumber || ''}
                  onChange={(e) => updateField('unitNumber', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value as PropertyType)}
                  className={inputClass}
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
                  value={form.yearBuilt || ''}
                  onChange={(e) =>
                    updateField('yearBuilt', parseInt(e.target.value, 10) || undefined)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Smoking Policy</label>
                <select
                  value={form.disclosureFlags.smokingPolicy}
                  onChange={(e) =>
                    updateFlag('smokingPolicy', e.target.value as SmokingPolicy)
                  }
                  className={inputClass}
                >
                  <option value="prohibited">Prohibited</option>
                  <option value="restricted">Restricted</option>
                  <option value="allowed">Allowed</option>
                </select>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Disclosure conditions (affect which lease disclosures are included)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {flagCheckboxes
                  .filter((f) => !f.states || f.states.includes(form.state))
                  .map((f) => (
                    <label key={f.key} className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(form.disclosureFlags[f.key])}
                        onChange={(e) => updateFlag(f.key, e.target.checked as never)}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {activeId ? 'Update Property' : 'Add to Portfolio'}
              </button>
              {activeId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
