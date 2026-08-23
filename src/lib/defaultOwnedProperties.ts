import { OwnedProperty, defaultDisclosureFlags } from '@/types/lease';

/** Default portfolio for first-time use (also re-seeded when storage is empty). */
export const DEFAULT_OWNED_PROPERTIES: OwnedProperty[] = [
  {
    id: 'owned-truckee-skislope',
    label: 'Truckee — Skislope Way',
    address: '12798 Skislope Way',
    city: 'Truckee',
    state: 'CA',
    zipCode: '96161',
    county: 'Nevada',
    type: 'house',
    disclosureFlags: {
      ...defaultDisclosureFlags(),
      smokingPolicy: 'prohibited',
    },
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: 'owned-fremont-mission',
    label: 'Fremont — Mission Blvd',
    address: '37391 Mission Blvd',
    city: 'Fremont',
    state: 'CA',
    zipCode: '94536',
    county: 'Alameda',
    type: 'house',
    disclosureFlags: {
      ...defaultDisclosureFlags(),
      smokingPolicy: 'prohibited',
    },
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: 'owned-reno-ruidoso',
    label: 'Reno — Ruidoso St',
    address: '3643 Ruidoso St',
    city: 'Reno',
    state: 'NV',
    zipCode: '89512',
    county: 'Washoe',
    type: 'house',
    disclosureFlags: {
      ...defaultDisclosureFlags(),
      smokingPolicy: 'prohibited',
      subjectToForeclosure: false,
    },
    createdAt: '2026-08-21T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
  },
];
