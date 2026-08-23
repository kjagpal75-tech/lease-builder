import { OwnedProperty, Property, emptyProperty, defaultDisclosureFlags } from '@/types/lease';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_OWNED_PROPERTIES } from './defaultOwnedProperties';

const STORAGE_KEY = 'lease_builder_owned_properties';

function normalizeProperty(raw: Partial<Property> & { address?: string }): Property {
  return {
    ...emptyProperty(raw.state || 'CA'),
    ...raw,
    disclosureFlags: {
      ...defaultDisclosureFlags(),
      ...(raw.disclosureFlags || {}),
    },
  };
}

function normalizeOwned(p: OwnedProperty): OwnedProperty {
  return {
    ...normalizeProperty(p),
    id: p.id,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function addressKey(p: Pick<Property, 'address' | 'city' | 'state' | 'zipCode'>): string {
  return `${p.address}|${p.city}|${p.state}|${p.zipCode}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Ensure the default portfolio addresses exist (adds any missing ones). */
function mergeDefaults(existing: OwnedProperty[]): { properties: OwnedProperty[]; changed: boolean } {
  const byId = new Set(existing.map((p) => p.id));
  const byAddress = new Set(existing.map(addressKey));
  const merged = [...existing];
  let changed = false;

  for (const def of DEFAULT_OWNED_PROPERTIES) {
    if (byId.has(def.id) || byAddress.has(addressKey(def))) continue;
    merged.push(normalizeOwned(def));
    changed = true;
  }

  return { properties: merged, changed };
}

export const ownedPropertiesService = {
  getAll(): OwnedProperty[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed: OwnedProperty[] = data ? JSON.parse(data) : [];
      const normalized = parsed.map(normalizeOwned);
      const { properties, changed } = mergeDefaults(normalized);

      if (!data || changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
      }

      return properties;
    } catch (error) {
      console.error('Error reading owned properties:', error);
      return DEFAULT_OWNED_PROPERTIES.map(normalizeOwned);
    }
  },

  save(property: Omit<OwnedProperty, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): OwnedProperty {
    const properties = ownedPropertiesService.getAll();
    const now = new Date().toISOString();
    const existingIndex = property.id
      ? properties.findIndex((p) => p.id === property.id)
      : -1;

    const saved: OwnedProperty = {
      ...normalizeProperty(property),
      id: property.id || uuidv4(),
      createdAt: existingIndex >= 0 ? properties[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      properties[existingIndex] = saved;
    } else {
      properties.push(saved);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    return saved;
  },

  delete(id: string): void {
    const filtered = ownedPropertiesService.getAll().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getById(id: string): OwnedProperty | null {
    return ownedPropertiesService.getAll().find((p) => p.id === id) || null;
  },

  displayLabel(property: Property): string {
    const name = property.label?.trim();
    const unit = property.unitNumber ? ` #${property.unitNumber}` : '';
    const line = `${property.address}${unit}, ${property.city}, ${property.state}`;
    return name ? `${name} — ${line}` : line;
  },
};
